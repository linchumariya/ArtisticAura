const User = require('../model/userModel');

module.exports = {
    userAuth :async (req , res, next) =>{
        if(!req.session.user){
            return res.redirect('/login')
        }
        try {
         
            const user = await User.findById(req.session.user._id);
            if (!user || user.isBlocked) {
                req.session.user = null; 
                return res.redirect('/login'); 
            }

        next();
    } catch (error) {
        console.error("Error in userAuth middleware:", error);
        return res.redirect('/login');
    }
    },
    adminAuth : (req ,res , next) =>{
        if(!req.session.admin){
            return res.redirect('/adminlogin')
        }
        next()
    },
    userLoggedout : (req ,res ,next)=>{
        if(req.session.user){
            req.session.user = null;
            return res.redirect('/')
        }
        next()
    },
    adminLoggedout : (req ,res, next)=>{
        if(req.session.admin){
              req.session.admin = null;
              return res.redirect('/adminLogin')
        }
    next()
  }
  }