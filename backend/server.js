const dns = require("dns");

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const donationRoutes = require("./routes/donations");
const foodRequestRoutes = require("./routes/foodRequests");
const matchingRoutes = require("./routes/matching");
const volunteerRoutes = require("./routes/volunteerRoutes");
const adminRoutes = require("./routes/adminRoutes");
const alertsRoutes = require("./routes/alerts");
console.log("Volunteer routes loaded");

require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB Connected");
    })
    .catch((err) => {
        console.log("MongoDB Error:", err);
    });

// Test route
app.get("/", (req, res) => {
    res.json({
        message: "Food Connect Backend is Running"
    });
});
app.get("/api/test", (req, res) => {
    res.json({
        message: "Main server is working"
    });
});
// API routes
app.use("/api/donations", donationRoutes);

app.use("/api/food-requests", foodRequestRoutes);

app.use("/api/matching", matchingRoutes);

app.use("/api/volunteers", volunteerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/alerts", alertsRoutes);

// Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Food Connect server running on port ${PORT}`);
});