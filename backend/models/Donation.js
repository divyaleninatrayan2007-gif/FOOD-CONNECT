const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema({
    foodName: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    preparationTime: String,
    expiryTime: String,
    address: {
        type: String,
        required: true
    },
    freshness: String,
    priority: String,
    co2Saved: Number,
    status: {
        type: String,
        default: "available"
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Donation", donationSchema);