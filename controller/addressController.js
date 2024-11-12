const UserModel = require("../model/userModel");
const bcrypt = require("bcrypt");
const ProductModel=require('../model/productModel')
const CategoryModel=require('../model/categoryModel')
const AddressModel=require('../model/addressModel')
const mongoose=require('mongoose');
const user = require("../middleware/user");
const STATUS_CODES=require("../helper/statusCode")

const getAddress =async (req, res) => {
  try {

    const userId  = req.session.user._id
    const addressDocument = await AddressModel.findOne({userId:userId});
    if (!addressDocument || !addressDocument.addresses || addressDocument.addresses.length === 0) {
      return  res.render("user/addressview",{user: req.session.user,
      addresses:[],
    });
  }
  res.render('user/addressview', {
    user: req.session.user,
    addresses: addressDocument.addresses,
  })
  } catch (error) {
    console.log(error);
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "Error fetching address" });
  }
  
  };
const getAddAddress=async(req,res)=>{
  try {
      // console.log("user of address is",req.session.user)
    res.render("user/addaddress",{
      user:req.session.user

    })
    
  } catch (error) {
    console.log(error);
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "Error displaying add address form" });
    
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
      return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "Failed to add address" });
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
      return res.status(STATUS_CODES.NOT_FOUND).json({ success: false, message: "Address not found" });
    }
    return res.status(STATUS_CODES.OK).json({ success: true, message: "Address removed successfully" });
  } catch (error) {
    console.log(error);
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "Failed to remove address" });
  }
};

const getEditAddress=async (req,res)=>{
  try {
    const userId=req.session.user._id;
    const addressId=req.params.id;
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
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "Error fetching address for editing" });
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
              return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "Failed to edit address" });
            }
};
  

  module.exports = {getAddress,
    getAddAddress,
    postEditAddress,
    getEditAddress,
    deleteAddress,
    postAddAddress}