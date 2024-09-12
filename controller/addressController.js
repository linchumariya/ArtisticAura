const UserModel = require("../model/userModel");
const bcrypt = require("bcrypt");
const ProductModel=require('../model/productModel')
const CategoryModel=require('../model/categoryModel')
const AddressModel=require('../model/addressModel')
const mongoose=require('mongoose')

const getAddress =async (req, res) => {
  try {

    const userId  = req.session.user._id
    // console.log(userId)
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
      let userAddress=await AddressModel.findOneAndUpdate({userId:userId});
      
      // console.log("post",userAddress)

      // console.log(req.body.buildingname,req.body.pincode,req.body.city,req.body.state,req.body.street,req.body.country)

      if (!userAddress) {
        // console.log("new address");
        userAddress = new AddressModel({
            userId: userId,
            addresses: [{
                buildingname: req.body.buildingname,
                pincode: req.body.pincode,
                street: req.body.street,
                city: req.body.city,
                state: req.body.state,
                country: req.body.country,
            }]
        });
    
        // Save the new userAddress to the database
        await userAddress.save();
    } else {
        // Push the new address into the existing addresses array
        userAddress.addresses.push({
            buildingname: req.body.buildingname,
            pincode: req.body.pincode,
            street: req.body.street,
            city: req.body.city,
            state: req.body.state,
            country: req.body.country,
        });
    
        // Save the updated userAddress to the database
        await userAddress.save();
    }
    
      // if(!userAddress){
      //   console.log("new address")
      //   userAddress=new AddressModel({
      //     userId:userId,
      //     address:[{
      //       buildingname:req.body.buildingname,
      //       pincode:req.body.pincode,
      //       city:req.body.city,
      //       state:req.body.state,
      //       street:req.body.street,
      //       country:req.body.country,
      //     }]
      //   });
      // }else{
      //   userAddress.address.push({
      //     buildingname:req.body.buildingname,
      //     pincode:req.body.pincode,
      //     city:req.body.city,
      //     state:req.body.state,
      //     street:req.body.street,
      //     country:req.body.country,
      //   });    
      // }

    //   try {
    //     await userAddress.save();
    // } catch (error) {
    //     console.error('Error saving address:', error);
    // }
    //   // await userAddress.save();
    //   console.log("address is saved")

      // res.status(200).render('user/addressview',{
      //   message:'Address addeed sucessfully',
      //   user:req.session.user,
      //   addresses:userAddress.address
      // })

      res.redirect('/addressview')
        

      
    } catch (error) {
      console.log(error);
    }
  }
// const deleteAddress=async(req,res)=>{
//   try {
//     const addressid=req.params.id;
//     console.log("im in delete",addressid)
//     const userId=req.session.user._id;
//     console.log("im delete user",userId)


//     const objectId = new mongoose.Types.ObjectId(addressid);


//     await AddressModel.findOneAndUpdate(
//       {userId:userId},
//       {$pull:{address:{_id:objectId}}},
//       {new:true}
//     )
//     return res.status(200).json({ success: true, message: "Removed successfully" });
    
//   } catch (error) {
//     console.log(error);
    
//   }
// }


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
          
            res.redirect('/addressview')}
            catch (error) {
              console.log(error.message);
            }


}
  

  module.exports = {getAddress,getAddAddress,postEditAddress,getEditAddress,deleteAddress,postAddAddress}