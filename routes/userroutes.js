 
 const express=require("express")
 const userRoute=express.Router()
 const UserMw=require("../middleware/user")
const usercontroller=require("../controller/usercontroller")
const cartcontroller=require("../controller/cartController")
const addresscontroller=require("../controller/addressController")
const wishlistController=require('../controller/wishlistController')
const orderController=require('../controller/orderController')
const googleMw=require("../middleware/googleAuth")
const passport = require('passport');

userRoute.get("/register",usercontroller.registerLoad)
userRoute.post("/postRegister",usercontroller.insertUser)
userRoute.get('/login',usercontroller.loginLoad)
userRoute.get('/logout',usercontroller.logoutUser)
userRoute.post('/loginn',usercontroller.loginUser)
userRoute.get('/otpverify',usercontroller.otpLoad)
userRoute.post('/otpverify',usercontroller.verifyOtp)
userRoute.get('/resendOtp',usercontroller.resendOtp)
userRoute.get('/',usercontroller.loadHome)
userRoute.get('/about',usercontroller.getAbout)

userRoute.get('/productdetails/:id',usercontroller.getUserProductDetalis)

userRoute.get('/auth/google',googleMw.googleAuth);
userRoute.get('/auth/google/callback',googleMw.googleAuthCallback);

userRoute.post("/forgotPassword", usercontroller.forgotPassword);
userRoute.post("/verifyOtpForPassword", usercontroller.verifyOtpForPassword);
userRoute.post("/resetPassword", usercontroller.resetPassword);

userRoute.get("/wallet",UserMw.userAuth, usercontroller.getWallet);
userRoute.post("/walletdeposite",UserMw.userAuth, usercontroller.postAmount);


userRoute.get('/cart',UserMw.userAuth,cartcontroller.getCart);
userRoute.post('/addtocart/:id',UserMw.userAuth,cartcontroller.postAddCart)
userRoute.post('/removecart/:id',UserMw.userAuth,cartcontroller.decart)
userRoute.post('/updatecart/:id',UserMw.userAuth,cartcontroller.updateCart)

userRoute.get('/profile',UserMw.userAuth,usercontroller.getUserProfile);
userRoute.get('/editProfile',UserMw.userAuth,usercontroller.getEditProfile);
userRoute.post('/editedProfile',UserMw.userAuth,usercontroller.postEditProfile);
userRoute.post('/changepassword',UserMw.userAuth,usercontroller.postChangePassword);

userRoute.get('/wishlist',UserMw.userAuth , wishlistController.getWishlist)
userRoute.post('/addToWishlist/:id', UserMw.userAuth, wishlistController.postAddToWishlist)
userRoute.get('/removewishlist/:Id',UserMw.userAuth,wishlistController.deleteWishlist)

userRoute.get('/checkout',UserMw.userAuth,orderController.getCheckout)
userRoute.post('/checkedout',UserMw.userAuth,orderController.postCheckout)
userRoute.get('/thankyou',UserMw.userAuth,orderController.getConfirmOrder);
// userRoute.post('/validateCoupon',UserMw.userAuth,orderController.checkCoupon);
userRoute.post('/applyCoupon',UserMw.userAuth,orderController.applyCoupon);

userRoute.get('/myorder',UserMw.userAuth,orderController.getMyOrder)
userRoute.get('/myorderDetails/:id',UserMw.userAuth,orderController.getOrderDetails)
userRoute.patch('/cancelOrder',UserMw.userAuth,orderController.cancelOrder)
userRoute.patch('/returnOrder',UserMw.userAuth,orderController.returnOrder)
userRoute.get('/download-invoice/:orderId',UserMw.userAuth,orderController.downloadInvoice)
userRoute.post('/updateOrderStatus',UserMw.userAuth,orderController.retryPayment)
//address

userRoute.get('/addressview',UserMw.userAuth, addresscontroller.getAddress);
userRoute.get('/addaddress',UserMw.userAuth, addresscontroller.getAddAddress);
userRoute.post('/addaddress',UserMw.userAuth, addresscontroller.postAddAddress);
userRoute.get('/editaddress/:id',UserMw.userAuth, addresscontroller.getEditAddress);
userRoute.post('/editedaddress/:id',UserMw.userAuth, addresscontroller.postEditAddress);
userRoute.delete('/removeaddress/:id',UserMw.userAuth, addresscontroller.deleteAddress);

 module.exports=userRoute;
 