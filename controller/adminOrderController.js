const Admin=require("../model/adminModel")
const Product=require("../model/productModel")
const Order=require("../model/orderModel")
const Coupon=require("../model/couponModel")
const STATUS_CODES=require("../helper/statusCode")

const PaginationHelper = require("../helper/paginationHelper");
const getOrder=async (req,res)=>{
    try {
        const orders = await Order.find().sort({ orderDate : -1 })
        let { page } = req.query;
    
        if (!page) {
          page = 1;
        }
        const orderTotalCount = await Order.countDocuments({})
        const ITEMS_PER_PAGE = PaginationHelper.PRODUCT_PER_PAGE;
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
        console.log(error);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send("Internal Server Error");
    }
}
const getOrderDetails=async (req,res)=>{
    try {

        const orderId=req.params.Id;
        const orders=await Order.findOne({_id:orderId}).populate('items.product')
        if (!orders) {
            return res.status(STATUS_CODES.NOT_FOUND).send("Order not found");
        }
        res.render('admin/order-details',{
            order:orders,
        });
        
    } catch (error) {
        console.log(error);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send("Internal Server Error");
    }
}
const updateStatus=async (req,res)=>{
    try {
        const {orderId,productId,selectedStatus}=req.body;
        const order=await Order.findById(orderId);
        const cancelProduct=order.items.find(item=>item.product.toString()===productId)
        const updateOrder=await Order.findOneAndUpdate({_id:orderId,'items.product':productId},{$set:{'items.$.status':selectedStatus}},{new:true})
        if(selectedStatus=='Cancelled'||selectedStatus=='Returned'){
            const orderItem=updateOrder.items.find(item=>item.product.toString()===productId)
            await Product.findByIdAndUpdate(productId,{$inc:{stock:orderItem.quantity}})
            selectedStatus.disabled=true
        }   
        if (updateOrder) {
            return res.json({ success: true, updateOrder });
        } else {
            return res.status(STATUS_CODES.NOT_FOUND).json({ success: false, message: 'Order not found' });
        }
    } catch (error) {
        console.log(error)
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send("Internal Server Error");
    }
};

const getCoupon=async(req,res)=>{
    try {
        
        const coupon=await Coupon.find()
        res.render('admin/coupon-list',{
            coupon:coupon
        })

    } catch (error) {
        console.log(error)
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send("Internal Server Error");
    }
};
const getAddCoupon=async(req,res)=>{
    try {
        res.render('admin/add-Coupon')

        
    } catch (error) {
        console.log(error)
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send("Internal Server Error");
    }
}
const postAddCoupon=async(req,res)=>{
    try {
        const existingCoupon=await Coupon.findOne({coupon:req.body.coupon})
        if(existingCoupon){
            res.render('admin/add-coupon',{
                alert:'Coupon is already exist,try with other coupon'
            })
        }
        else{
            const coupon=new Coupon({
                coupon:req.body.coupon,
                description:req.body.description,
                percentage:req.body.percentage,
                minimumAmount:req.body.minimumAmount,
                maximumAmount:req.body.maximumAmount,
                expiryDate:req.body.expiryDate

            })
            await coupon.save()
            res.redirect('/couponList')
        }
        
    } catch (error) {
        console.log(error)
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send("Internal Server Error");
    }
}

const publishCoupon=async (req,res)=>{
    try {

        const id=req.params.id;
        const coupon=await Coupon.findById(id);
        if(!coupon){
            return res.status(STATUS_CODES.NOT_FOUND).send('coupon not found')
        }
        if(coupon.isListed===true){
            await Coupon.findByIdAndUpdate(id,{isListed:false})
            res.sendStatus(STATUS_CODES.OK);
        }else{
            await Coupon.findByIdAndUpdate(id,{isListed:true})
            res.sendStatus(STATUS_CODES.OK);
                }
        
    } catch (error) {
        console.log(error)
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send("Internal Server Error");
    }
}
const editCoupon=async (req,res)=>
{
    try {
        const couponId=req.params.id
        const coupon=await Coupon.findById(couponId)
            res.render('admin/coupon-edit',{
                coupon:coupon
            })
    } catch (error) {
        console.log(error)
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send("Internal Server Error");
    }
}
const updateCoupon=async(req,res)=>{
    try {
        const couponId=req.params.id
        const {coupon,description,percentage,maximumAmount,expiryDate}=req.body;

        const updatedCoupon = await Coupon.findByIdAndUpdate(couponId,{
            coupon:coupon,
            description:description,
            percentage:percentage,
            maximumAmount:maximumAmount,
            expiryDate:new Date(expiryDate)
        }, { new: true })
        if (!updatedCoupon) {
            return res.status(STATUS_CODES.NOT_FOUND).json({ success: false, message: "Coupon not found" });
        }
        res.redirect('/couponList')
        
    } catch (error) {
        console.log(error)   
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send("Internal Server Error");
    }
}

module.exports = {getOrder,
    getOrderDetails,
    updateStatus,
    getCoupon,
    getAddCoupon,
    postAddCoupon,
    publishCoupon,
    updateCoupon,
    editCoupon}