const express = require("express");
const session = require("express-session");
const bodyparser = require("body-parser");
const path = require("path");
const userRoute = require("./routes/userroutes");
const dotenv=require('dotenv').config();

const app = express();
const mongoose = require("mongoose");
const adminRoute = require("./routes/adminRoute");

mongoose
  .connect(process.env.DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(
  session({
    secret: "yourSecretKey",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(express.static(path.join(__dirname, "public")));
app.use("/", userRoute);
app.use("/", adminRoute);

const PORT=process.env.PORT||3000;
app.listen(PORT, () => {
  console.log(`server running at http://localhost:${PORT}`);
});
