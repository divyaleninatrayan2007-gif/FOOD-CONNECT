const express = require("express");
const router = express.Router();
const Donation = require("../models/Donation");
// CREATE DONATION
router.post("/", async (req, res) => {
    try {
        const donation = new Donation(req.body);
        const savedDonation = await donation.save();
        res.status(201).json({
            success: true,
            message: "Donation saved successfully",
            donation: savedDonation
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});
// GET ALL DONATIONS
router.get("/", async (req, res) => {
    try {
        const donations = await Donation.find().sort({ createdAt: -1 });
        res.json({
            success: true,
            donations
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});
module.exports = router;