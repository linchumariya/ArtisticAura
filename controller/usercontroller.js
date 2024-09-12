const UserModel = require("../model/userModel");
const bcrypt = require("bcrypt");
const ProductModel = require("../model/productModel");
const CategoryModel = require("../model/categoryModel");
const pageHelper = require("../helper/paginationHelper");

const nodemailer = require("nodemailer");
const isUser = require('../middleware/user')
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
    console.log("enter in to the registerload");
    res.render("user/register");
  } catch (error) {
    console.log(error);
  }
};
const loginLoad = async (req, res) => {
  try {
    console.log("enter in to the loginload");
    res.render("user/login");
  } catch (error) {
    console.log(error);
  }
};

const otpLoad = async (req, res) => {
  try {
    console.log("enter in to the OTPload");
    res.render("user/otpverify", { email: req.query.email || "" });
    res.redirect("/login");
  } catch (error) {
    console.log(error);
  }
};
const loadHome = async (req, res) => {
  try {
    const { cat, search, sort, page = 1 } = req.query;

    let pageNumber = Number(page);
    if (isNaN(pageNumber) || pageNumber < 1) {
      pageNumber = 1;
    }

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
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    let sortCondition = {};

    if (sort) {
      switch (sort) {
        case "price_aA_to_zZ": //asc
          sortCondition = { price: 1 };
          break;
        case "price_Aa_to_Zz": //desc
          sortCondition = { price: -1 };
          break;
        case "name_aA_to_zZ": //asc
          sortCondition = { productName: 1 };
          break;
        case "name_Aa_to_Zz": //desc
          sortCondition = { productName: -1 };
          break;
          default :
          break;

      }
    }


    // console.log(sortCondition)

    const products = await ProductModel
    .find(condition)
    .populate("category")
    .sort(sortCondition)
    .skip((pageNumber- 1) * pageHelper.ITEMS_PER_PAGE)
    .limit(pageHelper.ITEMS_PER_PAGE);


    // console.log(products);

    const categories = await CategoryModel.find({islisted: true});
    // console.log(categories)

    res.render("user/user-home", {
      products: products,
      catData: categories,
      user: req.session.user,
      hideOutOfStock
    });
  } catch (error) {
    console.log(error);
  }
};

const insertUser = async (req, res) => {
  try {
    console.log("enter in to the post inset");
    const { username, email, phoneNumber, password } = req.body;
    const spassword = await securePassword(password);
    const saveData = new UserModel({
      name: username,
      email: email,
      phone: phoneNumber,
      password: spassword,
      otp: Math.floor(100000 + Math.random() * 900000),
    });

    const data = await saveData.save();

    console.log(data);
    if (data) {
      res.render("user/otpverify", { email: data.email });

      const mailOptions = {
        from: {
          name: "OTP Verification",
          address: "linjumaria@gmail.com",
        },
        to: data.email,
        subject: "OTP VERIFICATION",
        text: `welcome to ${data.otp}`,
        html: `<b> welocme ${data.otp}</b>`,
      };
      sendMail(transporter, mailOptions);
      // setTimeout(async () => {
      //     try {
      //         await UserModel.findByIdAndUpdate(data._id, { otp: null });
      //         console.log("OTP nullified for user:", data._id);
      //     } catch (error) {
      //         console.error("Error nullifying OTP:", error);
      //     }
      // }, 300000);
    } else {
      res.render("user/register");
    }
  } catch (error) {
    console.log(error);
  }
};

const verifyOtp = async (req, res) => {
  console.log("enter in to otp verify");
  const { email, val1, val2, val3, val4, val5, val6 } = req.body;
  const otp = `${val1}${val2}${val3}${val4}${val5}${val6}`;
  console.log(otp);
  try {
    const user = await UserModel.findOne({ email });
    if (user && user.otp === parseInt(otp, 10)) {
      user.otp = null;
      await user.save();
      console.log("otp sucess");
      res.redirect("/");
    } else {
      res.send("invalid otp");
    }
  } catch (error) {
    console.error(error);
    res.send("error occured");
  }
};
const resendOtp = async (req, res) => {
  const { email } = req.query;
  try {
    const user = await UserModel.findOne({ email: email });
    if (user) {
      console.log("user has been found");
      user.otp = Math.floor(100000 + Math.random() * 900000);
      await user.save();
      const mailOptions = {
        from: {
          name: "OTP Verifications",
          address: "linjumaria@gmail.com",
        },
        to: user.email,
        subject: "OTP verification",
        text: `your new OTP is resend${user.otp}`,
        html: `<b>your new otp is${user.otp}</b>`,
      };
      sendMail(transporter, mailOptions);
      res.render("user/otpverify", { email: user.email });
      // setTimeout(async () => {
      //     try {
      //         await UserModel.findByIdAndUpdate(user._id, { otp: null });
      //         console.log("OTP nullified for user:", user._id);
      //     } catch (error) {
      //         console.error("Error nullifying OTP:", error);
      //     }
      // }, 300000);
    } else {
      res.send("user not found");
    }
  } catch (error) {
    console.error(error);
    res.send("error occured");
  }
};
const loginUser = async (req, res) => {
  try {
    console.log("I  button click - login user");
    const { email, password } = req.body;
    const userdata = await UserModel.findOne({ email: email });

    if (userdata) {
      const passwordMatch = await bcrypt.compare(password, userdata.password);
      if (passwordMatch) {
        req.session.user = userdata;
        console.log("Login success", req.session.user);

        res.redirect("/");
      } else {
        res.send("Invalid email or password");
      }
    } else {
      res.send("Invalid email or password");
    }
  } catch (error) {
    console.error("Error in loginUser:", error);
  }
};

const getUserProductDetalis = async (req, res) => {
  try {
    console.log("i m in product details");
    const userId = req.session.user || null;
    console.log("iam user my id is",userId)
    const Id = req.params.id;
    console.log(Id);
    const product = await ProductModel.findOne({ _id: Id }).populate(
      "category"
    );

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
  }
};
const logoutUser = (req, res) => {
  try {
    req.session.user = null;
    res.redirect("/");
  } catch (error) {
    console.log(error);
  }
};

const getUserProfile = async (req, res) => {
  try {
    const userId = req.session.user;
    const user = await UserModel.findById(userId);
    console.log("userId", userId);

    res.render("user/profile", {
      users: user,
      user: userId,
    });
  } catch (err) {
    console.log(err);
  }
};
const getEditProfile = async (req, res) => {
  try {
    const userId = req.session.user;
    console.log("Iam user of edit", userId);
    const userdata = await UserModel.findOne({ _id: userId });
    console.log("im user data in user data in edit profile", userdata);
    res.render("user/editProfile", {
      users: userdata,
      user: userId,
    });
  } catch (error) {
    console.log(error.message);
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
        email: req.body.email,
      },
      { new: true }
    );
    await UserModel.save;
    res.redirect("/editProfile");
  } catch (error) {
    console.log(error.message);
  }
};
const postChangePassword = async (req, res) => {
  try {
    const userId = req.session.user;
    console.log("Iam change password", userId);
    const { currentpassword, newpassword, confirmpassword } = req.body;
    console.log("Iam password ", req.body);

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

    res.redirect("/login");
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  registerLoad,
  insertUser,
  loginLoad,
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
};
