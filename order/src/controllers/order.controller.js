const { default: axios } = require('axios');
const mongoose = require('mongoose');

async function createOrder(req,res) {
    const user = req.user;
    const token = req.cookies?.token || req.headers?.authorization?.split(" ")[1];
    try{
        const cartResponse = await axios.get(`http://localhost:3002/api/cart`,{
            headers : {
                Authorization : `Bearer ${token}`
            }
        });
        console.log("Cart Response" , cartResponse.data);
        
    }catch(err){
        console.log(err);
        return res.status(500).json({
            message : "Internal Server Error",
            error : err.message
        })
    }
}


module.exports = {createOrder};