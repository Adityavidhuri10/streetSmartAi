const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const Property = require("./models/propertyModel");

dotenv.config();

const importData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected");

        // Clear existing scraped data to avoid duplicates
        console.log("Clearing existing scraped data...");
        await Property.deleteMany({ isScraped: true });
        console.log("Cleared.");

        const dataDir = path.join(__dirname, "../Scrapper/scraped_data");
        if (!fs.existsSync(dataDir)) {
            console.log("No data directory found.");
            process.exit();
        }

        const files = fs.readdirSync(dataDir);
        console.log(`Found ${files.length} files.`);

        let count = 0;
        for (const file of files) {
            if (path.extname(file) === ".json") {
                const filePath = path.join(dataDir, file);
                try {
                    const rawData = JSON.parse(fs.readFileSync(filePath, "utf-8"));

                    // Use the smart normalizer
                    const { normalizeProperty } = require("./utils/propertyNormalizer");
                    const propertyData = normalizeProperty(rawData, "import_script");

                    // Skip if no images or no valid title (if it's just the default fallback)
                    if (propertyData.images.length === 0 || !propertyData.title) {
                        console.log(`Skipping ${file}: Missing images or title.`);
                        continue;
                    }

                    await Property.create(propertyData);
                    count++;
                } catch (err) {
                    console.error(`Error importing ${file}:`, err.message);
                }
            }
        }

        console.log(`Imported ${count} properties successfully!`);
        process.exit();
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

importData();
