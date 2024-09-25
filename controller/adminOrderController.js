const Admin=require("../model/adminModel")
const Product=require("../model/productModel")
const Order=require("../model/orderModel")
const PaginationHelper = require("../helper/paginationHelper");
const getOrder=async (req,res)=>{
    try {
        const orders = await Order.find().sort({ orderDate : -1 })
        console.log("iam in orderlist ",orders)
        console.log("enter in to the order-list");
        let { page } = req.query;
    
        if (!page) {
          page = 1;
        }
       
    
        const orderTotalCount = await Order.countDocuments({})
        const ITEMS_PER_PAGE = PaginationHelper.PRODUCT_PER_PAGE;
    
        console.log( "my order is",orders)
    
        res.render("admin/order-list", {
            order: orders,
          currentPage: page,
          hasNextPage: orderTotalCount > page * ITEMS_PER_PAGE,
          hasPrevPage: page > 1,
          nextPage: page + 1,
          prevPage :page-1,
          lastPage: Math.ceil(orderTotalCount / ITEMS_PER_PAGE),
        });
        
    } catch (error) {
        console.log(error)
    }
}
const getOrderDetails=async (req,res)=>{
    try {

        const orderId=req.params.Id;
        console.log("iam order id",orderId)
        const orders=await Order.findOne({_id:orderId}).populate('items.product')
        console.log("iam order",orders)
        res.render('admin/order-details',{
            order:orders,
        });
        
    } catch (error) {
       console.log(error) 
    }
}

module.exports = {getOrder,getOrderDetails}