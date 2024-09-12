const Admin=require("../model/adminModel")
const bcrypt=require("bcrypt")
const secretPassword=async(password)=>{
    try {
        const passHash=await bcrypt.hash(password,10)
         return passHash;
    } catch (error) {
        console.error(error);
    }
}
const adminloginLoad=async(req,res)=>{
    try {
        console.log("enter into admin login");
        res.render("admin/admin-login")
    } catch (error) {
        console.error(error);
    }
}


const adminloginDashboard=async(req,res)=>{
    try {
        const {email,password}=req.body;
        if(email==='admin@gmail.com'&& password==='12345'){
            const admin=await Admin.findOne({email});
            if(admin){
                const isMatch=await bcrypt.compare(password,admin.password);
                if(isMatch){
                    req.session.admin = true;
                    res.render("admin/dashboard")
                    
                }else{
                    res.send("invalid password")
                }
            }else{
                const hashedPassword = await secretPassword('12345');
            const newAdmin=new Admin({
                email:"admin@gmail.com",
                password:hashedPassword,
            });
             await newAdmin.save();
             req.session.admin = true;
             return res.send("Admin logged in successfully!");
        }}
        else{
           return res.send("invalid email or password")
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send("Internal Server Error");
    }
};

const backtodashboard=async(req,res)=>{
   try{ if(req.session && req.session.admin){
     return res.render('admin/dashboard')
    }else{
     return  res.redirect("/adminlogin")
    }}catch(error){
        console.error(error);
        return res.status(500).send("internal server error")
    }
  };

module.exports={
    adminloginLoad,
    adminloginDashboard,
    backtodashboard
   
}