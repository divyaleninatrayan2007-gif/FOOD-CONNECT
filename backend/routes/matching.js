
const express = require("express");
const router = express.Router();

const Donation = require("../models/Donation");
const FoodRequest = require("../models/FoodRequest");


// ==========================================
// AI SMART MATCHING
// ==========================================

router.post("/", async (req, res) => {

    try {

        const { requestId } = req.body;


        // Check request ID
        if (!requestId) {

            return res.status(400).json({
                success: false,
                message: "Request ID is required"
            });

        }


        // Find NGO food request
        const request =
            await FoodRequest.findById(requestId);


        if (!request) {

            return res.status(404).json({
                success: false,
                message: "Food request not found"
            });

        }


        // Get available donations
        const donations =
            await Donation.find({
                status: {
                    $in: ["available", "pending"]
                }
            });


        // No donations
        if (donations.length === 0) {

            return res.json({
                success: true,
                matched: false,
                message:
                    "No donations available for matching"
            });

        }


        // ==========================================
        // CALCULATE MATCHING SCORE
        // ==========================================

        const scoredDonations =
            donations.map(function (donation) {
                let score = 0;
                // ----------------------------------
                // 1. FOOD CATEGORY - 40 POINTS
                // ----------------------------------
                const requestCategory =
                    (request.category || "")
                    .toLowerCase()
                    .trim();
                const donationCategory =
                    (donation.category || "")
                    .toLowerCase()
                    .trim();
                const isAnyCategory =
                    requestCategory === "" ||
                    requestCategory === "mixed / any" ||
                    requestCategory === "mixed/any" ||
                    requestCategory === "any";
                if (isAnyCategory) {
                    score += 40;
                }
                else if (
                    donationCategory === requestCategory
                ) {
                    score += 40;

                }
                // ----------------------------------
                // 2. QUANTITY - 30 POINTS
                // ----------------------------------

                const donationQuantity =
                    Number(donation.quantity) || 0;

                const requestedQuantity =
                    Number(request.quantity) || 0;


                if (
                    donationQuantity >=
                    requestedQuantity
                ) {

                    score += 30;

                }
                else if (
                    donationQuantity >=
                    requestedQuantity * 0.5
                ) {

                    score += 15;

                }


                // ----------------------------------
                // 3. URGENCY - 20 POINTS
                // ----------------------------------

                const urgency =
                    (request.urgency || "")
                    .toLowerCase();


                if (urgency === "high") {

                    score += 20;

                }
                else if (urgency === "medium") {

                    score += 10;

                }
                else {

                    score += 5;

                }


                // ----------------------------------
                // 4. FRESHNESS - 10 POINTS
                // ----------------------------------

                const freshness =
                    (donation.freshness || "")
                    .toLowerCase();


                if (
                    freshness.includes("fresh")
                ) {

                    score += 10;

                }


                return {
                    donation: donation,
                    score: score
                };

            });


        // ==========================================
        // SORT BEST MATCH FIRST
        // ==========================================

        scoredDonations.sort(
            function (a, b) {
                return b.score - a.score;
            }
        );


        const bestMatch =
            scoredDonations[0];


        if (!bestMatch) {

            return res.json({
                success: true,
                matched: false,
                message:
                    "No suitable donation found"
            });

        }


        // ==========================================
        // MATCH PERCENTAGE
        // ==========================================

        const matchPercentage =
            Math.min(
                bestMatch.score,
                100
            );


        // ==========================================
        // SEND MATCH RESULT
        // ==========================================

        res.json({

            success: true,

            matched: true,

            matchPercentage:
                matchPercentage,

            request:
                request,

            donation:
                bestMatch.donation,

            donationId:
                bestMatch.donation._id,

            message:
                "Best donation match found successfully"

        });


    } catch (error) {

        console.error(
            "Matching Error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Matching failed",

            error:
                error.message

        });

    }

});


// ==========================================
// CONFIRM / ACCEPT MATCH
// ==========================================

router.post("/confirm", async (req, res) => {

    try {

        const {
            requestId,
            donationId,
            matchPercentage
        } = req.body;


        // ------------------------------------------
        // CHECK REQUIRED IDs
        // ------------------------------------------

        if (!requestId || !donationId) {

            return res.status(400).json({

                success: false,

                message:
                    "Request ID and Donation ID are required"

            });

        }


        // ------------------------------------------
        // FIND FOOD REQUEST
        // ------------------------------------------

        const request =
            await FoodRequest.findById(requestId);


        if (!request) {

            return res.status(404).json({

                success: false,

                message:
                    "Food request not found"

            });

        }


        // ------------------------------------------
        // FIND DONATION
        // ------------------------------------------

        const donation =
            await Donation.findById(donationId);


        if (!donation) {

            return res.status(404).json({

                success: false,

                message:
                    "Donation not found"

            });

        }


        // ------------------------------------------
        // CHECK DONATION STATUS
        // ------------------------------------------

        if (
            donation.status === "matched"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "This donation has already been matched"

            });

        }


        // ------------------------------------------
        // SAVE MATCHED DONATION IN REQUEST
        // ------------------------------------------

        request.status = "Matched";

        request.matchedDonationId =
            donation._id;

        await request.save();


        // ------------------------------------------
        // UPDATE DONATION STATUS
        // ------------------------------------------

        donation.status = "matched";

        await donation.save();


        // ------------------------------------------
        // SUCCESS RESPONSE
        // ------------------------------------------

        return res.json({

            success: true,

            message:
                "Match accepted successfully",

            match: {

                requestId:
                    request._id,

                donationId:
                    donation._id,

                matchPercentage:
                    matchPercentage || 0

            }

        });


    } catch (error) {

        console.error(
            "Confirm Match Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to confirm match",

            error:
                error.message

        });

    }

});


module.exports = router;
