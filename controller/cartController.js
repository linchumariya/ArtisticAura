const userModel=require("../model/userModel")
const productModel=require("../model/productModel")
const categoryModel=require("../model/categoryModel")
const cartModel=require("../model/cartModel");

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
    }
}
const postAddCart=async (req,res)=>{
    try {
        const productId=req.params.id;
        const quantity=1;
        const userId=req.session.user._id;
        const productdata=await productModel.findById(productId);
        if(!productdata||productdata.stock===0){
            return res.status(400).json({success:false,message:"product out of stock"});
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
            console.log("iam eroor",newCart)
            await productModel.findByIdAndUpdate(productId,{$inc:{stock:-quantity}})
        return res.status(200).json({success:true,message:"Items added sucessfully"})

        }else{
           const existingProductIndex=userCart.items.findIndex(item=>item.product.toString()===productId.toString());
           if(existingProductIndex!==-1){
            return res.status(200).json({success:true,message:"Item exist in the cart"})
           }else{
                userCart.items.push({
                    product:productId,
                    price:productdata.price,
                    quantity:quantity
                })
           }
           userCart.totalPrice=userCart.items.reduce((total,item)=>total+(item.price*item.quantity),0);
           await userCart.save();

           return res.status(200).json({ success: true, message: "Item added to cart successfully" });
        }




    } catch (error) {
       console.log(error) 
       return res.status(500).json({ success: false, message: "An error occurred" });
    }
}


const decart=async (req,res)=>{
    try {
        const productId = req.params.id;
        const userId = req.session.user._id;

        let userCart = await cartModel.findOne({ userId: userId });
        userCart.items = userCart.items.filter(item => item.product.toString() !== productId);
        userCart.totalPrice = userCart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
        await userCart.save();

        res.status(200).json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false });
    }
}

const updateCart = async (req, res) => {
    try {
        const productId = req.params.id;
        const { change } = req.body;
        const userId = req.session.user._id;

        let userCart = await cartModel.findOne({ userId: userId });
        if (!userCart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        const item = userCart.items.find(item => item.product.toString() === productId);
        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found in cart' });
        }

        item.quantity = parseInt(change, 10);
        if (item.quantity <= 0) {
            userCart.items = userCart.items.filter(item => item.product.toString() !== productId);
        }

        userCart.totalPrice = userCart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
        await userCart.save();

        res.status(200).json({ success: true ,item });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};



// const updateCart = async (req, res) => {
//     try {
//         const productId = req.params.id;
//         const { change } = req.body; // The selected quantity from the dropdown
//         const userId = req.session.user._id;

//         let userCart = await cartModel.findOne({ userId: userId });
//         const item = userCart.items.find(item => item.product.toString() === productId);

//         if (item) {
//             item.quantity = parseInt(change, 10); // Update the item quantity to the selected value

//             // If the quantity is set to 0, remove the item from the cart
//             if (item.quantity <= 0) {
//                 userCart.items = userCart.items.filter(item => item.product.toString() !== productId);
//             }

//             // Recalculate the total price of the cart
//             userCart.totalPrice = userCart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
//             await userCart.save();
//         }

//         res.status(200).json({ success: true });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ success: false });
//     }
// };



// const updateCart=async(req,res)=>{
//     try {
//         const productId = req.params.id;
//         const { change } = req.body;
//         const userId = req.session.user._id;

//         let userCart = await cartModel.findOne({ userId: userId });
//         const item = userCart.items.find(item => item.product.toString() === productId);

//         if (item) {

//             const newQuantity = parseInt(change);

//             // Check if the new quantity is valid and does not exceed the available stock
//             if (newQuantity > 0 && newQuantity <= item.product.stock) {
//                 item.quantity = newQuantity;
//             } else {
//                 return res.status(400).json({ success: false, message: "Invalid quantity selected" });
//             }

//             // If the quantity becomes zero, remove the item from the cart
//             if (item.quantity <= 0) {
//                 userCart.items = userCart.items.filter(item => item.product.toString() !== productId);
//             }

//             // Recalculate the total price
//             userCart.totalPrice = userCart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
//             await userCart.save();

//             return res.status(200).json({ success: true });

//         } else {
//             return res.status(400).json({ success: false, message: "Item not found in cart" });
//         }
       
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ success: false });
//     }
// }

module.exports = {getCart,postAddCart,decart,updateCart,}