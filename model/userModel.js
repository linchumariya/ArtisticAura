const mongoose=require("mongoose")
const userSchem=new mongoose.Schema({
    name:{
        type:String,
        required: true,
    },
    email:{
        type:String,
        required: true,
        unique: true,
    },
    phone:{
        type:String,
       
      },
      password:{
        type:String,
       
      },
    
        otp:{
          type:String,
          default:null,
          created:Date,
          expires:"5m"
        
        },
        isBlocked:{
          type:Boolean,
          default:false
      }, googleId: {
        type: String
      },
      referalCode: {
        code: {
          type: Number,
          default: function () {
            return Math.floor(100000 + Math.random() * 700000).toString();
          },
          unique: true,
        },
        redeemStatus: {
          type: Boolean,
          default: false,
        }
      },
        
      created:{
        type:Date,
        required: true,
        default: Date.now
      },
      usedCoupons: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon',
      }],
})

const User=mongoose.model("User",userSchem)
module.exports=User
