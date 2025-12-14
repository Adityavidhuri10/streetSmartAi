const path = require("path");

/**
 * Smart Property Data Normalizer
 * Converts raw scraped data (from various sources) into a unified, structured format
 * matching the Mongoose Property Model.
 */

const normalizeProperty = (rawData, source = "unknown") => {
    // 1. Initialize Default Structure
    const normalized = {
        title: "",
        description: "",
        price: 0,
        address: "",
        city: "",
        state: "Unknown",
        country: "India",
        features: [],
        images: [],
        isScraped: true,
        bhk: null,
        area: null,
        dynamic_facts: {},
        source: source,
    };

    // --- Helper Functions ---

    // Price Parser
    const parsePrice = (priceStr) => {
        if (!priceStr) return 0;
        if (typeof priceStr === "number") return priceStr;

        const cleanStr = priceStr.toString().replace(/[^\d.]/g, "");
        const num = parseFloat(cleanStr);

        if (isNaN(num)) return 0;

        const lowerPrice = priceStr.toString().toLowerCase();
        if (lowerPrice.includes("cr") || lowerPrice.includes("crore")) return num * 10000000;
        if (lowerPrice.includes("lac") || lowerPrice.includes("lakh")) return num * 100000;
        if (lowerPrice.includes("k")) return num * 1000;

        return num;
    };

    // Text Cleaner
    const cleanText = (text) => {
        if (!text) return "";
        return text.toString().trim().replace(/\s+/g, " ");
    };

    // --- Extraction Logic ---

    // Description Cleaner
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

    // --- Extraction Logic ---

    // 1. Basic Fields
    normalized.description = cleanDescription(rawData.description);
    normalized.price = parsePrice(rawData.price);
    normalized.dynamic_facts = rawData.dynamic_facts || {};

    // 2. Smart BHK Extraction
    // Priority: rawData.bhk -> Regex in Title -> Regex in Description
    let bhk = rawData.bhk;
    const combinedText = (rawData.property_name || "") + " " + (rawData.description || "");

    if (!bhk || bhk.trim() === "") {
        const bhkMatch = combinedText.match(/(\d+)\s*(BHK|Bedroom|RK)/i);
        if (bhkMatch) {
            bhk = `${bhkMatch[1]} ${bhkMatch[2].toUpperCase()}`;
        }
    }
    normalized.bhk = bhk ? cleanText(bhk) : "N/A";

    // 3. Smart Area Extraction
    // Priority: rawData.area -> Regex in Description
    let area = rawData.area;
    if (!area || area.length > 50 || !/\d/.test(area)) { // If missing or looks like garbage text
        const areaMatch = combinedText.match(/(\d+(?:,\d+)?)\s*(sqft|sq\.ft|sq ft|sq yards|gaj)/i);
        if (areaMatch) {
            area = `${areaMatch[1]} ${areaMatch[2]}`;
        } else {
            area = null;
        }
    }
    normalized.area = area ? cleanText(area) : "N/A";

    // 4. Address & City Inference
    let address = rawData.address || rawData.locality;
    if (!address && rawData.dynamic_facts && rawData.dynamic_facts["Address"]) {
        address = rawData.dynamic_facts["Address"];
    }
    normalized.address = cleanText(address) || "Unknown Location";

    // Infer City from Address
    let city = "Greater Noida"; // Default fallback
    const lowerAddr = normalized.address.toLowerCase();
    const lowerTitle = (rawData.property_name || "").toLowerCase();
    const fullText = (lowerAddr + " " + lowerTitle);

    if (fullText.includes("greater noida")) city = "Greater Noida";
    else if (fullText.includes("noida")) city = "Noida";
    else if (fullText.includes("delhi") || fullText.includes("new delhi")) city = "Delhi";
    else if (fullText.includes("gurgaon") || fullText.includes("gurugram")) city = "Gurgaon";
    else if (fullText.includes("ghaziabad")) city = "Ghaziabad";

    normalized.city = city;

    // --- Advanced Extraction (Society, Sector, Type, Baths) ---
    // Example: "4BHK 4Baths Flat/Apartment for Rent in ATS Rhapsody, Sector 1 Greater Noida"

    // 1. Parse Title for missing fields
    if (rawData.title) {
        const title = rawData.title;

        // Extract BHK if missing
        if (!normalized.bhk) {
            const bhkMatch = title.match(/(\d+)\s*BHK/i);
            if (bhkMatch) normalized.bhk = `${bhkMatch[1]} BHK`;
        }

        // Extract Society and Address if missing
        // Strategy: Split by " in " (case insensitive)
        const inSplit = title.split(/\s+in\s+/i);
        if (inSplit.length > 1) {
            // Right side usually contains "Society, Address"
            const locationPart = inSplit[inSplit.length - 1]; // Take the last part to be safe

            const commaIndex = locationPart.indexOf(',');
            if (commaIndex !== -1) {
                const potentialSociety = locationPart.substring(0, commaIndex).trim();
                const potentialAddress = locationPart.substring(commaIndex + 1).trim();

                if (!normalized.society || normalized.society === "N/A") {
                    normalized.society = potentialSociety;
                }
                if (!normalized.address || normalized.address === "N/A") {
                    normalized.address = potentialAddress;
                }
            } else {
                // No comma, assume whole thing is society if it's short, or address if it's long?
                // Or just assign to society if missing
                if (!normalized.society || normalized.society === "N/A") {
                    normalized.society = locationPart.trim();
                }
            }
        }
    }

    // Filter Junk from Dynamic Facts
    const junkKeys = [
        "Home Loans", "Real Estate Articles", "Latest News", "About Us",
        "Get HelpCustomer Services & FAQs", "Why you should consider this property?",
        "Key Highlightsof the property", "Key Highlights", "Average Rating",
        "Positives", "Negatives", "Quick Area Conversions", "State specific Area Units",
        "Links", "Company", "Our Partners", "CONTACT US",
        "1", "2", "3", "4", "5"
    ];

    const junkPatterns = [
        /^Flats near/, /^Popular Localities/, /^Property Options/,
        /.* nearby listings$/, /^About /, /^Reviews of/,
        /^Property Rates in/, /^Rent .* Flat in/
    ];

    if (normalized.dynamic_facts) {
        for (const key of Object.keys(normalized.dynamic_facts)) {
            let shouldRemove = false;

            if (junkKeys.includes(key)) shouldRemove = true;

            if (!shouldRemove) {
                for (const pattern of junkPatterns) {
                    if (pattern.test(key)) {
                        shouldRemove = true;
                        break;
                    }
                }
            }

            // Check for Reviewer Names (Owner | 4mo ago)
            if (!shouldRemove) {
                const value = normalized.dynamic_facts[key];
                if (typeof value === 'string' && (value.includes("Owner |") || value.includes("Agent |"))) {
                    shouldRemove = true;
                }
            }

            if (shouldRemove) {
                delete normalized.dynamic_facts[key];
            }
        }
    }

    // A. Society Name Extraction
    // Look for "in [Society Name]," or "at [Society Name]"
    let society = null;
    const societyMatch = combinedText.match(/(?:in|at)\s+([A-Za-z0-9\s]+)(?:,|$|Sector|Near)/i);
    if (societyMatch && societyMatch[1]) {
        const candidate = societyMatch[1].trim();
        // Filter out generic location words if they were captured by mistake
        if (!candidate.toLowerCase().includes("greater noida") && !candidate.toLowerCase().includes("noida")) {
            society = candidate;
        }
    }
    normalized.dynamic_facts["Society"] = society || "N/A";

    // B. Sector/Locality Extraction
    // Look for "Sector [Number]"
    let sector = null;
    const sectorMatch = combinedText.match(/Sector\s*(\d+[A-Za-z]?)/i);
    if (sectorMatch) {
        sector = `Sector ${sectorMatch[1]}`;
    }
    // If we found a sector, append it to address if not present
    if (sector && !normalized.address.includes(sector)) {
        normalized.address = `${sector}, ${normalized.address}`;
    }

    // C. Property Type Extraction
    let propertyType = "Apartment"; // Default
    if (combinedText.match(/Villa/i)) propertyType = "Villa";
    else if (combinedText.match(/Plot|Land/i)) propertyType = "Plot";
    else if (combinedText.match(/Floor/i)) propertyType = "Independent Floor";
    else if (combinedText.match(/Studio/i)) propertyType = "Studio";
    else if (combinedText.match(/Penthouse/i)) propertyType = "Penthouse";
    normalized.dynamic_facts["Property Type"] = propertyType;

    // D. Bathrooms Extraction
    let bathrooms = null;
    const bathMatch = combinedText.match(/(\d+)\s*(?:Bath|Bathroom|Washroom)/i);
    if (bathMatch) {
        bathrooms = bathMatch[1];
        normalized.dynamic_facts["Bathrooms"] = bathrooms;
    }

    // 5. Title Generation
    // If title is missing or generic, generate a better one
    let title = cleanText(rawData.property_name);

    // If the title is just the raw messy string, let's clean it up
    // e.g. "4BHK 4Baths Flat/Apartment for Rent in ATS Rhapsody..." -> "4 BHK Apartment in ATS Rhapsody, Sector 1"
    if (society || sector) {
        const type = propertyType || "Property";
        const bhkStr = normalized.bhk !== "N/A" ? normalized.bhk : "";
        const loc = society ? `${society}` : (sector ? `${sector}` : normalized.city);

        // Construct a clean title
        title = `${bhkStr} ${type} in ${loc}`;
        if (sector && society) title += `, ${sector}`;
    } else if (!title || title.length < 5) {
        title = `${normalized.bhk !== "N/A" ? normalized.bhk : "Property"} for Sale in ${normalized.city}`;
    }
    normalized.title = title;

    // 6. Features Normalization
    if (Array.isArray(rawData.features)) {
        normalized.features = rawData.features;
    } else if (rawData.features && typeof rawData.features === 'object') {
        // Handle nested structure from some scrapers { property: [], society: [] }
        if (Array.isArray(rawData.features.property)) {
            normalized.features = rawData.features.property;
        }
        // Save society features to dynamic_facts for display
        if (Array.isArray(rawData.features.society) && rawData.features.society.length > 0) {
            normalized.dynamic_facts["Project Amenities"] = rawData.features.society.join(", ");
        }
    } else {
        normalized.features = [];
    }

    // 7. Image Filtering & Normalization
    let images = rawData.image_urls || [];

    // If local images are provided (from file system scrape), prefer them or merge?
    // For now, we assume image_urls contains the usable paths (web or local)
    if (rawData.local_images && rawData.local_images.length > 0) {
        // Logic to convert local paths if needed, or just append
        // This depends on how the scraper saves them. 
        // Assuming image_urls is the primary source for the frontend.
    }

    // Filter Junk Images
    const junkKeywords = [
        "nnares_logo", "nearMe", "mic", "VoiceSearch", "BlueHeart",
        "Shortlisted", "muteIcon", "landmarkGroup", "dealer",
        "projectnoimage", "Shortlist", "request-photo", "videoCam",
        "loader", "icon", "logo", "placeholder", "pixel"
    ];

    normalized.images = images.filter(img => {
        if (!img) return false;
        const lowerImg = img.toLowerCase();

        // Check extensions
        const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
        const hasValidExt = validExtensions.some(ext => lowerImg.includes(ext));
        if (!hasValidExt && !lowerImg.startsWith("http")) return false; // Allow URLs without obvious ext if needed, but risky

        // Check junk keywords
        if (junkKeywords.some(keyword => lowerImg.includes(keyword.toLowerCase()))) return false;

        return true;
    });

    return normalized;
};

module.exports = { normalizeProperty };
