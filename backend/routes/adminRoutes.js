const express = require("express");
const router = express.Router();

const Admin = require("../models/Admin");
const Volunteer = require("../models/Volunteer");
const Donation = require("../models/Donation");
const FoodRequest = require("../models/FoodRequest");

// ==========================================
// TEST ADMIN ROUTE
// ==========================================

router.get("/test", (req, res) => {
    res.json({
        success: true,
        message: "Admin route is working"
    });
});


// ==========================================
// ADMIN LOGIN
// ==========================================

router.post("/login", async (req, res) => {

    try {

        const { email, password } = req.body;

        // Check fields
        if (!email || !password) {

            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });

        }


        // Find admin
        const admin = await Admin.findOne({
            email: email.toLowerCase().trim()
        });


        // Admin not found
        if (!admin) {

            return res.status(401).json({
                success: false,
                message: "Invalid admin email or password"
            });

        }


        // Check password
        if (admin.password !== password) {

            return res.status(401).json({
                success: false,
                message: "Invalid admin email or password"
            });

        }


        // Login successful
        res.json({

            success: true,

            message: "Admin login successful",

            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role
            }

        });

    } catch (error) {

        console.error(
            "Admin login error:",
            error
        );

        res.status(500).json({

            success: false,

            message: "Admin login failed",

            error: error.message

        });

    }

});


// ==========================================
// CREATE ADMIN
// ==========================================

router.post("/register", async (req, res) => {

    try {

        const {
            name,
            email,
            password
        } = req.body;


        if (!name || !email || !password) {

            return res.status(400).json({

                success: false,

                message:
                    "Name, email and password are required"

            });

        }


        // Check existing admin
        const existingAdmin =
            await Admin.findOne({
                email: email.toLowerCase().trim()
            });


        if (existingAdmin) {

            return res.status(400).json({

                success: false,

                message:
                    "Admin already exists with this email"

            });

        }


        // Create admin
        const admin = new Admin({

            name: name.trim(),

            email: email.toLowerCase().trim(),

            password: password,

            role: "admin"

        });


        const savedAdmin =
            await admin.save();


        console.log(
            "Admin created:",
            savedAdmin._id
        );


        res.status(201).json({

            success: true,

            message:
                "Admin created successfully",

            admin: {

                id: savedAdmin._id,

                name: savedAdmin.name,

                email: savedAdmin.email,

                role: savedAdmin.role

            }

        });

    } catch (error) {

        console.error(
            "Admin registration error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Failed to create admin",

            error:
                error.message

        });

    }

});
// ==========================================
// ADMIN DASHBOARD STATISTICS
// ==========================================

router.get("/dashboard", async (req, res) => {

    try {

        const volunteers =
            await Volunteer.countDocuments();

        const donations =
            await Donation.countDocuments();

        const requests =
            await FoodRequest.countDocuments();

        const matches =
            await FoodRequest.countDocuments({
                status: "Matched"
            });

        const recentDonations =
            await Donation.find()
                .sort({ createdAt: -1 })
                .limit(3);

        const recentRequests =
            await FoodRequest.find()
                .sort({ createdAt: -1 })
                .limit(3);

        const recentActivity = [];

        recentDonations.forEach(function (donation) {

            recentActivity.push({

                message:
                    "New donation: " +
                    donation.foodName,

                status:
                    donation.status

            });

        });

        recentRequests.forEach(function (request) {

            recentActivity.push({

                message:
                    "NGO request: " +
                    request.ngoName,

                status:
                    request.status

            });

        });

        res.json({

            success: true,

            statistics: {

                volunteers: volunteers,

                donations: donations,

                requests: requests,

                matches: matches

            },

            recentActivity: recentActivity

        });

    } catch (error) {

        console.error(
            "Admin Dashboard Error:",
            error
        );

        res.status(500).json({

            success: false,

            message: "Failed to load dashboard",

            error: error.message

        });

    }

});

// ==========================================
// GET ALL VOLUNTEERS
// ==========================================

router.get("/volunteers", async (req, res) => {

    try {

        const volunteers = await Volunteer.find()
            .select("-password")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            volunteers: volunteers
        });

    } catch (error) {

        console.error(
            "Get Volunteers Error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to load volunteers",
            error: error.message
        });

    }

});

// ==========================================
// GET ALL DONATIONS
// ==========================================

router.get("/donations", async (req, res) => {

    try {

        const donations = await Donation.find()
            .sort({ createdAt: -1 });

        res.json({

            success: true,

            donations: donations

        });

    } catch (error) {

        console.error(
            "Get Donations Error:",
            error
        );

        res.status(500).json({

            success: false,

            message: "Failed to load donations",

            error: error.message

        });

    }

});
// ==========================================
// GET ALL NGO FOOD REQUESTS
// ==========================================

router.get("/requests", async (req, res) => {

    try {

        const requests = await FoodRequest.find()
            .sort({ createdAt: -1 });

        res.json({

            success: true,

            requests: requests

        });

    } catch (error) {

        console.error(
            "Get Food Requests Error:",
            error
        );

        res.status(500).json({

            success: false,

            message: "Failed to load food requests",

            error: error.message

        });

    }

});

// ==========================================
// GET MATCHED FOOD REQUESTS
// ==========================================

router.get("/matches", async (req, res) => {

    try {

        const matchedRequests =
            await FoodRequest.find({
                status: "Matched"
            }).sort({
                updatedAt: -1
            });

        res.json({

            success: true,

            matches: matchedRequests

        });

    } catch (error) {

        console.error(
            "Get Matches Error:",
            error
        );

        res.status(500).json({

            success: false,

            message: "Failed to load matches",

            error: error.message

        });

    }

});



module.exports = router;
