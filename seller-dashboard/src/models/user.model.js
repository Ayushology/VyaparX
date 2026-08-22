const mongoose = require('mongoose');
const addressSchema = new mongoose.Schema({
       street: String,
        city: String,
        state: String,
        zip: String,
        country: String,
        isDefault: { type: Boolean, default: false } 
})
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        select : false
    },
    fullName: {
        firstName: { 
            type: String, 
            required: true 
        },
        lastName: { 
            type: String, 
            required: true 
        }
    },
    role: {
        type: String,
        enum: ['buyer', 'seller', 'admin'],
        default: 'buyer'
    },
    addresses: [
        addressSchema
    ]
}, { 
    timestamps: true 
});

const userModel = mongoose.model('User', userSchema);
module.exports = userModel;