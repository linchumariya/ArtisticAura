const UserModel = require("../model/userModel");
const bcrypt = require("bcrypt");
const ProductModel = require("../model/productModel");
const CategoryModel = require("../model/categoryModel");
const pageHelper = require("../helper/paginationHelper");
const passport = require('passport');
// const otpGenerator = require('otnpm startp-generator');
const STATUS_CODES=require("../helper/statusCode")
const nodemailer = require("nodemailer");
const user = require('../middleware/user');
const walletModel = require("../model/walletModel");


const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.error(error);
  }
};
const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "linjumaria@gmail.com",
    pass: "dafq jwly zmlk kcnl",
  },
});

const sendMail = async (transporter, mailOptions) => {
  try {
    await transporter.sendMail(mailOptions);
    console.log("email send");
  } catch (error) {
    console.error(error);
  }
};

const registerLoad = async (req, res) => {
  try {
    res.render("user/register");
  } catch (error) {
    console.log(error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "Internal server error" });
  }
};
const loginLoad = async (req, res) => {
  try {
    if (req.session.user) {
     req.session.user=null
      return res.redirect('/login'); 
    }
    // console.log("enter in to the loginload");
    res.render("user/login");
  } catch (error) {
    console.log(error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "Internal server error" });
  }
};
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ message: "User not found" });
    }
    
    const otp = Math.floor(100000 + Math.random() * 900000);
    user.otp = otp;
    await user.save();
    const mailOptions = {
      from: "linjumaria@gmail.com",
      to: email,
      subject: "Password Reset OTP",
      text: `Your OTP is: ${otp}`
    };
    await sendMail(transporter, mailOptions);
    res.status(STATUS_CODES.OK).json({ success: true, message: "OTP sent!", email });
  } catch (error) {
    console.error(error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "Internal server error" });
  }
};
const verifyOtpForPassword = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const user = await UserModel.findOne({ email });
    if (!user || user.otp !== otp) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "Invalid OTP" });
    }
    return res.status(STATUS_CODES.OK).json({ success: true,message: "OTP Verified", email });
  } catch (error) {
    console.error(error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "Internal server error" });
  }
};

const resetPassword = async (req, res) => {
  const { email, newPassword, confirmPassword } = req.body;
  try {
    if (newPassword !== confirmPassword) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "Passwords do not match" });
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ message: "User not found" });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    user.otp = null; 
   const savedUser= await user.save();
    return res.status(STATUS_CODES.OK).json({ success: true, message: "Password updated successfully." });
  } catch (error) {
    console.error(error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "Internal server error" });
  }
};

const otpLoad = async (req, res) => {
  try {
    // console.log("enter in to the OTPload");
    res.render("user/otpverify", { email: req.query.email || "",
       });
   
  } catch (error) {
    console.log(error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "Internal server error" });
  }
};
const loadHome = async (req, res) => {
  try {
    const { cat, search, sort } = req.query;
    let { page } = req.query;
    if (!page) {
      page = 1;
    }
  
    const productTotalCount = await ProductModel.countDocuments({})
    const ITEMS_PER_PAGE = pageHelper.PRODUCT_PER_PAGE;

    let condition = { ispublished: true };

    if (cat && cat != "ALL") {
      condition.category = cat;
    }
  
    const hideOutOfStock = req.query.hideOutOfStock || "false";
    if (hideOutOfStock === "true") {
      condition.stock = { $gt: 0 };
    }

    if (search) {
      condition.$or = [
        { productName: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    let sortCondition = {};

    if (sort) {
      switch (sort) {
        case "price_low_to_high": //asc
          sortCondition = { price: 1 };
          break;
        case "price_high_to_low": //desc
          sortCondition = { price: -1 };
          break;
        case "name_aA_to_zZ": //asc
          sortCondition = { productName: 1 };
          break;
        case "name_zZ_to_aA": //desc
          sortCondition = { productName: -1 };
          break;
          default :
          break;

      }
    }
    
    const products = await ProductModel
    .find(condition)
    .populate("category")
    .sort(sortCondition)
    .skip((page- 1) * pageHelper.ITEMS_PER_PAGE)
    .limit(pageHelper.ITEMS_PER_PAGE);

    const newproducts = await ProductModel
      .find({})
      .populate("category")
      .sort({ createdOn: -1 })
      .limit(4);

    const newfilteredProducts = newproducts.filter(
      (product) => product.category
    );
    const categories = await CategoryModel.find({islisted: true});
    res.render("user/user-home", {
      newproducts: newfilteredProducts,
      products: products,
      catData: categories,
      user: req.session.user,
      hideOutOfStock,
      currentPage: page,
      hasNextPage: productTotalCount > page * ITEMS_PER_PAGE,
      hasPrevPage: page > 1,
      nextPage: page + 1,
      prevPage :page-1,
      lastPage: Math.ceil(productTotalCount / ITEMS_PER_PAGE),
      query: req.query,
    });
  } catch (error) {
    console.log(error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "Internal server error" });
  }
};

const insertUser = async (req, res) => {
  try {
    // console.log("enter in to the post inset");
    const { username, email, phoneNumber, password } = req.body;
    const existingUser = await UserModel.findOne({ email: email });
    if (existingUser) {
      return res.render("user/register", { emailExists: true });
    }
    const spassword = await securePassword(password);
    const saveData = new UserModel({
      name: username,
      email: email,
      phone: phoneNumber,
      password: spassword,
      otp: Math.floor(100000 + Math.random() * 900000),
    });

    const data = await saveData.save();

   
    if (data) {
      res.render("user/otpverify", { email: data.email ,message: "",   
        alertType: ""});

      const mailOptions = {
        from: {
          name: "OTP Verification",
          address: "linjumaria@gmail.com",
        },
        to: data.email,
        subject: "OTP VERIFICATION",
        text: `welcome to ${data.otp}`,
        html: `<b> Your OTP is: ${data.otp}</b>`,
      };
      sendMail(transporter, mailOptions);
    
    } else {
      res.render("user/register");
    }
  } catch (error) {
    console.log(error);
    res.render("user/register");
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "Internal server error" });
  }
};

const  verifyOtp =async (req, res) => {
  try {
      const { email, otp } = req.body;

      const user = await UserModel.findOne({ email,otp });
      if (user && user.otp === otp) {
          user.otp = null;
          const wallet=new walletModel({
            userId:user._id
          })
         
          await wallet.save()
          await user.save();


          return res.render('user/otpverify', {
              email,
              message: 'OTP verified successfully!',
              alertType: 'success',
             
          });
      } else {
          return res.render('user/otpverify', {
              email,
              message: 'Invalid OTP! Please try again.',
              alertType: 'error'
          });
      }
  } catch (error) {
      console.error(error);
      return res.render('user/otpverify', {
          email,
          message: 'An error occurred. Please try again later.',
          alertType: 'error'
      });
  }
};


const resendOtp = async (req, res) => {
  const { email } = req.query;
  try {
      const user = await UserModel.findOne({ email: email });
      if (user) {
          const newOtp =  Math.floor(100000 + Math.random() * 900000);
          user.otp = newOtp;
          await user.save();
          const mailOptions = {
            from: {
                name: "OTP Verification",
                address: "linjumaria@gmail.com",
            },
            to: user.email,
            subject: "New OTP for Verification",
            text: `Your new OTP is: ${newOtp}`,
            html: `<b>Your new OTP is: ${newOtp}</b>`,
        };

        
        sendMail(transporter, mailOptions);

          return res.render('user/otpverify', {
              email: user.email,
              message: 'New OTP has been sent to your email.',
              alertType: 'info'
          });
      } else {
          return res.render('user/otpverify', {
              email,
              message: 'User not found.',
              alertType: 'error'
          });
      }
  } catch (error) {
      console.error(error);
      return res.render('user/otpverify', {
          email,
          message: 'An error occurred. Please try again later.',
          alertType: 'error'
      });
  }
};

const loginUser = async (req, res) => {
  try {
    console.log("I  button click - login user");
    const { email, password } = req.body;
    const userdata = await UserModel.findOne({ email: email });

    if (userdata) {
      if (userdata.isBlocked) {
        return res.status(STATUS_CODES.OK).json({ success: false, message: "AccountBlocked" });
      }
      else if (userdata.isBlocked === false) {
        const passwordMatch = await bcrypt.compare(password, userdata.password);
        if (passwordMatch) {
          req.session.user = userdata;
          // console.log("Login success", req.session.user);
          return res.status(STATUS_CODES.OK).json({ success: true, message: "LoginSuccess" });
       
        } else {
          return res.status(STATUS_CODES.OK).json({ success: false, message: "InvalidCredentials" });
        
        }
      }
    } else {
      return res.status(STATUS_CODES.OK).json({ success: false, message: "UserNotRegistered" });
  }}
   catch (error) {
    console.error("Error in loginUser:", error);
    if (!res.headersSent) {  
      res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "ServerError" });
    }
  }
};

const getUserProductDetalis = async (req, res) => {
  try {
    const userId = req.session.user || null;
    if (userId) {
      const user = await UserModel.findById(userId);
      // console.log("in side ",user);
      
      if (user && user.isBlocked) {
       
        return res.redirect('/login');
      }
    }
    const Id = req.params.id;
   
    
    const product = await ProductModel.findOne({ _id: Id }).populate(
      "category"
    );
    if (!product) {
      return res.status(STATUS_CODES.NOT_FOUND).render('user/page404'); 
    }

    const doc = await ProductModel.find({
      category: product.category,
    }).populate("category");

    await res.render("user/product-details", {
      data: product,
      doc: doc,
      user:userId
    });
  } catch (error) {
    console.log(error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR);
  }
};
const logoutUser = (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "Internal server error" });
      }
      res.redirect("/");
    });
  } catch (error) {
    console.log(error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "Internal server error" });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const userId = req.session.user;
    const user = await UserModel.findById(userId);
    // console.log("userId", userId);

    res.render("user/profile", {
      users: user,
      user: userId,
    });
  } catch (err) {
    console.log(err);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "Internal server error" });
  }
};
const getEditProfile = async (req, res) => {
  try {
    const userId = req.session.user;
    const userdata = await UserModel.findOne({ _id: userId });
    res.render("user/editProfile", {
      users: userdata,
      user: userId,
    });
  } catch (error) {
    console.log(error.message);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "Internal server error" });
  }
};
const postEditProfile = async (req, res) => {
  try {
    const userId = req.session.user;
    const updatedProfile = await UserModel.findByIdAndUpdate(
      userId,
      {
        name: req.body.name,
        phone: req.body.phone,
        
      },
      { new: true }
    );
    await UserModel.save;
    res.redirect("/editProfile");
  } catch (error) {
    console.log(error.message);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "Internal server error" });
  }
};
const postChangePassword = async (req, res) => {
  try {
    const userId = req.session.user;
    const { currentpassword, newpassword, confirmpassword } = req.body;
    const userdata = await UserModel.findById(userId);

    if (!userdata) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentpassword, userdata.password);

    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Current password is incorrect" });
    }

    if (newpassword !== confirmpassword) {
      return res
        .status(400)
        .json({
          success: false,
          message: "New password and confirm password do not match",
        });
    }

    const hashedPassword = await bcrypt.hash(newpassword, 10);

    userdata.password = hashedPassword;
    await userdata.save();
    console.log("password changed")
    return res.status(200).json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error(error.message);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "Internal server error" });
  }
};

const getWallet=async (req,res)=>{
  try {
    const userId=req.session.user._id
    let userWallet=await walletModel.findOne({userId:userId})
    if(!userWallet){
      userWallet=await walletModel.findOneAndUpdate({userId},{balance:0,transactions: []},{upsert:true,new:true})
    }
    userWallet.transactions.sort((a, b) => b.date - a.date);
    
    res.render('user/wallet',{
      user:req.session,
      userWallet:userWallet,
      userData:req.session.user

    })
    
  } catch (error) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "Internal server error" });
    
  }
}
const postAmount=async(req,res)=>{
  try {
    const userId=req.session.user._id
    const amount=parseFloat(req.body.amount)
    let userWallet=await walletModel.findOne({userId:userId})
    if(!userWallet){
      userWallet=new walletModel({
        userId:userId,
        balance:amount,
        transactions: [
          {
            type: 'credit',
            amount: amount,
            description: 'Initial wallet deposit',
          },
        ],
        userData:req.session.user
      })
    }
    else{
      userWallet.balance+=amount
      userWallet.transactions.push({
        type: 'credit',
        amount: amount,
        description: 'Wallet deposit',
      });
    }
    await userWallet.save()
    res.status((STATUS_CODES.OK)).json({ success: true });
  } catch (error) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "Internal server error" });
  }
}

const getAbout = async (req, res, next) => {
  try {
    const userId = req.session.user || null;
    console.log("I m in getAbout ");
   
    res.render("user/about",{user:userId});
  } catch (error) {
    console.error("Error in getConfirmOrder:", error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ message: "Server error" });
  }
};

module.exports = {
  registerLoad,
  insertUser,
  loginLoad,
  forgotPassword,
  verifyOtpForPassword,
  resetPassword,
  otpLoad,
  verifyOtp,
  resendOtp,
  loadHome,
  loginUser,
  getUserProductDetalis,
  logoutUser,
  getUserProfile,
  getEditProfile,
  postEditProfile,
  postChangePassword,
  getWallet,
  postAmount,
  getAbout
};
