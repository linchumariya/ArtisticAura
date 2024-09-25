const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
require("dotenv").config();
const Usermodel = require("../model/userModel");


passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const existingUser = await Usermodel.findOne({ googleId: profile.id });

        console.log("existingUser" ,existingUser)
        if (existingUser) {
          return done(null, existingUser);
        }

        const newUser = new Usermodel({
          googleId: profile.id,
          name: profile.displayName,
          email:
            profile.emails && profile.emails.length > 0
              ? profile.emails[0].value
              : "",
          password: "",
          phone: null,
        });

        await newUser.save();

        return done(null, newUser);
      } catch (err) {
        console.error("Error in Google authentication:", err);
        return done(err, null);
      }
    }
  )
);


passport.serializeUser((user, done) => {
  // console.log('Serializing user:', user.id);
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  // console.log('Deserializing user:', id);
  try {
    const user = await Usermodel.findById(id);
    console.log("user is", user);

    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// const authController = {
//   googleAuth: passport.authenticate("google", {
//     scope: ["profile", "email"],
//   }),

//   googleAuthCallback: passport.authenticate("google", {
//     failureRedirect: "/register",
//     successRedirect: "/",
//   }),
// };

const googleAuth = passport.authenticate('google', { scope: ["email", "profile"] });
const googleAuthCallback = (req, res, next) => {
  passport.authenticate('google', (err, user, info) => {
    if (err) { return next(err); }

    console.log("callback...",user)
    if (!user) { return res.redirect('/register'); }

    req.logIn(user, (err) => {
      if (err) { return next(err); }

      req.session.user = user; 
      console.log("existingUser" , req.session.user)

      return res.redirect('/');
    });
  })(req, res, next);
};

const authController = {
  googleAuth, googleAuthCallback};


module.exports = authController;
