  const userModel = require('../models/user.model');
  const bcrypt = require('bcrypt');
  const jwt = require('jsonwebtoken')


  async function registerUser(req, res) {
  
    try {
      const { username, email, password, fullName: { firstName, lastName } } = req.body;

      const ifUserAlreadyExists = await userModel.findOne({
        $or: [
          { username },
          { email }
        ]
      });

      if (ifUserAlreadyExists) {
        return res.status(409).json({
          message: "Username or email already registered"
        });
      }

      const hash = await bcrypt.hash(password, 10);

      const user = await userModel.create({
        username,
        email,
        password: hash,
        fullName: {
          firstName, lastName
        }
      });

      const token = jwt.sign({
        id : user._id,
        email : user.email,
        username : user.username,
        role : user.role
      },process.env.JWT_SECRET,{expiresIn : '1d'});

      res.cookie("token",token,{
        httpOnly : true,
        secure : true,
        maxAge : 24*60*60*1000
      });
    
      return res.status(201).json({
        message: "User registered successfully",
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName
        }
      });

    } catch (error) {
      console.error("Error during registration:", error);
      return res.status(500).json({ 
        message: "An internal server error occurred" 
      });
    }
  }
  async function loginUser(req, res) {
    try {
      const { username,email, password } = req.body;
      const user = await userModel.findOne({ $or :[{username},{email}] }).select('+password');
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign({
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role
      }, process.env.JWT_SECRET, { expiresIn: '1d' });

      res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        maxAge: 24 * 60 * 60 * 1000
      });

      return res.status(200).json({
        message: 'Login successful',
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName
        }
      });
    } catch (error) {
      console.error('Error during login:', error);
      return res.status(500).json({ message: 'An internal server error occurred' });
    }
  }
  async function getCurrentUser(req,res) {
    
  }


  module.exports = { registerUser, loginUser };