const mongoose = require('mongoose')

const cartSchema = new mongoose.Schema({
  
        user : {
            type : String,
            required : true,
            unique : true,
            index: true
        },
        items : [{
            productId : {
                type : String,
                required : true
            },
            quantity : {
                type : Number,
                required : true,
                min: [1, 'Quantity cannot be less than 1.'],
                default : 1
            }
        }]
},{timestamps : true})

const cartModel = new mongoose.model("Cart",cartSchema);

module.exports = cartModel;