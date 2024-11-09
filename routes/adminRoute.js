const express = require("express");
const adminRoute = express.Router();
const adminController = require("../controller/adminController");
const categoryController = require("../controller/categoryController");
const productController = require("../controller/productController");
const customerController = require("../controller/customerController");
const adminOrderController=require("../controller/adminOrderController")
const user=require("../middleware/user")

adminRoute.get("/adminlogin", adminController.adminloginLoad);
adminRoute.post("/adminlogin", adminController.postAdminLogin);
adminRoute.get("/dashboard",user.adminAuth, adminController.adminDash);
adminRoute.post('/generate-report',user.adminAuth,adminController.generateReport)
adminRoute.get("/productList",user.adminAuth, productController.getProductList);
adminRoute.get("/addProduct",user.adminAuth, productController.getAddProducts);
adminRoute.post("/submitProduct",user.adminAuth, productController.postAddproducts);
adminRoute.get("/publishProduct/:Id",user.adminAuth,productController.publishProduct);
adminRoute.get("/unpublishProduct/:Id",user.adminAuth,productController.unpublishProduct);
adminRoute.get("/updateProduct",user.adminAuth,productController.getEditProduct);
// adminRoute.post("/updatedProduct/:id",productController.postEditProduct);
adminRoute.post("/updatedProduct",user.adminAuth,productController.postEditProduct);


adminRoute.post("/addCategory", user.adminAuth,categoryController.loadCategory);
adminRoute.get("/categoryList",user.adminAuth, categoryController.loadcategorylist);
adminRoute.post("/toggleCategoryStatus",user.adminAuth,categoryController.toggleCategoryStatus);
adminRoute.get("/editcategory",user.adminAuth, categoryController.loadeditcategorypage);
adminRoute.post("/updatecategory/:id",user.adminAuth, categoryController.updateCategory);


adminRoute.get('/customers',user.adminAuth, customerController.loadcustomermanagement);
adminRoute.post('/customerunlist/:id',user.adminAuth,customerController.blockOrUnblockcustomer)

adminRoute.get('/getOrder', user.adminAuth, adminOrderController.getOrder)
adminRoute.get('/getOrderDetails/:Id', user.adminAuth, adminOrderController.getOrderDetails)
adminRoute.patch('/updateStatus', user.adminAuth, adminOrderController.updateStatus)


adminRoute.get('/couponList', user.adminAuth, adminOrderController.getCoupon)

adminRoute.get('/addCoupon', user.adminAuth, adminOrderController.getAddCoupon)
adminRoute.post('/couponAdded', user.adminAuth, adminOrderController.postAddCoupon)
adminRoute.post('/publish/:id', user.adminAuth, adminOrderController.publishCoupon)
adminRoute.get('/editCoupon/:id', user.adminAuth, adminOrderController.editCoupon)
adminRoute.post('/updateCoupon/:id', user.adminAuth, adminOrderController.updateCoupon)
module.exports = adminRoute;
