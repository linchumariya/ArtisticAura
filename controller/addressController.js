const UserModel = require("../model/userModel");
const bcrypt = require("bcrypt");
const ProductModel=require('../model/productModel')
const CategoryModel=require('../model/categoryModel')
const AddressModel=require('../model/addressModel')
const mongoose=require('mongoose');
const user = require("../middleware/user");

const getAddress =async (req, res) => {
  try {

    const userId  = req.session.user._id
    console.log(userId)
    const addressDocument = await AddressModel.findOne({userId:userId});
    //const addresses = AddressModel.find({})

    // console.log(addressDocument)
    if (!addressDocument || !addressDocument.addresses || addressDocument.addresses.length === 0) {
    res.render("user/addressview",{user: req.session.user,
      addresses:[],
    });
  }
  res.render('user/addressview', {
    user: req.session.user,
    addresses: addressDocument.addresses
  })
  } catch (error) {
    console.log(error);
  }
  
  };
const getAddAddress=async(req,res)=>{
  try {
      console.log("user of address is",req.session.user)
    res.render("user/addaddress",{
      user:req.session.user

    })
    
  } catch (error) {
    console.log(error);
    
  }
}
  const postAddAddress=async(req,res)=>{
    try {

      const userId  = req.session.user._id
      let userAddress=await AddressModel.findOne({userId:userId});
      const newAddress = {
        buildingname: req.body.buildingname,
        pincode: req.body.pincode,
        street: req.body.street,
        city: req.body.city,
        state: req.body.state,
        country: req.body.country,
      };
      

      if (!userAddress) {
        // console.log("new address");
        userAddress = new AddressModel({
            userId: userId,
            addresses: [newAddress]
        });
      
    } else {
      
        userAddress.addresses.push(newAddress);
        
    }
    await userAddress.save();
      res.redirect('/addressview');
      
    } catch (error) {
      console.log(error);
    }
  };


const deleteAddress = async (req, res) => {
  try {
    const addressId = req.params.id;
    const userId = req.session.user._id;
    const objectId = new mongoose.Types.ObjectId(addressId);


    const result = await AddressModel.updateOne(
      { userId: userId },
      { $pull: { addresses: { _id: objectId } } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    return res.status(200).json({ success: true, message: "Address removed successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Failed to remove address" });
  }
};



const getEditAddress=async (req,res)=>{
  try {

    const userId=req.session.user._id;
    // console.log(userId)
    const addressId=req.params.id;
    // console.log(addressId)
    const user=req.session.user;
    const userAddress=await AddressModel.findOne({userId:userId})
    const address=userAddress.addresses.find(
      (addr)=>addr._id.toString()===addressId
    )
    res.render('user/editaddress',{
      address:address,
      user:user
    })
  } catch (error) {
    console.log(error);
  }
}

const postEditAddress=async(req,res)=>{
  try {
  const userId=req.session.user._id;
  const addressId=req.params.id;
  const user=req.session.user;
  const userAddress=await AddressModel.findOne({userId:userId})
  const address = userAddress.addresses.find (
    (address) => address._id.toString() === addressId
)
address.buildingname = req.body.buildingname,
            address.pincode = req.body.pincode,
            address.city = req.body.city,
            address.street = req.body.street,
            address.state = req.body.state,
            address.country = req.body.country,

            await userAddress.save();
          
            res.redirect('/addressview')
          }
            catch (error) {
              console.log(error.message);
            }
};
  

  module.exports = {getAddress,getAddAddress,postEditAddress,getEditAddress,deleteAddress,postAddAddress}