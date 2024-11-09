const Admin=require("../model/adminModel")
const bcrypt=require("bcrypt")
const orderModel=require("../model/orderModel")
const Product=require("../model/productModel")
const Category = require("../model/categoryModel")
const userModel=require("../model/userModel")
const STATUS_CODES=require("../helper/statusCode")
const secretPassword=async(password)=>{
    try {
        const passHash=await bcrypt.hash(password,10)
         return passHash;
    } catch (error) {
        console.error("Error hashing password:", error);
        throw new Error(STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
}
const adminloginLoad=async(req,res)=>{
    try {
        res.status(STATUS_CODES.OK).render("admin/admin-login");
    } catch (error) {
        console.error("Error loading admin login:", error);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send("Internal Server Error");
    }
}
const adminDash= async (req, res, next) => {
  try {
          const ordersPie = await chart()
          const ordersGraph = await monthgraph();
          const ordersYearGraph = await yeargraph();
      const users = await userModel.find();
      const orders = await orderModel.find().populate('items.product').sort({ orderDate: -1 });
      const products = await Product.find();
      const categories = await Category.find(); 
      const currentDate = new Date().toISOString().split('T')[0];
      const paidOrders = orders.filter(order => order.paymentStatus === "Paid");
      const badOrders = orders.filter(order => order.paymentStatus !== "Failed" && order.status !== "Cancelled");
      let revenue = 0;
      paidOrders.forEach(order => {
          revenue += order.totalPrice;
      });
      const salesCount = await orderModel.aggregate([
          { $match: { 'items.status': 'Delivered' } },
          { $count: 'salesCount' }
      ]);
      let count = salesCount.length > 0 ? salesCount[0].salesCount : 0;
      const orderSum = await orderModel.aggregate([
          { $group: { _id: null, totalAmount: { $sum: '$totalPrice' } } }
      ]);
      let orderAmount = orderSum.length > 0 ? orderSum[0].totalAmount : 0;
      const categoryCountResult = await Category.aggregate([
          { $count: 'totalCategories' }
      ]);
      let categoryCount = categoryCountResult.length > 0 ? categoryCountResult[0].totalCategories : 0;
      const discountSum = await orderModel.aggregate([
          { $group: { _id: null, discountAmount: { $sum: '$discountAmount' } } }
      ]);

      let discountAmount = discountSum.length > 0 ? discountSum[0].discountAmount : 0;
      const productsNumberResult = await Product.aggregate([
          { $count: 'totalProducts' }
      ]);

      let productsNumber = productsNumberResult.length > 0 ? productsNumberResult[0].totalProducts : 0;
       req.session.admin = true;
    const bestSellingProducts = await getBestSellingProducts();
    const bestSellingCategories = await getBestSellingCategories();
    
      res.render('admin/dashboard', {
          title: 'Dashboard',
          currentDate: currentDate,
          count,
          orderAmount,
          discountAmount,
          order: orders,  
          productsNumber,
          categories: categoryCount,  
          revenue: revenue.toFixed(2),
          orders: badOrders,
          products: products,
          users: users,

          ordersPie:ordersPie,
          ordersGraph: ordersGraph,
          ordersYearGraph: ordersYearGraph,
          bestSellingProducts,
          bestSellingCategories,
         
      });
  } catch (err) {
    console.error(err);
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send("Internal Server Error");
  }
}

const getBestSellingProducts =async () => {
    return await orderModel.aggregate([
                        
    { $unwind: "$items" },

    {
      $group: {
        _id: "$items.product",
        totalSold: { $sum: "$items.quantity" } 
      }
    },
    { $sort: { totalSold: -1 } },
    {$limit:5},
    {
      $lookup: {
        from: "products", 
        localField: "_id", 
        foreignField: "_id", 
        as: "productDetails" 
      }
    },
    { $unwind: "$productDetails" },
    {
      $project: {
        _id: 0, 
        productId: "$_id", 
        totalSold: 1, 
        productName: "$productDetails.productName",
        price: "$productDetails.price" 
      }
    },
  ]);
}
 
  const getBestSellingCategories = async () => {
    return await orderModel.aggregate([
    
    { $unwind: "$items" },
    {
      $lookup: {
        from: "products", 
        localField: "items.product", 
        foreignField: "_id",
        as: "productDetails" 
      }
    },
    { $unwind: "$productDetails" },
    {
      $group: {
        _id: "$productDetails.category",
        totalSold: { $sum: "$items.quantity" } 
      }
    },
    { $sort: { totalSold: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: "categories", 
        localField: "_id",
        foreignField: "_id", 
        as: "categoryDetails" 
      }
    },
    { $unwind: "$categoryDetails" },
    {
      $project: {
        _id: 0,
        categoryId: "$_id", 
        totalSold: 1, 
        categoryName: "$categoryDetails.name" 
      }
    }
  ]);
}
const generateReport =async (req,res) => {
  try {
    const { startDate, endDate } = req.body;

    const endDateObj = new Date(endDate);
    endDateObj.setDate(endDateObj.getDate() + 1);
      const orders = await orderModel.aggregate([
          { $match: { orderDate: { $gte: new Date(startDate), $lte: new Date(endDateObj) } } },
          { $unwind: "$items" },
          { $lookup: {
              from: "products",
              localField: "items.product",
              foreignField: "_id",
              as: "items.product"
          }},
          { $addFields: { "items.product": { $arrayElemAt: ["$items.product", 0] } }},
          { $group: {
              _id: "$_id",
              userId: { $first: "$userId" },
              items: { $push: "$items" },
              totalPrice: { $first: "$totalprice" },
              couponDiscount: { $first: "$discountAmount" },
              billingDetails: { $first: "$billingdetails" },
              paymentStatus: { $first: "$paymentStatus" },
              orderDate: { $first: "$orderDate" },
              paymentMethod: { $first: "$paymentMethod" }
          }}
      ]);

      const reportData = orders.map((order) => {
          let totalPrice = 0;
          order.items.forEach(product => {
              totalPrice += product.price * product.quantity;
          });
          return {
              orderId: order._id,
              date: order.orderDate,
              totalPrice,
              products: order.items.map(product => ({
                  productName: product.productName,
                  quantity: product.quantity,
                  price: product.price
              })),
              firstName: order.billingDetails.name,
              address: order.billingDetails.city,
              paymentMethod: order.paymentMethod,
              paymentStatus: order.paymentStatus
          };
      });
      res.status(STATUS_CODES.OK).json({ reportData });
  } catch (err) {
    console.error("Error generating report:", error);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send("Error generating report");
  }
};
const postAdminLogin=async(req,res)=>{
    try {
        const {email,password}=req.body;
        if(email==='admin@gmail.com'&& password==='12345'){
            const admin=await Admin.findOne({email});
            if(admin){
                const isMatch=await bcrypt.compare(password,admin.password);
                if(isMatch){
                  req.session.admin = true;
            
                  return res.status(STATUS_CODES.OK).redirect('/dashboard');
                    
                }else{
                    return res.status(STATUS_CODES.UNAUTHORIZED).send("Invalid password");
                }
            }else{
                const hashedPassword = await secretPassword('12345');
            const newAdmin=new Admin({
                email:"admin@gmail.com",
                password:hashedPassword,
            });
             await newAdmin.save();
             req.session.admin = true;
             return res.status(STATUS_CODES.OK).send("Admin logged in successfully!");
        }}
        else{
            return res.status(STATUS_CODES.UNAUTHORIZED).send("Invalid email or password");
        }
    } catch (error) {
        console.error("Error during admin login:", error);
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send("Internal Server Error");
    }
};

async function chart() {
  try {
      const orders = await orderModel.find();
      const paymentMethods = {
          cashOnDelivery: 'COD',
          razorPay: 'Razorpay',
          wallet: 'Wallet'
      };
      const ordersCount = {
          cashOnDelivery: 0,
          razorPay: 0,
          wallet: 0
      };

      orders.forEach(order => {
          if (order.paymentMethod === paymentMethods.cashOnDelivery) {
              ordersCount.cashOnDelivery++;
          } else if (order.paymentMethod === paymentMethods.razorPay) {
              ordersCount.razorPay++;
          } else if (order.paymentMethod === paymentMethods.wallet) {
              ordersCount.wallet++;
          }
      });
      const labels = Object.keys(ordersCount);  
      const data = Object.values(ordersCount); 
      return { labels, data }; 
  } 
  catch (error) {
      console.error("An error occurred in the chart function:", error.message);
      throw error;
  }
}



async function monthgraph() {
  try {
      const ordersCountByMonth = await orderModel.aggregate([
          {
              $project: {
                  yearMonth: {
                      $dateToString: {
                          format: "%Y-%m",
                          date: "$orderDate"
                      }
                  }
              }
          },
          {
              $group: {
                  _id: "$yearMonth",
                  count: { $sum: 1 }
              }
          },
          {
              $sort: { _id: 1 }
          }
      ]);

      const labels = ordersCountByMonth.map(val => val._id);
      const count = ordersCountByMonth.map(val => val.count);

      return {
          labels: labels,
          count: count
      };
  } catch (error) {
      console.log('Error retrieving orders in monthgraph function:', error.message);
      throw error;
  }
}

async function yeargraph() {
  try {
      const ordersCountByYear = await orderModel.aggregate([
          {
              $project: {
                  year: { $year: { date: '$orderDate' } },
              },
          },
          {
              $group: {
                  _id: '$year',
                  count: { $sum: 1 },
              },
          },
          {
              $sort: { _id: 1 },
          },
      ]);

      const labels = ordersCountByYear.map((val) => val._id.toString());
      const count = ordersCountByYear.map((val) => val.count);

      return {
          labels: labels,
          count: count
      };
  } catch (error) {
      console.log('Error retrieving orders in yeargraph function:', error.message);
      throw error;
  }
}



module.exports={
    adminloginLoad,
    postAdminLogin,
    adminDash,
    generateReport
   
   
}