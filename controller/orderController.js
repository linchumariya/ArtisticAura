const userModel = require("../model/userModel");
const productModel = require("../model/productModel");
const categoryModel = require("../model/categoryModel");
const cartModel = require("../model/cartModel");
const orderModel = require("../model/orderModel");
const addressModel = require("../model/addressModel");
const paymentHelper = require("../helper/paymenthelper");
const couponmodel = require("../model/couponModel");
const mongoose=require("mongoose")
require("dotenv").config();
const isUser = require("../middleware/user");
const couponModel = require("../model/couponModel");
const walletModel = require("../model/walletModel");
const STATUS_CODES=require("../helper/statusCode")
const easyinvoice = require('easyinvoice');
const fs = require('fs');

const getCheckout = async (req, res) => {
  try {
    const userId = req.session.user;
    const coupon = await couponModel.find();
    const userCart = await cartModel
      .findOne({ userId })
      .populate({ path: "items.product", model: "Product" });
    const userAddresses = await addressModel.findOne({ userId });
    const wallet = await walletModel.findOne({ userId });
    if (!userCart || userCart.items.length === 0) {
      return res.redirect("/cart"); 
    }

    res.render("user/checkout", {
      user: req.session.user || req.user,
      userCart,
      userAddresses: userAddresses ? userAddresses.addresses : [],
      coupon: coupon,
      walletBalance: wallet?.balance ? wallet.balance : 0,
    });
  } catch (error) {
    console.error("Error in getCheckout:", error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send("Server Error");
  }
};

const postCheckout = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { addressId, paymentMethod, couponCode, walletAmount, referalCode ,paymentStatus,orderId} =
      req.body;
    const orderIdd = req.body.orderId; 

    if (orderIdd) {
      const paymentStatus = req.body.paymentStatus;
    const objectId = new mongoose.Types.ObjectId(orderIdd);
    console.log(objectId)
    const order = await orderModel.findByIdAndUpdate(objectId, {
      $set: { paymentStatus: paymentStatus }
    }, { new: true });
    console.log(order)
    }
    const userCart = await cartModel
      .findOne({ userId })
      .populate({ path: "items.product", model: "Product" });

    const selectedAddress = await addressModel.findOne({
      userId,
      "addresses._id": addressId,
    });

    const billingAddress = selectedAddress.addresses.find(
      (addr) => addr._id.toString() === addressId
    );

    if (!userCart || !billingAddress || userCart.items.length === 0) {
      return res
      .status(STATUS_CODES.BAD_REQUEST)
        .json({ success: false, message: "Invalid order details" });
    }
    for (const cartItem of userCart.items) {
      const product = cartItem.product;
      const cartQuantity = cartItem.quantity;

      if (product.stock < cartQuantity) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
          success: false,
          message: `Not enough stock for ${product.productName}. Available stock: ${product.stock}, but you have ${cartQuantity} in your cart.`,
        });
      }
    }
    const user = req.session.user;

    let amountPayable = userCart.totalPrice;
    let discountAmount = 0;
    if (couponCode) {
      const coupon = await couponModel.findOne({ coupon: couponCode });
      const percentageDiscount = Math.ceil((amountPayable * coupon.percentage) / 100);
      // console.log("percentag",percentageDiscount)
      discountAmount = percentageDiscount > coupon.maximumAmount ? coupon.maximumAmount : percentageDiscount;
      // console.log("iam discount",discountAmount)
      // if (amountPayable > coupon.maximumAmount) {
      //   discountAmount = coupon.maximumAmount;
      // } else {
      //   discountAmount = Math.ceil((amountPayable * coupon.percentage) / 100);
      // }
      amountPayable -= discountAmount;
      // console.log("amount payable",amountPayable)
    }
    const wallet = await walletModel.findOne({ userId });
    let walletBalance = wallet.balance||0;
    let walletUsed = 0;
    if (walletAmount > 0 && walletBalance > 0) {
      if (walletBalance >= amountPayable) {
        walletUsed = amountPayable;
        amountPayable = 0;
      } else {
        walletUsed = walletBalance;
        amountPayable = amountPayable - walletBalance;
      }
      wallet.balance -= walletUsed;
      wallet.transactions.push({
        type: 'debit',
        amount: walletUsed,
        description: 'Order payment',
      });

      await wallet.save();
    }
   
    const newOrder = new orderModel({
      userId: userId,
      items: userCart.items.map((item) => ({
        product: item.product._id,
        price: item.price,
        quantity: item.quantity,
      })),
      totalPrice: userCart.totalPrice,
      amountPayable: amountPayable,
      discountAmount: discountAmount,
      walletUsed: walletUsed,
      billingdetails: {
        name: user.name,
        buildingname: billingAddress.buildingname,
        street: billingAddress.street || "", // Handle case if street is optional
        city: billingAddress.city,
        state: billingAddress.state,
        country: billingAddress.country,
        postalCode: billingAddress.pincode,
        phone: user.phone,
        email: user.email,
      },
      paymentMethod,
    });

    const ordered = await newOrder.save();
    console.log("Order palced");

    for (const item of userCart.items) {
      await productModel.updateOne(
        { _id: item.product },
        { $inc: { stock: -item.quantity } }
      );
      console.log("updated order stock");
    }

    await cartModel.deleteOne({ userId: userId });
    const orderCount = await orderModel.countDocuments({ userId });
    if (orderCount === 1 && referalCode) {
      const referredUser = await userModel.findOne({ "referalCode.code": referalCode });
      if (referredUser) {
        await walletModel.updateOne(
          { userId: referredUser._id },
          { $inc: { balance: 1000 }, $push: { transactions: { type: 'credit', amount: 1000, description: 'Referral bonus' } } }
        );
        
        await walletModel.updateOne(
          { userId },
          { $inc: { balance: 1000 }, $set: { "referalCode.redeemStatus": true }, $push: { transactions: { type: 'credit', amount: 1000, description: 'Referral bonus for first order' } } }
        );
       
      }
    }


    if (paymentMethod === "Razorpay") {
      const razorpayOrder = await paymentHelper.createRazorpayOrder(
        ordered._id,
        amountPayable
      );
      console.log("success");
      return res.status(STATUS_CODES.OK).json({ payment: razorpayOrder, success: true });
    } else {
      console.log("COD");
      return res.status(STATUS_CODES.OK).json({ payment: "COD", success: true });
    }
  } catch (error) {
    console.error("Error in postPlaceOrder:", error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "Server Error" });
  }
};

const getMyOrder = async (req, res) => {
  try {
    const userId = req.session.user;
    const orderdata = await orderModel
      .find({ userId: userId })
      .populate({ path: "items.product", model: "Product" })
      .sort({ orderDate: -1 });

    res.render("user/myOrders", {
      user: req.session,
      userData:req.session.user,
      data: orderdata,
    });
  } catch (error) {
    console.error("Error in getMyOrder:", error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ message: "Server error" });
  }
};
const getOrderDetails = async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.session.user._id;
    const orders = await orderModel
      .findOne({ _id: orderId })
      .populate("items.product");
    const user = await orderModel.findOne({ userId: userId });
    res.render("user/orderDetails", {
      user: req.session,
      order: orders,
      users: user,
    });
  } catch (error) {
    console.error("Error in getOrderDetails:", error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ message: "Server error" });
  }
};

const getConfirmOrder = async (req, res, next) => {
  try {
    const { user } = req.session;
    res.render("user/thankyou");
  } catch (error) {
    console.error("Error in getConfirmOrder:", error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ message: "Server error" });
  }
};
const generateInvoice= async function(orderId){
  try {
    const order = await orderModel.findById(orderId).populate('items.product');
    if (!order) {
      throw new Error('Order not found');
    }
    const products = order.items.map(item => ({
      quantity: item.quantity,
      description: item.product.productName,
      price: item.price,
      tax: 18,
    }));
    const invoiceData = {
      documentTitle: "INVOICE",
      currency: "INR",
      taxNotation: "gst",
      sender: {
        company: "Artistic Aura",
        address: "Priya Nagar Street",
        city: "Ernakulam",
        zip: "683572",
        country: "India",
      },
      client: {
        company: order.billingdetails.name,
        address: `${order.billingdetails.street}, ${order.billingdetails.buildingname}`,
        city: order.billingdetails.city,
        zip: order.billingdetails.postalCode,
        country: order.billingdetails.country,
      },
      invoiceNumber: order.trackingId,
      invoiceDate: order.orderDate,
      products: products,
      bottomNotice: "Thank you for your purchase!",
      totalAmount: order.totalPrice,
      discount: order.discountAmount,
      walletUsed: order.walletUsed,
    };
    const invoiceResult = await easyinvoice.createInvoice(invoiceData);
    return invoiceResult.pdf;

  } catch (error) {
    console.error("Error generating invoice:", error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ message: "Server error" });
    throw error;
  }

}
const downloadInvoice= async (req, res) => {
  const { orderId } = req.params;
  try {
    
    const pdfBase64 = await generateInvoice(orderId);
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=invoice.pdf');
     res.status(STATUS_CODES.OK).send(pdfBuffer);

  } catch (error) {
    console.error("Error downloading invoice:", error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send('Could not generate the invoice');
  }}



const applyCoupon = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { couponCode, action } = req.body;
    const user = await userModel.findById(userId);
    const cart = await cartModel.findOne({ userId: userId });
    const coupon = await couponModel.findOne({ coupon: couponCode });
    const coupid = coupon._id;

    if (action === "apply") {
      const hasUsedCoupon = user.usedCoupons.includes(coupid);
      if (hasUsedCoupon) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "Coupon already used" });
      }

      if (coupon.expiryDate && coupon.expiryDate < Date.now()) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "Coupon has expired" });
      }
      if (!coupon) {
        return res.status(STATUS_CODES.NOT_FOUND).json({ message: "Coupon not found" });
      }

      // const totalAmount = cart.totalPrice;
      // console.log("ta",totalAmount)
      // let discountAmount =
      //   totalAmount > coupon.maximumAmount
      //     ? coupon.maximumAmount
      //     : Math.ceil((totalAmount * coupon.percentage) / 100);
      //     console.log("da",discountAmount)
      //     console.log("coupon",Math.ceil((totalAmount * coupon.percentage) / 100))
      const totalAmount = cart.totalPrice;
      const percentageDiscount = Math.ceil((totalAmount * coupon.percentage) / 100);
      const discountAmount = percentageDiscount > coupon.maximumAmount ? coupon.maximumAmount : percentageDiscount;
      const amountToPay = totalAmount - discountAmount;
      // const amountToPay = totalAmount - discountAmount;
      user.usedCoupons.push(coupon._id);
      const data = await user.save();
      return res.status(STATUS_CODES.OK).json({
        success: true,
        totalAmount: amountToPay,
        couponId: req.body.couponCode,
        discountAmount: discountAmount,
      });
    } else if (action === "remove") {
      const couponIndex = user.usedCoupons.findIndex(
        (coupon) => coupon.toString() === coupid.toString()
      );
      if (couponIndex !== -1) {
        user.usedCoupons.splice(couponIndex, 1);
        const data = await user.save();
        console.log("iam deleted coupon", data);
      }

    
      const originalTotalPrice = cart.totalPrice;
      console.log("iam deleted price ", originalTotalPrice);
      return res.status(STATUS_CODES.OK).json({
        success: true,
        totalAmount: originalTotalPrice,
        discountAmount: 0,
      });
    } else {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "Invalid action" });
    }
  } catch (error) {
    console.log(error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ message: "Server error" });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const userWallet = await walletModel.findOne({ userId: userId });
    const { orderId, productId } = req.body;
    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ message: "Order not found" });
    }
    const cancelProduct = order.items.find(
      (item) => item.product.toString() === productId
    );
    if (!cancelProduct) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ message: "Product not found in order" });
    }
    const canceledD = await productModel.findByIdAndUpdate(
      cancelProduct.product,
      { $inc: { stock: cancelProduct.quantity } }
    );
    cancelProduct.status = "Cancelled";

    const doneO = await order.save();
    let finalAmount;
    if (order.discountAmount > 0) {
      let divededAmount = Math.floor(order.discountAmount / order.items.length);
      finalAmount = cancelProduct.price - divededAmount;
    } else {
      finalAmount = cancelProduct.price;
    }

    userWallet.balance += finalAmount;
    userWallet.transactions.push({
      type: 'credit',
      amount: finalAmount,
      description: `Refund for cancelled product: ${cancelProduct.product}`,
    });
    let triggerO = await userWallet.save();
    return res.status(STATUS_CODES.OK).json({ message: "Product Cancelled Successfully", cancelProduct });
  } catch (error) {
    console.log(error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ message: "Server error" });
  }
};
const returnOrder = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const userWallet = await walletModel.findOne({ userId: userId });
    const { orderId, productId } = req.body;
    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ message: "Order not found" });
    }
    const returnProduct = order.items.find(
      (item) => item.product.toString() === productId
    );
    console.log(returnProduct);
    if (!returnProduct) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ message: "Product not found in order" });
    }
    await productModel.findByIdAndUpdate(returnProduct.product, {
      $inc: { stock: returnProduct.quantity },
    });

    returnProduct.status = "Returned";
   await order.save();
    let finalAmount;
    if (order.discountAmount > 0) {
      let divededAmount = order.discountAmount / order.items.length;
      finalAmount = returnProduct.price - divededAmount;
    } else {
      finalAmount = returnProduct.price;
    }

    userWallet.balance += finalAmount;
    userWallet.transactions.push({
      type: 'credit',
      amount: finalAmount,
      description: `Refund for returned product: ${returnProduct.product}`,
    });

    await userWallet.save();

    return res.status(STATUS_CODES.OK).json({ message: "Product Returned Successfully", returnProduct });
  } catch (error) {
    console.log(error);
  }
};
const retryPayment=async(req,res)=>{
  try {
    const userId = req.session.user._id;
    const orderId = req.body.orderId;
    if (orderId) {
    
    const objectId = new mongoose.Types.ObjectId(orderId);
    const order = await orderModel.findByIdAndUpdate(objectId, {
      $set: { paymentStatus: "Paid" }
    }, { new: true });
    }
  } catch (error) {
      console.error("Error in postPlaceOrder:", error);
      res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "Server Error" });
    
  }
}

module.exports = {
  postCheckout,
  getCheckout,
  getMyOrder,
  getOrderDetails,
  getConfirmOrder,
  applyCoupon,
  returnOrder,
  cancelOrder,
  downloadInvoice,
  retryPayment
};
