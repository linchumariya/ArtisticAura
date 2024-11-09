const bcrypt = require("bcrypt");
const User  = require('../model/userModel')
const Product  = require('../model/productModel')
const Category = require('../model/categoryModel')
const Cart = require('../model/cartModel')
const isUser = require('../middleware/user')
const Wishlist = require('../model/wishlistModel')
const STATUS_CODES = require("../helper/statusCode");

    const getWishlist = async (req, res, next) => {
        try {
            const userId = req.session.user._id;
            const wishlist = await Wishlist.findOne({ userId: userId }).populate({path: 'items.product',
                model: 'Product'});
            if (!wishlist || !wishlist.items || wishlist.items.length === 0) {
                return res.render('user/wishlist', {
                    title: 'Wishlist',
                    user: req.session,
                    wishlist: null
                });
            }
            wishlist.items.sort((a, b) => b.wishlistDate - a.wishlistDate);
            return res.status(STATUS_CODES.OK).render('user/wishlist', {
                title: 'Wishlist',
                wishlist: wishlist,
                user: req.session.user
            });
        } catch (error) {
            console.error("Error retrieving wishlist:", error);
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to load wishlist."
    }); 
        }
    };
    const postAddToWishlist=async (req, res, next) => {
        try {
            const userid=req.session.user;
            if (!req.session.user) {
                return res.status(STATUS_CODES.UNAUTHORIZED).json({ success: false, message: "Please log in to add items to your wishlist" });
            }
            const userId = req.session.user._id;
            const productId = req.params.id;
            const quantity = 1;
            const product = await Product.findById(productId);
    
            if (!product) {
                return res.status(STATUS_CODES.NOT_FOUND).json({ success: false, message: "Product not found" });
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
               return res.status(STATUS_CODES.OK).json({ success: true, message: "Added to Wishlist." });
             
            } else {
                const existingProduct = userWishlist.items.find(
                    (item) => item.product.toString() === productId.toString()
                );
                    console.log("exist ",existingProduct)
                if (existingProduct) {
                    return res.status(STATUS_CODES.CONFLICT).json({ success: false, message: "Product already exists in wishlist" });
                } else {
                    userWishlist.items.push({
                        product: productId,
                        price: product.price,
                        quantity: quantity
                    });
    
                    await userWishlist.save();
                }
            }
            return res.status(STATUS_CODES.OK).json({ success: true, message: "Added to Wishlist." });
    
        } catch(error) {
            console.error("Error in adding to wishlist:", error);
            return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "An error occurred while adding to wishlist." });
        }
    };

    const deleteWishlist=async (req, res, next) => {
        try {
            const userId = req.session.user._id;
            console.log(userId)
            let productId = req.params.Id;
            let result = await Wishlist.findOneAndUpdate(
                { userId:userId },
                { $pull: { items: {  product: productId} } },
                { new: true }
              )  
              console.log("result",result)
              return res.status(STATUS_CODES.OK).json({ success: true, message: "Removed from Wishlist." });
        } catch (error) {
            console.log(error)
            return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "Failed to remove item from wishlist" });
        }
    };
    
   
module.exports = {getWishlist,
    postAddToWishlist,
    deleteWishlist};