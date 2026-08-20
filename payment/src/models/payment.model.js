const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
        
    vyaparxOrderId: { 
        type: String, 
        required: true,
        index: true,
        trim: true 
    },
    userId: {
        type: String, 
        required: true,
        index: true,
        trim: true 
    },
    

    price: {                  // Added to prevent partial payment exploits
        amount: { type: Number, required: true },
        currency: { type: String, required: true, default: 'INR', enum: ['INR', 'USD'] }
    },


    razorpayOrderId: { 
        type: String, 
        required: true,
        unique: true,
        trim: true
    },
    razorpayPaymentId: { 
        type: String,
        trim: true,
        sparse: true 
    },
    razorpaySignature: { 
        type: String,
        trim: true
    },
    

    status: { 
        type: String, 
        enum: ['PENDING', 'COMPLETED', 'FAILED'], 
        default: "PENDING" 
    }
}, { 
    timestamps: true 
});

const PaymentModel = mongoose.model("Payment", paymentSchema);
module.exports = PaymentModel;