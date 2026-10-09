
const express = require("express");
const router = express.Router();

const Donation = require("../models/Donation");
const FoodRequest = require("../models/FoodRequest");
const Volunteer = require("../models/Volunteer");


// ==========================================
// GET ALL ALERTS
// ==========================================

router.get("/", async (req, res) => {

    try {

        const alerts = [];


        // ==========================================
        // RECENT DONATIONS
        // ==========================================

        const donations =
            await Donation.find()
                .sort({ createdAt: -1 })
                .limit(10);


        donations.forEach(function (donation) {

            let type = "info";
            let icon = "🍱";
            let category = "System";
            let title = "New food donation";


            if (donation.status === "matched") {

                type = "ai";
                icon = "🎯";
                category = "AI Match";
                title = "Donation matched";

            }


            alerts.push({

                id:
                    "donation-" +
                    donation._id,

                type:
                    type,

                icon:
                    icon,

                title:
                    title,

                text:
                    donation.foodName +
                    " · " +
                    donation.quantity +
                    " kg",

                time:
                    donation.createdAt,

                category:
                    category,

                read: false

            });

        });


        // ==========================================
        // NGO FOOD REQUESTS
        // ==========================================

        const requests =
            await FoodRequest.find()
                .sort({ createdAt: -1 })
                .limit(10);


        requests.forEach(function (request) {

            let type = "info";
            let icon = "🏠";
            let category = "System";
            let title = "New NGO food request";


            if (request.status === "Matched") {

                type = "ai";
                icon = "🎯";
                category = "AI Match";
                title = "Food request matched";

            }


            alerts.push({

                id:
                    "request-" +
                    request._id,

                type:
                    type,

                icon:
                    icon,

                title:
                    title,

                text:
                    request.ngoName +
                    " needs " +
                    request.quantity +
                    " kg of " +
                    request.category,

                time:
                    request.createdAt,

                category:
                    category,

                read: false

            });

        });


        // ==========================================
        // VOLUNTEERS
        // ==========================================

        const volunteers =
            await Volunteer.find()
                .sort({ createdAt: -1 })
                .limit(10);


        volunteers.forEach(function (volunteer) {

            alerts.push({

                id:
                    "volunteer-" +
                    volunteer._id,

                type:
                    "info",

                icon:
                    "🚗",

                title:
                    "New volunteer registered",

                text:
                    volunteer.name +
                    " joined the Food Connect volunteer network.",

                time:
                    volunteer.createdAt,

                category:
                    "System",

                read: false

            });

        });


        // ==========================================
        // SORT ALL ALERTS
        // ==========================================

        alerts.sort(function (a, b) {

            return new Date(b.time) -
                   new Date(a.time);

        });


        // ==========================================
        // RETURN RESPONSE
        // ==========================================

        res.json({

            success: true,

            alerts:
                alerts

        });


    } catch (error) {

        console.error(
            "Alerts Error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Failed to load alerts",

            error:
                error.message

        });

    }

});


module.exports = router;
