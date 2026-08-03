const cartModel = require("../models/cart.model");

// ADD ITEM TO CART CONTROLLER
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
      (item) => item.productId.toString() === productId,
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
// UPDATE ITEM IN CART CONTROLLER
async function updateItemInCart(req, res) {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
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

    const cart = await cartModel.findOne({
      user: user.id,
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const existingItemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId,
    );

    if (existingItemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart",
      });
    }

    cart.items[existingItemIndex].quantity = quantity;
    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Item quantity updated successfully",
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
// GET CART CONTROLLER
async function getCart(req,res) {
   try{
    const user = req.user;

    const cart = await cartModel.findOne({
        user : user.id,
    })

    if(!cart){
        cart = new cartModel({user:user.id,items : []});
        await cart.save();
    }
    
    return res.status(200).json({
        success : true,
        message : "Cart retrieved successfully",
        cart : cart,
        totalItems: {
            inCart: cart.items.length,
            totalQuantity: cart.items.reduce((total, item) => total + item.quantity, 0),
        }
    })

   }catch(error){
    console.error(error);
    return res.status(500).json({
        success : false,
        message : "Internal server error",
    })
   }
};
// DELETE CART CONTROLLER
async function deleteCart(req,res){
    try{
        const user = req.user;
        const cart = await cartModel.findOne({ user: user.id });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found",
            });
        }

        await cart.remove();

        return res.status(200).json({
            success: true,
            message: "Cart deleted successfully",
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
// REMOVE ITEM FROM CART CONTROLLER
async function removeItemFromCart(req, res) {
    try {
        const { productId } = req.params;
        const user = req.user;  
        const cart = await cartModel.findOne({ user: user.id });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found",
            });
        }
        cart.items = cart.items.filter(item => item.productId.toString() !== productId);
        await cart.save();
        return res.status(200).json({
            success: true,
            message: "Item removed from cart successfully",
            cart: cart,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
}   

module.exports = { addItemToCart, updateItemInCart, getCart, deleteCart, removeItemFromCart };
