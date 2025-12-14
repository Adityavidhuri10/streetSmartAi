const asyncHandler = require("express-async-handler");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const Property = require("../models/propertyModel");

const logFile = path.join(__dirname, "../backend_debug.log");
const log = (msg) => {
  fs.appendFileSync(logFile, new Date().toISOString() + ": " + msg + "\n");
};

// @desc    Scrape properties from 99acres and MagicBricks
// @route   POST /api/scrape
// @access  Public
const scrapeProperties = asyncHandler(async (req, res) => {
  const { keyword, force } = req.body;
  log(`scrapeProperties called with keyword=${keyword}, force=${force}`);

  if (!keyword) {
    res.status(400);
    throw new Error("Please provide a search keyword");
  }

  // 1. CACHE CHECK: Check if we already have properties for this city
  if (!force) {
    const cacheCheck = await Property.find({
      $or: [
        { city: { $regex: keyword, $options: "i" } },
        { address: { $regex: keyword, $options: "i" } }
      ]
    });

    if (cacheCheck.length > 0) {
      console.log(`Returning ${cacheCheck.length} cached properties for: ${keyword}`);
      return res.json({
        message: `Found ${cacheCheck.length} cached properties.`,
        properties: cacheCheck,
        cached: true
      });
    }
  } else {
    // Force refresh: Delete old scraped data for this keyword
    await Property.deleteMany({
      $or: [
        { city: { $regex: keyword, $options: "i" } },
        { address: { $regex: keyword, $options: "i" } }
      ],
      isScraped: true
    });
    console.log(`Force refresh: Deleted old scraped properties for ${keyword}`);
  }

  console.log(`Starting scrape for: ${keyword}`);

  const scrapperDir = path.join(__dirname, "../../Scrapper");
  const dataDir = path.join(scrapperDir, "scraped_data/properties");

  // CLEANUP: If force refresh, clear old JSON files first to avoid importing stale data
  /*
  if (force && fs.existsSync(dataDir)) {
    try {
      const existingFiles = fs.readdirSync(dataDir);
      for (const file of existingFiles) {
        if (file.endsWith(".json")) {
          fs.unlinkSync(path.join(dataDir, file));
        }
      }
      console.log("Cleaned up old scraped JSON files.");
    } catch (err) {
      console.error("Error cleaning up old files:", err);
    }
  }
  */

  const script99 = path.join(scrapperDir, "99Acers.py");
  const scriptMB = path.join(scrapperDir, "Magic_bricks.py");

  // Helper to run python script
  const runScript = (scriptPath, arg) => {
    return new Promise((resolve, reject) => {
      exec(`python3 "${scriptPath}" "${arg}"`, { cwd: scrapperDir }, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing ${scriptPath}:`, error);
          resolve(null);
        } else {
          console.log(`Output from ${scriptPath}:\n`, stdout);
          resolve(stdout);
        }
      });
    });
  };

  // 2. SCRAPING (ENABLED)
  // const script99 = path.join(scrapperDir, "99Acers.py"); // Already defined above
  // const scriptMB = path.join(scrapperDir, "Magic_bricks.py"); // Already defined above

  console.log(`Triggering scrapers for keyword: ${keyword}`);

  try {
    await Promise.all([
      // runScript(script99, keyword), // Disabled as per user request
      runScript(scriptMB, keyword)
    ]);
  } catch (err) {
    console.error("Error running scrapers:", err);
  }

  console.log("Scraping finished, importing data...");

  // Read scraped JSON files
  // dataDir is already defined above
  console.log("Reading data from:", dataDir);
  if (!fs.existsSync(dataDir)) {
    // If directory doesn't exist, maybe scrapers failed or didn't find anything
    // But we should try to read what we have
    console.log("Data directory not found, creating it...");
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // We need to read from both directories potentially, or just the main one if scrapers output there
  // 99Acers outputs to `scraped_data`, MagicBricks to `scraped_data/properties`
  // Let's check both
  const dirsToCheck = [
    path.join(scrapperDir, "scraped_data"),
    path.join(scrapperDir, "scraped_data/properties")
  ];

  const scrapedProperties = [];
  const seenProperties = new Set();
  const { normalizeProperty } = require("../utils/propertyNormalizer");

  const FIVE_MINUTES_AGO = Date.now() - 5 * 60 * 1000;

  for (const dir of dirsToCheck) {
    if (!fs.existsSync(dir)) continue;

    const files = fs.readdirSync(dir);
    for (const file of files) {
      if (path.extname(file) === ".json" && file !== "index.json" && file !== "properties_index.json") {
        const filePath = path.join(dir, file);

        // CHECK: Only process files modified recently (in this scrape session)
        const stats = fs.statSync(filePath);
        if (stats.mtimeMs < FIVE_MINUTES_AGO) {
          continue;
        }

        try {
          const rawData = JSON.parse(fs.readFileSync(filePath, "utf-8"));

          // Use the smart normalizer
          const propertyData = normalizeProperty(rawData, "scraper");

          // Add the keyword to the property data so we can find it later
          propertyData.keywords = [keyword];

          // Deduplication check
          const uniqueKey = `${propertyData.title}-${propertyData.address}-${propertyData.price}`;

          if (seenProperties.has(uniqueKey)) {
            continue;
          }
          seenProperties.add(uniqueKey);

          scrapedProperties.push(propertyData);
        } catch (err) {
          console.error(`Error parsing file ${file}:`, err);
        }
      }
    }
  }

  // 2. SAVE TO DB (Cache for next time)
  if (scrapedProperties.length > 0) {
    // We might want to update existing properties with the new keyword if they already exist
    // But for simplicity, we'll just insert new ones or ignore duplicates (handled by unique constraints if any)
    // Mongoose insertMany with ordered: false continues on error (duplicate key)
    try {
      await Property.insertMany(scrapedProperties, { ordered: false });
    } catch (e) {
      // Ignore duplicate key errors
      console.log("Some properties were duplicates and skipped.");
    }
    console.log(`Saved ${scrapedProperties.length} scraped properties to DB.`);
  }

  // Fetch the fresh data from DB to return (including ID)
  const freshData = await Property.find({
    $or: [
      { city: { $regex: keyword, $options: "i" } },
      { address: { $regex: keyword, $options: "i" } },
      { title: { $regex: keyword, $options: "i" } }
    ]
  });

  res.json({
    message: `Scraping completed. Found ${freshData.length} properties.`,
    properties: freshData,
    cached: false
  });
});

// Helper to parse price string to number
function parsePrice(priceStr) {
  if (!priceStr) return 0;
  // Remove non-numeric characters except dots
  const cleanStr = priceStr.replace(/[^\d.]/g, "");
  const num = parseFloat(cleanStr);

  // Handle Lakhs/Crores if present in string (simple heuristic)
  if (priceStr.toLowerCase().includes("cr")) return num * 10000000;
  if (priceStr.toLowerCase().includes("lac") || priceStr.toLowerCase().includes("lakh")) return num * 100000;

  return num || 0;
}

// @desc    Scrape a specific property URL
// @route   POST /api/scrape/url
// @access  Public
const scrapeUrl = asyncHandler(async (req, res) => {
  const { url } = req.body;
  log(`scrapeUrl called with url=${url}`);

  if (!url) {
    res.status(400);
    throw new Error("Please provide a URL");
  }

  const scrapperDir = path.join(__dirname, "../../Scrapper");
  const scriptMB = path.join(scrapperDir, "Magic_bricks.py");

  console.log(`Triggering scraper for URL: ${url}`);

  // Run python script with --url argument
  const runScript = (scriptPath, urlArg) => {
    return new Promise((resolve, reject) => {
      exec(`python3 "${scriptPath}" --url "${urlArg}"`, { cwd: scrapperDir }, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing ${scriptPath}:`, error);
          // Don't reject, just resolve null so we can return what we have
          resolve(null);
        } else {
          console.log(`Output from ${scriptPath}:\n`, stdout);
          resolve(stdout);
        }
      });
    });
  };

  await runScript(scriptMB, url);

  console.log("URL Scraping finished, importing data...");

  // Import the scraped data (similar logic to scrapeProperties)
  const dataDir = path.join(scrapperDir, "scraped_data/properties");
  const { normalizeProperty } = require("../utils/propertyNormalizer");

  // Extract ID from URL to find the specific file
  let propId = "";
  const match = url.match(/id=([0-9a-zA-Z]+)/);
  if (match) {
    propId = match[1];
  } else {
    // Fallback
    const parts = url.split("-");
    const lastPart = parts[parts.length - 1];
    if (lastPart.includes("&")) {
      propId = lastPart.split("&")[0];
    } else {
      propId = lastPart;
    }
  }

  const filePath = path.join(dataDir, `${propId}.json`);

  if (fs.existsSync(filePath)) {
    try {
      const rawData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      const propertyData = normalizeProperty(rawData, "scraper");

      // Save to DB
      try {
        // Upsert
        await Property.findOneAndUpdate(
          { url: propertyData.url },
          propertyData,
          { upsert: true, new: true }
        );
        console.log("Saved scraped URL property to DB.");
      } catch (e) {
        console.error("Error saving to DB:", e);
      }

      return res.json({
        message: "Property scraped successfully",
        property: propertyData
      });

    } catch (err) {
      console.error("Error reading scraped file:", err);
      res.status(500);
      throw new Error("Failed to process scraped data");
    }
  } else {
    res.status(404);
    throw new Error("Scraping failed or file not found");
  }
});

module.exports = { scrapeProperties, scrapeUrl };
