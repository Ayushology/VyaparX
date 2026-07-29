  const userModel = require('../models/user.model');
  const bcrypt = require('bcrypt');
  const jwt = require('jsonwebtoken')
  const redis = require('../db/redis')
// REGISTER CONTROLLER
  async function registerUser(req, res) {
  
    try {
      const { username, email, password,role = 'buyer',fullName: { firstName, lastName } } = req.body;
      
      if(!username || !email || !password || !firstName){
        return res
            .status(400)
            .json({message: "Missing required fields."});
      }

      const ifUserAlreadyExists = await userModel.findOne({
        $or: [
        {username: username.toLowerCase()},
        {email: email.toLowerCase()}
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
        role,
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
        sameSite : "strict",
        maxAge : 24*60*60*1000
      });
    
      return res.status(201).json({
        message: "User registered successfully",
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
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
// LOGIN CONTROLLER
  async function loginUser(req, res) {
    try {
      const {username,email, password} = req.body;

      if (!password || (!username && !email)){
      return res.status(400).json({message: "Please provide credentials and password."});
    }
    
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
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000
      });

      return res.status(200).json({
        message: 'Login successful',
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role : user.role,
          fullName: user.fullName
        }
      });
    } catch (error) {
      console.error('Error during login:', error);
      return res.status(500).json({ message: 'An internal server error occurred' });
    }
  }
// GET CURRENT USER CONTROLLER
  async function getCurrentUser(req,res) {
    return res.status(200).json({
      message : "User Profile Succesfully fetched",
      user : req.user
    })
  }
// LOGOUT CONTROLLER
  async function logoutUser(req, res) {
  const token = req.cookies.token;

  // blacklist is a mechanism to invalidate JWT tokens before their expiration time.
  // When a user logs out, the token is added to a blacklist stored in Redis.
  // This way, even if the token is still valid, it will be considered invalid for future requests.

  try {
    if (token) {
      const decoded = jwt.decode(token);

      if (decoded && decoded.exp) {
        const nowInSeconds = Math.floor(Date.now() / 1000);
        const remainingTime = decoded.exp - nowInSeconds;

        if (remainingTime > 0) {
          await redis.set(
            `blacklist:${token}`,
            "true",
            "EX",
            remainingTime
          );
        }
      }
    }
  } catch (error) {
    console.error("Redis error while blacklisting token:", error);
  }

  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  });

  return res.status(200).json({
    message: "Logout successful",
  });
}
// CREATE ADDRESS CONTROLLER
  async function createAddress(req, res) {
  const id = req.user.id;

  const { street, city, state, zip, country, isDefault } = req.body;

  try {
    const user = await userModel.findById(id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // If this address is the default one,
    // remove the default flag from existing addresses.
    if (isDefault) {
      user.addresses.forEach((address) => {
        address.isDefault = false;
      });
    }

    user.addresses.push({
      street,
      city,
      state,
      zip,
      country,
      isDefault,
    });

    await user.save();

    return res.status(201).json({
      message: "Address created successfully",
      address: user.addresses[user.addresses.length - 1],
    });
  } catch (error) {
    console.error("Error creating address:", error);

    return res.status(500).json({
      message: "An internal server error occurred",
    });
  }
  }
// GET ADDRESS CONTROLLER
  async function getAddress(req, res) {
  const id = req.user.id;

  try {
    const user = await userModel.findById(id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      message: "Addresses fetched successfully",
      addresses: user.addresses,
    });

  } catch (error) {
    console.error("Error fetching addresses:", error);

    return res.status(500).json({
      message: "An internal server error occurred",
    });
  }
  }
// DELETE ADDRESS CONTROLLER
  async function deleteAddress(req, res) {
  const id = req.user.id;
  const { addressId } = req.params;
  try {
    const user = await userModel.findById(id);  
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const addressIndex = user.addresses.findIndex(
      (address) => address._id.toString() === addressId
    );

    if (addressIndex === -1) {
      return res.status(404).json({
        message: "Address not found",
      });
    }

    user.addresses.splice(addressIndex, 1);
    await user.save();

    return res.status(200).json({
      message: "Address deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting address:", error);

    return res.status(500).json({
      message: "An internal server error occurred",
    });
  }
  }
  module.exports = { registerUser, loginUser,getCurrentUser, logoutUser, createAddress, getAddress, deleteAddress };