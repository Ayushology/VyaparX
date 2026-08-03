const cartModel = require('../models/cart.model');

async function addItemToCart(req, res) {
    try {
        const { productId, quantity = 1 } = req.body;
        const user = req.user;

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: "Product ID is required",
            });
        }

        if (!quantity || quantity < 1) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be greater than 0",
            });
        }

        let cart = await cartModel.findOne({
            user: user.id,
        });

        // if cart does not exist, create a new cart for the user
        if (!cart) {
            cart = new cartModel({
                user: user.id,
                items: [],
            });
        }

        // index
        const existingItemIndex = cart.items.findIndex(
            item => item.productId.toString() === productId
        );

        if (existingItemIndex !== -1) {
            // if item already exists in the cart, update the quantity
            cart.items[existingItemIndex].quantity += quantity;
        } else {
            // if item does not exist in the cart, add it to the cart
            cart.items.push({ productId, quantity });
        }

        // save the updated cart
        await cart.save();

        return res.status(201).json({
            success: true,
            message: "Item added to cart successfully",
            cart: cart,
        });
    } catch (err) {
        console.error(err);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
}

module.exports = { addItemToCart };