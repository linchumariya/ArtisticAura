const mongoose=require('mongoose')
const couponSchema=mongoose.Schema({

    coupon:{
        type:String,
        required:true,
        unique: true,
    },
    description:{
        type:String,
        required:true
    },
    isListed:{
        type:Boolean,
        default:true,
    },
    percentage:{
        type:Number,
        required:true,
        validate: {
            validator: (value) => value > 0 && value <= 100,
            message: 'Percentage must be between 1 and 100',
          },
    },
    maximumAmount:{
        type:Number,
        required:true
    },
    expiryDate:{
        type:Date,
    },
    
})
module.exports=mongoose.model('Coupon',couponSchema)