const mongoose=require("mongoose");
const categorySchema=mongoose.Schema({
name:{
    type:String,
    required:true,
    unique:true
},
description: {
    type: String,
    required: true
},
islisted: {
    type: Boolean,
    default:true,
    required: true
},
created:{
    type:Date,
    required: true,
    default: Date.now
  }

});
const Category = mongoose.model("Category", categorySchema);
module.exports = Category;