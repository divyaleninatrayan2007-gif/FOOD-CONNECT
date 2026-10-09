const express = require("express");
const router = express.Router();

const FoodRequest = require("../models/FoodRequest");

// CREATE FOOD REQUEST
router.post("/", async (req, res) => {
    try {
        const foodRequest = new FoodRequest(req.body);

        const savedRequest = await foodRequest.save();

        res.status(201).json({
            success: true,
            message: "Food request saved successfully",
            request: savedRequest
        });

    } catch (error) {
        console.error("Food Request Error:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


// GET ALL FOOD REQUESTS
router.get("/", async (req, res) => {
    try {
        const requests = await FoodRequest
            .find()
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            requests: requests
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


// DELETE FOOD REQUEST
router.delete("/:id", async (req, res) => {
    try {
        await FoodRequest.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: "Food request deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


module.exports = router;