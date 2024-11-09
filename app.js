const express = require("express");
const session = require("express-session");

const path = require("path");
const userRoute = require("./routes/userroutes");
const passport = require("passport");

const dotenv = require("dotenv").config();
const connectDB=require("./db")
const app = express();
connectDB();
const adminRoute = require("./routes/adminRoute");
const STATUS_CODES = require("./helper/statusCode");


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(
  session({
    secret: "yourSecretKey",
    resave: false,
    saveUninitialized: false,
    // cookie: { secure: true, httpOnly: true },
  })
);


app.use(express.static(path.join(__dirname, "public")));
app.use("/", userRoute);
app.use("/", adminRoute);

// app.use((err,req, res, next) => {
//   console.error('errrrrrrrrrrrrrrrrrrr',err.stack);
//   if (err.status === STATUS_CODES.NOT_FOUND) {
//     res.status(STATUS_CODES.NOT_FOUND).render('user/page404');
//   } else {
//     res.status(err.status || STATUS_CODES.INTERNAL_SERVER_ERROR).render('user/errorPage')
   
//   }
// });
app.use((err, req, res, next) => {
  console.error('Error occurred:', err.stack);

  const statusCode = err.status || STATUS_CODES.INTERNAL_SERVER_ERROR;

  // Check if the response headers were already sent, pass the error to the default error handler if so
  if (res.headersSent) {
    return next(err);
  }

  // Set the status code
  res.status(statusCode);

  // Determine response type and render appropriate page or send JSON response
  if (req.accepts('html')) {
    // Render specific pages based on the status code
    if (statusCode === STATUS_CODES.NOT_FOUND) {
      res.render('user/page404', {
        message: err.message || 'Page not found',
        status: statusCode
      });
    } else {
      res.render('user/errorPage', {
        message: err.message || 'An error occurred',
        status: statusCode
      });
    }
  } else if (req.accepts('json')) {
    // Respond with JSON for API requests
    res.json({ error: err.message || 'An error occurred', status: statusCode });
  } else {
    // Fallback for plain text response
    res.type('txt').send('Error occurred');
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`server running at http://localhost:${PORT}`);
});
