const mongoose = require("mongoose");
const productSchema = mongoose.Schema({

  productName: {
    type: String,
    // required: true,
  },
  description: {
    type: String,
    // required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    // required: true,
  },
  price: {
    type: Number,
    // required: true,
  }, 
  oldPrice: {
    type: Number,
    // required: true
},
  discount:{
    type:Number,
    // required:true,
  },
  image:[{
      type:String
    }],
  stock: {
    type: Number,
    default:0,
    // required: true,
  },
  ispublished: {
    type: Boolean,
    default: true
},
  created:{
    type:Date,
    default:Date.now
    
  }
});
const Product = mongoose.model("Product", productSchema);
module.exports = Product;
