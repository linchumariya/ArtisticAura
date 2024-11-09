const mongoose=require("mongoose")
const dotenv=require("dotenv").config()
const connectDB=async()=>{
    try {

        await mongoose.connect(process.env.DB_URL,{
            useNewUrlParser: true,
            useUnifiedTopology: true,  
        });
        console.log("MongoDB connected");
    } catch (error) {
        console.error("MongoDB connection error:", err);
    }};
module.exports = connectDB;