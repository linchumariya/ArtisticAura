const userModel=require('../model/userModel')
const productModel=require('../model/productModel')
const categoryModel=require('../model/categoryModel')
const cartModel=require('../model/cartModel')
const orderModel=require('../model/orderModel')
const addressModel=require('../model/addressModel')
 
const isUser=require('../middleware/user')

const getCheckout = async (req, res) => {
    try {
        const userId = req.session.user;

     
        const userCart = await cartModel.findOne({ userId }).populate({path:'items.product',model:"Product"});
        console.log(userCart)

       
        const userAddresses = await addressModel.findOne({ userId });

        if (!userCart || userCart.items.length === 0) {
            return res.redirect('/cart'); // Redirect to cart if empty
        }

        res.render('user/checkout', {
            user: req.session.user || req.user,
            userCart,
            userAddresses: userAddresses ? userAddresses.addresses : []
        });
    } catch (error) {
        console.error('Error in getCheckout:', error);
        res.status(500).send('Server Error');
    }
};

const postCheckout = async (req, res) => {
    try {
        const userId = req.session.user._id;

        const { addressId, paymentMethod } = req.body;

        const userCart = await cartModel.findOne({ userId }).populate({path:'items.product',model:"Product"});

        const selectedAddress = await addressModel.findOne({ userId, 'addresses._id': addressId });

        const billingAddress = selectedAddress.addresses.find(addr => addr._id.toString() === addressId);

        if (!userCart || !billingAddress || userCart.items.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid order details' });
        }

        const newOrder = new orderModel({
            userId:userId,
            items: userCart.items.map(item => ({
                product: item.product._id,
                price: item.price,
                quantity: item.quantity
            })),
            totalPrice: userCart.totalPrice,
            billingdetails: billingAddress,
            paymentMethod
        });

        await newOrder.save();
        console.log("im new order",newOrder)

        
        for (let item of userCart.items) {
            await productModel.findByIdAndUpdate(item.product._id, { $inc: { stock: -item.quantity } });
        }
        await cartModel.findOneAndDelete({ userId });
        return res.redirect('/');
        
    } catch (error) {
        console.error('Error in postPlaceOrder:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

const getMyOrder=async(req,res)=>{
    try {

        const userId=req.session.user;
        const orderdata=await orderModel.find({userId:userId}).populate({path:'items.product',model:"Product"}).sort({orderDate:-1});
        console.log("my oder in ordr in profile is",orderdata);
        res.render('user/myOrders',{
            user:req.session,
            data:orderdata,

        })
        
    } catch (error) {
        
    }
}


module.exports = {
  postCheckout,
  getCheckout,
  getMyOrder
};
