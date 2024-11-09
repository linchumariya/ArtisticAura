const userModel=require("../model/userModel")
const productModel=require("../model/productModel")
const categoryModel=require("../model/categoryModel")
const cartModel=require("../model/cartModel");
const STATUS_CODES=require("../helper/statusCode")
const isUser=require("../middleware/user");


const getCart=async (req,res)=>{
    try {
        const userId=req.session.user._id;
        const user=req.session.user
        const userCart=await cartModel.findOne({userId:userId}).populate({path:'items.product',model:"Product"});
        res.render('user/cart',{
            user:req.session.user||req.user,
            userCart,
        })

    } catch (error) {
        console.error(error)
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "Failed to load cart" });
    }
}
const postAddCart=async (req,res)=>{
    try {
        const productId=req.params.id;
        const quantity=1;
        const userId=req.session.user._id;
        const productdata=await productModel.findById(productId);
        if(!productdata||productdata.stock===0){
            return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: "Product out of stock" });
        }
        let userCart=await cartModel.findOne({userId:userId})
        if(!userCart){
            const newCart= new cartModel({
                userId:userId,
                items:[{
                    product:productId,
                    price:productdata.price,
                    quantity:quantity,
                }],
                totalPrice:productdata.price*quantity,
            });
            await newCart.save();
            // await productModel.findByIdAndUpdate(productId,{$inc:{stock:-quantity}})
            return res.status(STATUS_CODES.CREATED).json({ success: true, message: "Item added to cart successfully" });

        }else{
           const existingProductIndex=userCart.items.findIndex(item=>item.product.toString()===productId.toString());
           if(existingProductIndex!==-1){
            return res.status(STATUS_CODES.CONFLICT).json({ success: false, message: "Item already exists in the cart" });
           }else{
                userCart.items.push({
                    product:productId,
                    price:productdata.price,
                    quantity:quantity
                })
           }
           userCart.totalPrice=userCart.items.reduce((total,item)=>total+(item.price*item.quantity),0);
           await userCart.save();
            return res.status(STATUS_CODES.OK).json({ success: true, message: "Item added to cart successfully" });
        }

    } catch (error) {
       console.log(error) 
       return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "An error occurred while adding item to cart" });
    }
}


const decart=async (req,res)=>{
    try {
        const productId = req.params.id;
        const userId = req.session.user._id;
        let userCart = await cartModel.findOne({ userId: userId });
        if (!userCart) {
            return res.status(STATUS_CODES.NOT_FOUND).json({ success: false, message: "Cart not found" });
        }
        userCart.items = userCart.items.filter(item => item.product.toString() !== productId);
        userCart.totalPrice = userCart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
        await userCart.save();
        res.status(STATUS_CODES.OK).json({ success: true, message: "Item removed from cart successfully" });
    } catch (error) {
        console.error(error);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "An error occurred while removing item from cart" });
    }
}

const updateCart = async (req, res) => {
    try {
        const productId = req.params.id;
        const { change } = req.body;
        const userId = req.session.user._id;
        let userCart = await cartModel.findOne({ userId: userId });
        if (!userCart) {
            return res.status(STATUS_CODES.NOT_FOUND).json({ success: false, message: 'Cart not found' });
        }

        const item = userCart.items.find(item => item.product.toString() === productId);
        if (!item) {
            return res.status(STATUS_CODES.NOT_FOUND).json({ success: false, message: 'Item not found in cart' });
        }

        item.quantity = parseInt(change, 10);
        if (item.quantity <= 0) {
            userCart.items = userCart.items.filter(item => item.product.toString() !== productId);
        }
        userCart.totalPrice = userCart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
        await userCart.save();
        res.status(STATUS_CODES.OK).json({ success: true, message: "Cart updated successfully", item });
    } catch (error) {
        console.error(error);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: 'An error occurred while updating cart' });
    }
};




module.exports = {getCart,
    postAddCart,
    decart,
    updateCart,}