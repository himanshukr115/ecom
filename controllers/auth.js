const User = require("../models/user");

var jwt = require('jsonwebtoken');
var expressJwt = require('express-jwt');
const { body, validationResult } = require('express-validator');

exports.signup = (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({
      error: errors.array()[0].msg
    });
  }

  const user = new User(req.body);
  user.save((err, user) => {
    if (err) {
      return res.status(400).json({
        err: "NOT able to save user in DB"
      });
    }
    res.json({
      name: user.name,
      email: user.email,
      id: user._id
    });
  });
};

exports.signin = (req, res) => {
  const errors = validationResult(req);
  const {email, password} = req.body;

  if (!errors.isEmpty()) {
    return res.status(422).json({
      error: errors.array()[0].msg
    });
  }
  User.findOne({email}, (err, user) => {
    if(err || !user){
      res.status(400).json({
        error : "User email does not exoist"
      })
    }

    if(!user.autheticate(password)){
      return res.status(401).json({
        error: "Email and password do not match"
      })
    }
//CRERATE TOKEN
const token = jwt.sign({_id : user._id}, process.env.SECRET)
// PUT TOKEN IN COOKIE
res.cookie("token", token, {expire: new Date() + 9999})

//send respon to front end 
const {_id, name , email, role} = user;
return res.json({token, user: {_id, name, email, role}})

  })


}


exports.signout = (req, res) => {
  res.clearCookie("token")
  res.json({
    message: "User signout"
  });
};


 //protected

exports.isSignedIn = expressJwt ({
  secret : process.env.SECRET,
  algorithms: ['HS256'],
  userProperty: "auth"

})


// //cm


exports.isAuthenticated = (req, res, next) => {
  let checker = req.profile && req.auth && req.profile._id == req.auth._id;
  if (!checker) {
    return res.status(403).json({
      error: "ACCESS DENIED"
    });
  }
  next();
};

exports.isAdmin = (req, res, next) => {
  if (req.profile.role === 0) {
    return res.status(403).json({
      error: "You are not ADMIN, Access denied"
    });
  }
  next();
};