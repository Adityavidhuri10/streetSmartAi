const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const User = require("../models/userModel");
const Property = require("../models/propertyModel");
const Booking = require("../models/bookingModel");
const Notification = require("../models/notificationModel");
const connectDB = require("../config/db");

const path = require("path");
dotenv.config({ path: path.join(__dirname, "../.env") });

const createDemoData = async () => {
    try {
        await connectDB();

        // 1. Create Demo Landlord
        const landlordEmail = "landlord@demo.com";
        let landlord = await User.findOne({ email: landlordEmail });

        if (!landlord) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash("password123", salt);
            landlord = await User.create({
                name: "Demo Landlord",
                email: landlordEmail,
                password: hashedPassword,
                role: "landlord"
            });
            console.log("Created Demo Landlord: landlord@demo.com / password123");
        } else {
            console.log("Demo Landlord already exists");
        }

        // 2. Create Demo Tenant
        const tenantEmail = "tenant@demo.com";
        let tenant = await User.findOne({ email: tenantEmail });

        if (!tenant) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash("password123", salt);
            tenant = await User.create({
                name: "Demo Tenant",
                email: tenantEmail,
                password: hashedPassword,
                role: "tenant"
            });
            console.log("Created Demo Tenant: tenant@demo.com / password123");
        } else {
            console.log("Demo Tenant already exists");
        }

        // 3. Create Demo Property
        let property = await Property.findOne({ title: "Luxury Demo Apartment" });
        if (!property) {
            property = await Property.create({
                title: "Luxury Demo Apartment",
                description: "A beautiful demo apartment for testing purposes.",
                price: 25000,
                address: "123 Demo Street",
                city: "Greater Noida",
                state: "Uttar Pradesh",
                owner: landlord._id,
                images: ["https://placehold.co/600x400?text=Demo+Property"],
                features: ["WiFi", "Parking", "Gym"],
                bhk: "3 BHK",
                area: "1500 sqft",
                status: "available"
            });
            console.log("Created Demo Property");
        }

        // 4. Create Booking (if not exists)
        let booking = await Booking.findOne({ property: property._id, user: tenant._id });
        if (!booking) {
            booking = await Booking.create({
                user: tenant._id,
                property: property._id,
                status: "pending",
                proofImage: ["https://placehold.co/600x400?text=Condition+Proof"],
                defectAnalysis: {
                    summary: {
                        defect_detected: false,
                        defect_types: [],
                        total_images: 1
                    },
                    results: [
                        {
                            analysis: {
                                defect_detected: false,
                                defect_type: "Normal"
                            }
                        }
                    ]
                },
                agreementAnalysis: {
                    risk_score: 2,
                    summary: "Standard agreement with low risk.",
                    flagged_clauses: []
                }
            });
            console.log("Created Demo Booking");

            // Update property status
            property.status = "booked";
            await property.save();

            // 5. Create Notification
            await Notification.create({
                recipient: landlord._id,
                sender: tenant._id,
                type: "booking_created",
                message: `New booking request for ${property.title} by ${tenant.name}`,
                relatedId: booking._id,
                onModel: "Booking",
            });
            console.log("Created Notification for Landlord");
        } else {
            console.log("Booking already exists");
        }

        console.log("\n--- DEMO SETUP COMPLETE ---");
        console.log("Login as Landlord:");
        console.log("Email: landlord@demo.com");
        console.log("Password: password123");
        console.log("---------------------------");

        process.exit();
    } catch (error) {
        console.error("Error creating demo data:", error);
        process.exit(1);
    }
};

createDemoData();
