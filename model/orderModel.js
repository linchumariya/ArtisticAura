const mongoose= require('mongoose')
const moment= require('moment')
const orderSchema=mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    items:[{
        product:{
        type:mongoose.Types.ObjectId,
        ref:'Product',
        required:true
    },
        price:{
            type:Number,
            ref:'Product',
            required:true
        },
        quantity:{
            type:Number,
            required:true
        },
        status: {
            type: String,
            enum: ["Pending", "Shipped", "Delivered", "Cancelled", "Returned"],
            default: "Pending",
        },
    }],
    orderStatus:{
        type:String,
        default:"Order Placed"
    },
    totalPrice:{
        type:Number,
        default:0
    },
    billingdetails:{
        name: String,
        buildingname:String,
        city: String,
        street: String,
        state: String,
        country: String,
        postalCode: String,
        phone: String,
        email: String,
    },
    paymentMethod: {
        type: String,
        required: true,
        },
    orderDate:{
            type:Date,
            default:Date.now,
            get:function(val){
                return moment(val).format('DD-MM-YYYY')
            }
        },
})
module.exports=mongoose.model('Order',orderSchema)