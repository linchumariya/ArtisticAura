const mongoose=require("mongoose")
const userSchem=new mongoose.Schema({
    name:{
        type:String,
       
    },
    email:{
        type:String,
        
    },
    phone:{
        type:String,
       
      },
      password:{
        type:String,
       
      },
    
        otp:{
          type:Number,
          default:null,
          created:Date,
          expires:"5m"
        
        },
        isBlocked:{
          type:Boolean,
          default:false
      },
        
      created:{
        type:Date,
        required: true,
        default: Date.now
      }
})

const User=mongoose.model("User",userSchem)
module.exports=User
