from playwright.sync_api import sync_playwright
import json
import time
import os
import requests
from bs4 import BeautifulSoup
from datetime import datetime
from urllib.parse import urlparse, quote
import sys
import re

START_URL = "https://www.magicbricks.com/property-for-rent/residential-real-estate?bedroom=&proptype=Multistorey-Apartment,Builder-Floor-Apartment,Penthouse,Studio-Apartment,Service-Apartment&cityName=Greater-Noida"

INDEX_FILE = "scraped_data/index.json"
DATA_DIR = "scraped_data/properties"
IMAGES_DIR = "scraped_data/images"

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(IMAGES_DIR, exist_ok=True)

# -------------- Utility ---------------- #
def safe(page, selector):
    try:
        # Use a short timeout so we don't wait forever for missing elements
        return page.locator(selector).first.inner_text(timeout=2000).strip()
    except:
        return None

def extract_reviews(page):
    reviews = []
    try:
        review_cards = page.locator("div.mb-review__ReviewCard").all()
        for r in review_cards:
            text = r.inner_text().strip()
            rating = r.locator("span.mb-review__Rating").inner_text().replace("★", "").strip()
            reviews.append({"text": text, "rating": rating})
    except:
        pass
    return reviews

def extract_features(page):
    property_features = []
    society_features = []

    try:
        prop_items = page.locator("ul.mb-pd__amenitiesList li").all()
        for item in prop_items:
            property_features.append(item.inner_text().strip())
    except:
        pass

    try:
        soc_items = page.locator("ul.mb-pd__societyAmenityList li").all()
        for item in soc_items:
            society_features.append(item.inner_text().strip())
    except:
        pass

    return property_features, society_features

def extract_nearby(page):
    nearby = []
    try:
        items = page.locator("ul.mb-pd__nearbyList li").all()
        for item in items:
            nearby.append(item.inner_text().strip())
    except:
        pass
    return nearby

def extract_basic_details(page):
    details = {
        "configuration": safe(page, "span#pdConfig"),
        "rent": safe(page, "#pdPrice2"),
        "super_builtup_area": safe(page, "#superbuiltupArea_span"),
        "carpet_area": safe(page, "#carpetArea_span"),
        "furnishing": safe(page, "#furnishingLabel"),
        "available_for": safe(page, "#availableForLabel"),
        "available_from": safe(page, "div.component__availableFrom"),
        "posted_by": safe(page, "#postedOnAndByLabel")
    }
    
    # Extract price if not found in rent field
    if not details["rent"]:
        price_elem = safe(page, "span.mb-pd__price")
        if price_elem:
            details["rent"] = price_elem
    
    return details

def extract_locality_address(page):
    """Extract locality and full address from page."""
    locality = None
    address = None
    
    # Try to get locality from breadcrumb or location section
    try:
        locality_elem = page.locator("span.mb-pd__loc__name").first
        if locality_elem:
            locality = locality_elem.inner_text(timeout=2000).strip()
    except:
        pass
    
    # Try to get full address
    try:
        address_elem = page.locator("span.mb-pd__dtls__address").first
        if address_elem:
            address = address_elem.inner_text(timeout=2000).strip()
    except:
        pass
    
    return locality, address

def download_image(url, folder):
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            # Extract filename from URL or generate one
            parsed = urlparse(url)
            filename = os.path.basename(parsed.path)
            if not filename or "." not in filename:
                filename = f"image_{int(time.time()*1000)}.jpg"
            
            file_path = os.path.join(folder, filename)
            with open(file_path, "wb") as f:
                f.write(response.content)
            return file_path
    except Exception as e:
        print(f"Error downloading {url}: {e}")
    return None

def extract_json_ld(soup):
    data_list = []
    scripts = soup.find_all("script", type="application/ld+json")
    for script in scripts:
        try:
            data = json.loads(script.string)
            data_list.append(data)
        except:
            pass
    return data_list

def extract_meta_tags(soup):
    meta_data = {}
    metas = soup.find_all("meta")
    for meta in metas:
        name = meta.get("name") or meta.get("property")
        content = meta.get("content")
        if name and content:
            meta_data[name] = content
    return meta_data

def extract_dynamic_facts(soup):
    facts = {}
    # MagicBricks often uses specific structures for facts
    # Look for label-value pairs in various containers
    
    # Strategy: Find elements with class containing 'label' or 'title'
    labels = soup.find_all(["div", "span"], class_=lambda x: x and ("label" in x.lower() or "title" in x.lower()))
    for label in labels:
        key = label.get_text(strip=True)
        if not key or len(key) > 50: continue
        
        value = None
        sibling = label.find_next_sibling()
        if sibling:
            value = sibling.get_text(strip=True)
            
        if key and value:
            facts[key] = value
            
    return facts

# -------------- Main Scraper ---------------- #
def scrape_single_property(page):
    link = page.url
    print(f"   Scraping property: {link}")
    
    # Extract ID from URL parameter 'id'
    match = re.search(r"id=([0-9a-zA-Z]+)", link)
    if match:
        prop_id = match.group(1)
    else:
        # Fallback to old method but be careful
        prop_id = link.split("-")[-1]
        if "&" in prop_id:
            prop_id = prop_id.split("&")[0]
        
    file_path = f"{DATA_DIR}/{prop_id}.json"
    
    # Create media directory for this property
    prop_images_dir = os.path.join(IMAGES_DIR, prop_id)
    os.makedirs(prop_images_dir, exist_ok=True)

    print("   Extracting images...")
    image_urls = []
    
    # Get all images
    try:
        all_imgs = page.locator("img").all()
        for img in all_imgs:
            src = img.get_attribute("src") or img.get_attribute("data-src")
            if src and src.startswith("http"):
                if any(x in src.lower() for x in [".jpg", ".jpeg", ".png", ".webp", "img", "photo"]):
                    if not any(x in src.lower() for x in ["icon", "logo", "svg", "button"]):
                        image_urls.append(src)
        
        image_urls = list(set(image_urls))
        
        # Download images
        local_images = []
        for img_url in image_urls:
            local_path = download_image(img_url, prop_images_dir)
            if local_path:
                local_images.append(local_path)
    except Exception as e:
        print(f"Error extracting images: {e}")
        local_images = []
        image_urls = []

    # --- Advanced Interaction Strategy ---
    try:
        page.click("a[href='#more-details']", timeout=2000)
        time.sleep(1)
    except:
        pass

    try:
        page.click("text=View all details", timeout=2000)
        time.sleep(1)
    except:
        pass

    # Parse content
    content = page.content()
    soup = BeautifulSoup(content, "html.parser")
    full_text = soup.get_text(" ", strip=True)
    
    meta_data = extract_meta_tags(soup)
    structured_data = extract_json_ld(soup)
    dynamic_facts = extract_dynamic_facts(soup)
    basic_details = extract_basic_details(page)
    
    # Specific Society Extraction
    society_name = safe(page, "a.mb-ldp__about-proj__projname")
    if society_name:
        dynamic_facts["Society"] = society_name

    # Specific Description Extraction
    description = safe(page, "div.mb-ldp__more-dtl__description--content")
    if not description:
            description = meta_data.get("description")

    # Extract locality and address
    locality, address = extract_locality_address(page)
    
    # Extract features
    prop_features, society_features = extract_features(page)
    
    # Extract nearby places
    nearby = extract_nearby(page)
    
    # --- Robust Regex Extraction ---
    regex_facts = [
        {"label": "Super Area", "regex": r"Super Area[:\s]*([\d,]+\s*sq\.?ft\.?)", "type": "area"},
        {"label": "Carpet Area", "regex": r"Carpet Area[:\s]*([\d,]+\s*sq\.?ft\.?)", "type": "area"},
        {"label": "Floor", "regex": r"Floor[:\s]*([0-9A-Za-z\s]+)(?:out of|$)", "type": "fact"},
        {"label": "Transaction Type", "regex": r"Transaction Type[:\s]*([A-Za-z\s]+)", "type": "fact"},
        {"label": "Status", "regex": r"Status[:\s]*([A-Za-z\s]+)", "type": "fact"},
        {"label": "Facing", "regex": r"Facing[:\s]*([A-Za-z\s]+)", "type": "fact"},
        {"label": "Society", "regex": r"(?:in|at)\s+([A-Za-z0-9\s]+(?:Apartments|Heights|Enclave|Residency|Tower|City|Park|Villas))", "type": "society"},
        {"label": "Bathrooms", "regex": r"(\d+)\s*Bath(?:room)?s?", "type": "fact"},
        {"label": "Balcony", "regex": r"(\d+)\s*Balcon(?:y|ies)", "type": "fact"},
        {"label": "Furnishing", "regex": r"Furnishing[:\s]*([A-Za-z\s]+)", "type": "fact"},
    ]

    for pattern in regex_facts:
        match = re.search(pattern["regex"], full_text, re.IGNORECASE)
        if match:
            val = match.group(1).strip()
            if pattern["label"] not in dynamic_facts:
                dynamic_facts[pattern["label"]] = val
    
    # --- Fallback Logic for Core Fields ---
    price = basic_details.get("rent")
    if not price:
        price_match = re.search(r"₹\s*([\d,]+\s*(?:Cr|Lac|Lakh|Crore)?)", full_text, re.IGNORECASE)
        if price_match:
            price = price_match.group(1)
    
    area = basic_details.get("super_builtup_area") or basic_details.get("carpet_area")
    if not area:
        if "Super Area" in dynamic_facts: area = dynamic_facts["Super Area"]
        elif "Carpet Area" in dynamic_facts: area = dynamic_facts["Carpet Area"]
    
    bhk = basic_details.get("configuration")
    if not bhk:
        title = safe(page, "h1.mb-pd__title") or ""
        if "BHK" in title:
            match = re.search(r"(\d+)\s*BHK", title, re.IGNORECASE)
            if match:
                bhk = match.group(1) + " BHK"
        
        if not bhk:
            match = re.search(r"(\d+)\s*BHK", full_text, re.IGNORECASE)
            if match:
                bhk = match.group(1) + " BHK"

    # Build property data
    property_data = {
        "property_id": prop_id,
        "property_name": safe(page, "h1.mb-pd__title") or meta_data.get("og:title"),
        "url": link,
        "bhk": bhk,
        "price": price,
        "locality": locality,
        "address": address,
        "image_urls": image_urls,
        "local_images": local_images,
        "youtube_video": None,
        "basic_details": basic_details,
        "features": {"property": prop_features, "society": society_features},
        "nearby_places": nearby,
        "reviews": [],
        "scraped_at": datetime.now().isoformat(),
        "meta_data": meta_data,
        "structured_data": structured_data,
        "dynamic_facts": dynamic_facts,
        "description": description,
        "area": area
    }

    # Save json file
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(property_data, f, indent=4, ensure_ascii=False)

    print(f"✅ Saved → {file_path}")


def scrape():
    keyword = "Greater Noida"
    if len(sys.argv) > 1:
        keyword = sys.argv[1]
    
    print(f"🔍 Searching for: {keyword}")
    
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()
        
        # --- STRATEGY 1: Direct URL Navigation ---
        # Construct a URL that searches for the city directly
        # MagicBricks URL format: ...&cityName=Name
        encoded_keyword = quote(keyword)
        direct_url = f"https://www.magicbricks.com/property-for-rent/residential-real-estate?bedroom=&proptype=Multistorey-Apartment,Builder-Floor-Apartment,Penthouse,Studio-Apartment,Service-Apartment&cityName={encoded_keyword}"
        
        print(f"   Attempting direct navigation to: {direct_url}")
        try:
            page.goto(direct_url, timeout=30000)
            time.sleep(2)
            
            # Check if we landed on a valid results page
            # If the keyword was invalid, MB might redirect to home or show no results
            if "cityName=" in page.url or "property-for-rent" in page.url:
                print("   ✅ Direct navigation successful.")
            else:
                raise Exception("Direct navigation redirected to unexpected page.")
                
        except Exception as e:
            print(f"   ⚠ Direct navigation failed/redirected: {e}")
            print("   Falling back to Search Bar interaction...")
            
            # --- STRATEGY 2: Search Bar Interaction ---
            try:
                page.goto("https://www.magicbricks.com/property-for-rent/residential-real-estate?cityName=Noida", timeout=30000)
                
                # Handle potential popups
                try:
                    page.click("text=Ok, understood", timeout=3000)
                except:
                    pass

                print(f"   Typing '{keyword}' into search bar...")
                # Wait for input to be visible
                # Try multiple selectors for the search bar
                search_selectors = ["input.auto-suggest__input", "input#keyword", "input[placeholder*='Enter City']"]
                
                search_input = None
                for sel in search_selectors:
                    try:
                        if page.is_visible(sel):
                            search_input = sel
                            break
                    except:
                        pass
                
                if not search_input:
                    # If not found, maybe we need to click a search icon first?
                    # But usually it's visible. Let's wait for the main one.
                    search_input = "input.auto-suggest__input"
                    page.wait_for_selector(search_input, timeout=5000)

                page.click(search_input)
                # Clear existing
                page.keyboard.press("Control+A")
                page.keyboard.press("Backspace")
                
                page.fill(search_input, keyword)
                time.sleep(2) # Wait for suggestions
                
                # Press ArrowDown then Enter to select first suggestion
                page.keyboard.press("ArrowDown")
                time.sleep(0.5)
                page.keyboard.press("Enter")
                
                print("   Pressed Enter. Waiting for results...")
                
            except Exception as e:
                print(f"❌ Search interaction failed: {e}")
                print("   Please manually search for the property in the browser window.")
        
        # --- WAIT FOR USER SELECTION ---
        print("\n" + "="*50)
        print("PLEASE SELECT A PROPERTY IN THE BROWSER")
        print("The script is waiting for a new tab to open or navigation to a property page.")
        print("="*50 + "\n")

        selected_page = None
        
        # Function to check if a page is a property page
        def is_property_page(p):
            url = p.url
            # Relaxed criteria: just needs to be magicbricks and have 'property' or 'flat' etc.
            # AND it should NOT be a search result page (which usually has 'cityName=' or 'search')
            is_mb = "magicbricks.com" in url
            has_prop_keyword = any(x in url for x in ["property", "flat", "villa", "house", "detail"])
            is_not_search = "cityName=" not in url and "search" not in url
            
            # However, sometimes the detail page URL is complex.
            # Let's look for specific detail page indicators if possible, or just rely on the user opening a new tab.
            # Usually opening a new tab from results is a property.
            
            return is_mb and has_prop_keyword and is_not_search

        # Wait loop
        start_wait = time.time()
        last_log_time = 0
        
        while time.time() - start_wait < 600: # Wait up to 10 minutes
            # Check all pages in context
            pages = context.pages
            
            # Log status every 2 seconds
            if time.time() - last_log_time > 2:
                print(f"   [DEBUG] Open pages: {len(pages)}")
                for i, p in enumerate(pages):
                    try:
                        print(f"      Page {i}: {p.url}")
                    except:
                        pass
                last_log_time = time.time()

            # Look for a page that is NOT the initial search page (index 0)
            for p in pages:
                if p != page: # It's a new tab
                    try:
                        p.wait_for_load_state("domcontentloaded", timeout=500)
                    except:
                        pass
                    
                    url = p.url
                    # If it's a new tab and looks vaguely like a property, take it.
                    # We trust the user clicked something relevant.
                    if "magicbricks.com" in url and url != "about:blank":
                        print(f"   [DEBUG] MATCH FOUND in new tab: {url}")
                        selected_page = p
                        break
            
            if selected_page:
                break
            
            # Also check if the main page navigated to a detail page
            if page.url != "about:blank":
                 if is_property_page(page):
                     print(f"   [DEBUG] MATCH FOUND in main page: {page.url}")
                     selected_page = page
                     break
            
            time.sleep(1)
        
        if selected_page:
            print(f"🎉 Detected property page: {selected_page.url}")
            try:
                selected_page.wait_for_load_state("networkidle", timeout=10000)
            except:
                pass
            
            scrape_single_property(selected_page)
        else:
            print("❌ Timeout: No property selected.")

        browser.close()

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("keyword", nargs="?", default="Greater Noida")
    parser.add_argument("--url", help="Direct URL to scrape")
    args = parser.parse_args()

    if args.url:
        print(f"🔍 Direct scraping URL: {args.url}")
        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=True) # Headless is fine for direct URL
            page = browser.new_page()
            try:
                page.goto(args.url, timeout=60000)
                # Handle potential popups
                try:
                    page.click("text=Ok, understood", timeout=3000)
                except:
                    pass
                scrape_single_property(page)
            except Exception as e:
                print(f"❌ Error scraping URL: {e}")
            browser.close()
    else:
        # Pass keyword to scrape function via sys.argv hack or modify scrape to take arg
        # Since scrape() reads sys.argv[1], we need to ensure it sees the keyword
        # But we already parsed args. Let's just call scrape() and let it handle sys.argv
        # Or better, modify scrape() to accept keyword.
        # For minimal changes, we'll just let scrape() do its thing, 
        # but we need to make sure sys.argv is correct if we used argparse
        scrape()
