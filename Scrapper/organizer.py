import os
import json
import shutil
from datetime import datetime

# Use absolute paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "scraped_data")
PROPERTIES_DIR = os.path.join(DATA_DIR, "properties")
IMAGES_DIR = os.path.join(DATA_DIR, "images")
INDEX_FILE = os.path.join(DATA_DIR, "index.json")

os.makedirs(PROPERTIES_DIR, exist_ok=True)
os.makedirs(IMAGES_DIR, exist_ok=True)

def clean_images(local_images):
    """Filter out likely icons or invalid images based on size or name."""
    cleaned = []
    for img_path in local_images:
        # Resolve absolute path
        if os.path.isabs(img_path):
            full_path = img_path
        else:
            # Try relative to BASE_DIR first
            full_path = os.path.join(BASE_DIR, img_path)
            if not os.path.exists(full_path):
                # Try relative to DATA_DIR
                full_path = os.path.join(DATA_DIR, img_path)

        if not os.path.exists(full_path):
            continue
            
        filename = os.path.basename(img_path).lower()
        
        # Strict filter for component images
        blocklist = [
            "logo", "icon", "blueheart", "shortlist", "videocam", "mute", 
            "fullscreen", "time2", "landmarkgroup", "nearme", "voicesearch", 
            "projectnoimage", "loader", "spinner", "arrow", "star", "rating",
            "whatsapp", "facebook", "twitter", "share", "email", "call",
            "dealer", "request-photo", "img_not_avail"
        ]
        
        if any(x in filename for x in blocklist):
            continue
            
        # Filter by size (skip very small images < 10KB to be safe against icons)
        try:
            if os.path.getsize(full_path) < 10240:  # 10KB
                continue
        except:
            pass
            
        # Normalize path to be relative to scraped_data for portable JSON
        rel_path = os.path.relpath(full_path, DATA_DIR)
        cleaned.append(os.path.join("scraped_data", rel_path))
        
    return cleaned

def normalize_property(data, filename):
    """Normalize property data structure with advanced parsing for searchability."""
    
    prop_id = data.get("id") or data.get("property_id")
    
    # Determine source based on ID format
    import re
    if re.match(r"^[A-Z]\d+$", str(prop_id)):
        source = "99Acers"
    elif len(str(prop_id)) > 15:
        source = "MagicBricks"
    else:
        source = "Unknown"

    # --- 1. Title & Basic Info Extraction ---
    title = data.get("title") or data.get("property_name")
    
    # Fallback title generation
    if not title or title == "Unknown Property":
        if source == "99Acers":
            society_list = data.get("features", {}).get("society", [])
            society = society_list[0] if society_list else "Greater Noida"
            title = f"Property for Rent in {society}"
        else:
            title = "Property for Rent in Greater Noida"

    # --- 2. Parse Details (BHK, Type, Area, Price) ---
    details = data.get("details") or data.get("basic_details", {})
    if not details:
        details = {}

    # Extract BHK - prioritize scraped value
    bhk = data.get("bhk")  # Direct field from 99Acers
    if not bhk:
        bhk = details.get("bedrooms")
    if not bhk:
        # Try title
        bhk_match = re.search(r"(\d+)\s*BHK", title, re.IGNORECASE)
        if bhk_match:
            bhk = int(bhk_match.group(1))
        # Try URL for MagicBricks
        elif source == "MagicBricks":
            url = data.get("url") or data.get("link", "")
            bhk_match = re.search(r"(\d+)-BHK", url, re.IGNORECASE)
            if bhk_match:
                bhk = int(bhk_match.group(1))
        # Try features
        elif "features" in data:
            for f in data["features"].get("property", []):
                if "Bedroom" in f:
                    m = re.search(r"(\d+)", f)
                    if m: bhk = int(m.group(1))

    # Extract Property Type (Rent/Sale)
    prop_type = "Rent" 
    if re.search(r"(Rent|Lease)", title, re.IGNORECASE):
        prop_type = "Rent"
    elif re.search(r"(Sale|Buy)", title, re.IGNORECASE):
        prop_type = "Sale"
    
    # Extract Area
    area = details.get("area") or details.get("super_builtup_area") or details.get("carpet_area")
    if not area:
        area_match = re.search(r"(\d+)\s*(Sq-ft|sqft|sq ft)", title, re.IGNORECASE)
        if area_match:
            area = f"{area_match.group(1)} Sq-ft"

    # Extract Price - prioritize scraped value
    price = data.get("price")  # Direct field from 99Acers
    if not price:
        price = details.get("price") or details.get("rent")

    # --- 3. Location Parsing ---
    # Prioritize scraped locality and address
    locality = data.get("locality")
    address = data.get("address")
    city = "Greater Noida"

    if not locality or locality == "Unknown":
        # Fallback to title parsing
        loc_match = re.search(r"in\s+([^,]+),\s*([^,]+)$", title)
        if loc_match:
            locality = loc_match.group(1).strip()
            city_candidate = loc_match.group(2).strip()
            if "Noida" in city_candidate:
                city = city_candidate
        else:
            society_list = data.get("features", {}).get("society", [])
            if society_list:
                locality = society_list[0]
            else:
                nearby = data.get("nearby_places") or data.get("location", [])
                if isinstance(nearby, list) and nearby:
                    locality = nearby[0]
    
    if not address:
        if locality and locality != "Unknown":
            address = f"{locality}, {city}"
        else:
            address = city

    # --- 4. Generate Keywords ---
    keywords = []
    if bhk: keywords.append(f"{bhk} BHK")
    keywords.append(prop_type)
    keywords.append(city)
    if locality and locality != "Unknown": keywords.append(locality)
    if area: keywords.append(area)
    
    features = data.get("features", {})
    if isinstance(features, dict):
        for cat in features:
            keywords.extend(features[cat][:5])
    
    keywords = list(set([str(k).strip() for k in keywords if k]))

    # --- 5. Construct Final Normalized Object ---
    local_images = data.get("images") if "images" in data and isinstance(data["images"], list) and data["images"] and "scraped_data" in data["images"][0] else data.get("local_images", [])
    cleaned_images = clean_images(local_images)

    normalized = {
        "id": prop_id,
        "source": source,
        "title": title,
        "type": prop_type,
        "bhk": bhk,
        "price": price,
        "area": area,
        "location": {
            "address": address,
            "city": city,
            "locality": locality
        },
        "url": data.get("url") or data.get("link"),
        "images": cleaned_images,
        "features": features,
        "keywords": keywords,
        "scraped_at": data.get("scraped_at")
    }
    
    return normalized

def main():
    all_properties = []
    
    # 1. Identify all JSON files in scraped_data and scraped_data/properties
    files_to_process = []
    
    # Check root scraped_data
    for f in os.listdir(DATA_DIR):
        if f.endswith(".json") and f not in ["index.json", "properties_index.json"]:
            files_to_process.append(os.path.join(DATA_DIR, f))
            
    # Check properties dir
    for f in os.listdir(PROPERTIES_DIR):
        if f.endswith(".json"):
            files_to_process.append(os.path.join(PROPERTIES_DIR, f))
            
    print(f"🔍 Found {len(files_to_process)} files to process")

    for path in files_to_process:
        try:
            with open(path, "r") as file:
                data = json.load(file)
        except:
            print(f"⚠ Skipping invalid JSON: {path}")
            continue
            
        filename = os.path.basename(path)
        normalized = normalize_property(data, filename)
        
        # Always save to properties/ dir
        target_path = os.path.join(PROPERTIES_DIR, filename)
        
        with open(target_path, "w") as file:
            json.dump(normalized, file, indent=4)
            
        # If file was in root, remove it (since we moved/saved it to properties)
        if os.path.dirname(path) == DATA_DIR:
            os.remove(path)
            
        all_properties.append({
            "id": normalized["id"],
            "title": normalized["title"],
            "source": normalized["source"],
            "type": normalized["type"],
            "bhk": normalized["bhk"],
            "location": normalized["location"],
            "file_path": f"scraped_data/properties/{filename}",
            "image_count": len(normalized["images"])
        })
        print(f"✅ Processed {filename}")

    # 3. Update Index
    with open(INDEX_FILE, "w") as f:
        json.dump(all_properties, f, indent=4)
    
    print(f"🎉 Organization complete. Indexed {len(all_properties)} properties.")

if __name__ == "__main__":
    main()
