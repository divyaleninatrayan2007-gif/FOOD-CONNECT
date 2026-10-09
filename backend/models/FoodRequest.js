const mongoose = require("mongoose");

const foodRequestSchema = new mongoose.Schema(
  {
    ngoName: {
      type: String,
      required: true
    },

    foodType: {
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

    requiredDate: {
      type: String,
      required: true
    },

    requiredTime: {
      type: String,
      required: true
    },

    address: {
      type: String,
      required: true
    },

    peopleCount: {
      type: Number,
      required: true
    },

    foodName: {
      type: String
    },

    notes: {
      type: String
    },

    urgency: {
      type: String,
      default: "Normal"
    },

    status: {
      type: String,
      default: "Pending"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("FoodRequest", foodRequestSchema);