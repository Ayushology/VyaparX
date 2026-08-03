const cartModel = require('../models/cart.model')


async function addItemToCart(req,res) {
    const {productId,quantity} = req.body;
    const user = req.user;
    let cart = await cartModel.findOne({
        user : user.id
    })
    // if cart does not exist, create a new cart for the user
    if(!cart){
        cart = new cartModel({user : user.id, items : []});
    }
    // index
    const existingItemIndex = cart.items.findIndex(item => item.productId === productId);
    if(existingItemIndex !== -1){
        // if item already exists in the cart, update the quantity
        cart.items[existingItemIndex].quantity += quantity;
    }
    else{
        // if item does not exist in the cart, add it to the cart
        cart.items.push({productId : productId, quantity : quantity});
    }
    // save the updated cart
    await cart.save();
    res.status(200).json({
        message : "Item added to cart successfully",
        cart : cart
    })
}

module.exports = {addItemToCart}