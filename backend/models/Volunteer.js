const mongoose = require("mongoose");

const volunteerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: true
    },

    phone: {
      type: String,
      required: true
    },

    vehicle: {
      type: String,
      required: true,
      enum: ["Car", "Van", "Bike", "On Foot"]
    },

    baseAddress: {
      type: String,
      required: true
    },

    maxDistance: {
      type: Number,
      required: true
    },

    availability: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Volunteer", volunteerSchema);