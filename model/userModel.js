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
        
      created:{
        type:Date,
        required: true,
        default: Date.now
      }
})

const User=mongoose.model("User",userSchem)
module.exports=User
