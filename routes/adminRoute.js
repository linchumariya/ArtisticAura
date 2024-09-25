const express = require("express");
const adminRoute = express.Router();
const adminController = require("../controller/adminController");
const categoryController = require("../controller/categoryController");
const productController = require("../controller/productController");
const customerController = require("../controller/customerController");
const adminOrderController=require("../controller/adminOrderController")
const user=require("../middleware/user")

adminRoute.get("/adminlogin", adminController.adminloginLoad);
adminRoute.post("/adminlogin", adminController.adminloginDashboard);
adminRoute.get("/adminDash",user.adminAuth, adminController.backtodashboard);

adminRoute.get("/productList",user.adminAuth, productController.getProductList);
adminRoute.get("/addProduct",user.adminAuth, productController.getAddProducts);
adminRoute.post("/submitProduct", productController.postAddproducts);
adminRoute.get("/publishProduct/:Id",user.adminAuth,productController.publishProduct);
adminRoute.get("/unpublishProduct/:Id",user.adminAuth,productController.unpublishProduct);
adminRoute.get("/updateProduct",user.adminAuth,productController.getEditProduct);
// adminRoute.post("/updatedProduct/:id",productController.postEditProduct);
adminRoute.post("/updatedProduct",  productController.postEditProduct);


adminRoute.post("/addCategory", categoryController.loadCategory);
adminRoute.get("/categoryList",user.adminAuth, categoryController.loadcategorylist);
adminRoute.post("/toggleCategoryStatus",categoryController.toggleCategoryStatus);
adminRoute.get("/editcategory",user.adminAuth, categoryController.loadeditcategorypage);
adminRoute.post("/updatecategory/:id", categoryController.updateCategory);


adminRoute.get('/customers',user.adminAuth, customerController.loadcustomermanagement);
adminRoute.post('/customerunlist/:id',user.adminAuth,customerController.blockOrUnblockcustomer)

adminRoute.get('/getOrder', user.adminAuth, adminOrderController.getOrder)
adminRoute.get('/getOrderDetails/:Id', user.adminAuth, adminOrderController.getOrderDetails)
module.exports = adminRoute;
