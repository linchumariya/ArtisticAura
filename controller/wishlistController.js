
const bcrypt = require("bcrypt");

const User  = require('../model/userModel')
const Product  = require('../model/productModel')
const Category = require('../model/categoryModel')

const Cart = require('../model/cartModel')

const isUser = require('../middleware/user')
const Wishlist = require('../model/wishlistModel')





    const getWishlist = async (req, res, next) => {
        try {
            const userId = req.session.user._id;
            
            const wishlist = await Wishlist.findOne({ userId: userId }).populate({path: 'items.product',
                model: 'Product'});

                console.log("whishlist",wishlist)
    
            if (!wishlist || !wishlist.items || wishlist.items.length === 0) {
                return res.render('user/wishlist', {
                    title: 'Wishlist',
                    user: req.session,
                    wishlist: null
                });
            }
    
            // Sort wishlist items by wishlistDate
            wishlist.items.sort((a, b) => b.wishlistDate - a.wishlistDate);
    
            res.render('user/wishlist', {
                title: 'Wishlist',
                wishlist: wishlist,
                user: req.session.user
            });
        } catch (error) {
            next(error);
        }
    };



    const postAddToWishlist=async (req, res, next) => {
        try {
            console.log("enter in to wishlist")
            const userid=req.session.user;
            console.log("iam user my id is",userid)
            if (!req.session.user) {
                return res.status(401).json({ success: false, message: "Please log in to add items to your wishlist" });
            }
    
            const userId = req.session.user._id;
            const productId = req.params.id;
            const quantity = 1;
    
            const product = await Product.findById(productId);
            console.log("product",product)
    
            if (!product) {
                return res.status(404).json({ success: false, message: "Product not found" });
            }
    
            let userWishlist = await Wishlist.findOne({ userId: userId });
    
            if (!userWishlist) {
                const newWishlist = new Wishlist({
                    userId: userId,
                    items: [{
                        product: productId,
                        price: product.price,
                        quantity: quantity
                    }]
                });
    
               const savewishlist= await newWishlist.save();
               console.log("savewishlist",savewishlist)
               return res.status(200).json({ success: true, message: "Added to Wishlist." });
             
            } else {
                const existingProduct = userWishlist.items.find(
                    (item) => item.product.toString() === productId.toString()
                );
                    console.log("exist ",existingProduct)
                if (existingProduct) {
                    return res.status(409).json({ success: false, message: "Product already exists in wishlist" });
                } else {
                    userWishlist.items.push({
                        product: productId,
                        price: product.price,
                        quantity: quantity
                    });
    
                    await userWishlist.save();
                }
            }
    
            return res.status(200).json({ success: true, message: "Added to Wishlist." });
    
        } catch(error) {
            console.error("Error in adding to wishlist:", error);
    return res.status(500).json({ success: false, message: "An error occurred while adding to wishlist." });
        }
    };

    const deleteWishlist=async (req, res, next) => {
        try {
            console.log("entering in to delte ")
            const userId = req.session.user._id;
            console.log(userId)
            let productId = req.params.Id;
            

            console.log("produ",productId)


            let result = await Wishlist.findOneAndUpdate(
                { userId:userId },
                { $pull: { items: {  product: productId} } },
                { new: true }
              )  
              console.log("result",result)
             return  res.status(200).json({ success: true, message: "Added to Wishlist." });
        } catch (error) {
            console.log(error)
        }
    };
    
   
    

    




module.exports = {getWishlist,postAddToWishlist,deleteWishlist};