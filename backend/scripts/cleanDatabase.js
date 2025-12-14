const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Property = require('../models/propertyModel');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const cleanDescription = (text) => {
    if (!text) return "No description available";
    let cleaned = text.toString();

    // Remove MagicBricks footer junk
    const junkMarkers = [
        "Flats near Sector",
        "Popular Localities",
        "Property Options",
        "Quick Area Conversions",
        "State specific Area Units",
        "Links",
        "Company",
        "Our Partners",
        "CONTACT US",
        "Read more",
        "Flats for rent in"
    ];

    for (const marker of junkMarkers) {
        const index = cleaned.indexOf(marker);
        if (index !== -1) {
            cleaned = cleaned.substring(0, index);
        }
    }

    return cleaned.trim().replace(/\s+/g, " ") || "No description available";
};

const cleanDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const properties = await Property.find({});
        console.log(`Found ${properties.length} properties to check.`);

        let updatedCount = 0;

        for (const prop of properties) {
            const originalDesc = prop.description;
            const cleanedDesc = cleanDescription(originalDesc);

            if (originalDesc !== cleanedDesc) {
                prop.description = cleanedDesc;
                await prop.save();
                updatedCount++;
                console.log(`Cleaned property: ${prop.title}`);
            }
        }

        console.log(`\nDatabase cleanup complete.`);
        console.log(`Updated ${updatedCount} properties.`);

        process.exit(0);
    } catch (error) {
        console.error('Error cleaning database:', error);
        process.exit(1);
    }
};

cleanDatabase();
