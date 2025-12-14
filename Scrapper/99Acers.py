from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup
import json
import os
import re
import requests
import time
from datetime import datetime
from urllib.parse import urlparse, quote
import sys

# ------------------ Helper Class ------------------ #
class PropertyDataExtractor:
    def __init__(self, html_content, property_id):
        self.soup = BeautifulSoup(html_content, "html.parser")
        self.property_id = property_id
        self.images_dir = f"scraped_data/images/{property_id}"
        os.makedirs(self.images_dir, exist_ok=True)
        
        self.data = {
            "property_id": property_id,
            "property_name": None,
            "url": None,
            "bhk": None,
            "price": None,
            "image_urls": [],
            "local_images": [],
            "youtube_video": None,
            "features": {"property": [], "society": []},
            "nearby_places": [],
            "reviews": [],
            "scraped_at": datetime.now().isoformat(),
            "meta_data": {},
            "structured_data": [],
            "dynamic_facts": {}
        }
        
        # Full text for regex fallback
        self.full_text = self.soup.get_text(" ", strip=True)

    def extract_json_ld(self):
        """Extracts JSON-LD structured data."""
        scripts = self.soup.find_all("script", type="application/ld+json")
        for script in scripts:
            try:
                data = json.loads(script.string)
                self.data["structured_data"].append(data)
                
                # specific extraction from JSON-LD if available
                if isinstance(data, dict):
                    if "name" in data and not self.data["property_name"]:
                        self.data["property_name"] = data["name"]
                    if "image" in data:
                        imgs = data["image"] if isinstance(data["image"], list) else [data["image"]]
                        for img in imgs:
                            if img and img not in self.data["image_urls"]:
                                self.data["image_urls"].append(img)
                    if "description" in data:
                        self.data["description"] = data["description"]
                    
                    # Address extraction
                    if "address" in data:
                        addr = data["address"]
                        if isinstance(addr, dict):
                            self.data["dynamic_facts"]["Address"] = f"{addr.get('streetAddress', '')}, {addr.get('addressLocality', '')}, {addr.get('addressRegion', '')}"
                        elif isinstance(addr, str):
                            self.data["dynamic_facts"]["Address"] = addr

            except:
                pass

    def extract_meta_tags(self):
        """Extracts meta tags for fallback data."""
        metas = self.soup.find_all("meta")
        for meta in metas:
            name = meta.get("name") or meta.get("property")
            content = meta.get("content")
            if name and content:
                self.data["meta_data"][name] = content
                
                if name in ["og:title", "twitter:title"] and not self.data["property_name"]:
                    self.data["property_name"] = content
                if name in ["og:image", "twitter:image"]:
                    if content not in self.data["image_urls"]:
                        self.data["image_urls"].append(content)
                if name in ["og:description", "twitter:description", "description"]:
                    if "description" not in self.data:
                         self.data["description"] = content
                if name == "og:url" and not self.data["url"]:
                    self.data["url"] = content

    def extract_dynamic_facts(self):
        """Robust fact extraction using multiple strategies."""
        
        # Strategy 1: Specific Fact Containers (99acres specific)
        # Look for elements like <div class="factLabel">...</div> <div class="factValue">...</div>
        # Or generic key-value pairs in tables/grids
        
        # Common patterns for facts in property sites
        fact_patterns = [
            {"label": "Super Area", "regex": r"Super Area[:\s]*([\d,]+\s*sq\.?ft\.?)", "type": "area"},
            {"label": "Carpet Area", "regex": r"Carpet Area[:\s]*([\d,]+\s*sq\.?ft\.?)", "type": "area"},
            {"label": "Floor", "regex": r"Floor[:\s]*([0-9A-Za-z\s]+)(?:out of|$)", "type": "fact"},
            {"label": "Transaction Type", "regex": r"Transaction Type[:\s]*([A-Za-z\s]+)", "type": "fact"},
            {"label": "Status", "regex": r"Status[:\s]*([A-Za-z\s]+)", "type": "fact"},
            {"label": "Facing", "regex": r"Facing[:\s]*([A-Za-z\s]+)", "type": "fact"},
            {"label": "Society", "regex": r"(?:in|at)\s+([A-Za-z0-9\s]+(?:Apartments|Heights|Enclave|Residency|Tower|City|Park|Villas))", "type": "society"},
            {"label": "Bathrooms", "regex": r"(\d+)\s*Bath(?:room)?s?", "type": "fact"},
            {"label": "Balcony", "regex": r"(\d+)\s*Balcon(?:y|ies)", "type": "fact"},
        ]

        # 1. Regex over full text (Fallback & Powerful)
        for pattern in fact_patterns:
            match = re.search(pattern["regex"], self.full_text, re.IGNORECASE)
            if match:
                val = match.group(1).strip()
                self.data["dynamic_facts"][pattern["label"]] = val
                
                # Map to core fields
                if pattern["type"] == "area" and not self.data.get("area"):
                    self.data["area"] = val
                if pattern["type"] == "society":
                    self.data["dynamic_facts"]["Society"] = val

        # 2. Parse specific Fact Sections in HTML
        # Look for lists or grids
        fact_elements = self.soup.select("ul > li, div[class*='fact'], div[class*='summary']")
        for el in fact_elements:
            text = el.get_text(" ", strip=True)
            if ":" in text:
                parts = text.split(":")
                if len(parts) == 2:
                    k = parts[0].strip()
                    v = parts[1].strip()
                    if len(k) < 30 and len(v) < 50:
                        self.data["dynamic_facts"][k] = v

    def extract_property_name(self):
        # Expanded selectors for property name
        selectors = [
            ("h1", "property-title"), 
            ("h1", "PDCP__title"),
            ("h1", "component__pdPropName"),
            ("h1", "mb-srp__card--title"),
            ("h1", "ProjectInfo__projectName"),
            ("span", "ProjectInfo__projectName")
        ]
        for tag, cls in selectors:
            found = self.soup.find(tag, class_=cls)
            if found:
                self.data["property_name"] = found.get_text(strip=True)
                return
        
        # Fallback: try meta title
        meta_title = self.soup.find("meta", property="og:title")
        if meta_title:
            self.data["property_name"] = meta_title.get("content")

    def download_image(self, url):
        try:
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                parsed = urlparse(url)
                filename = os.path.basename(parsed.path)
                if not filename or "." not in filename:
                    filename = f"image_{int(time.time()*1000)}.jpg"
                
                file_path = os.path.join(self.images_dir, filename)
                with open(file_path, "wb") as f:
                    f.write(response.content)
                return file_path
        except Exception as e:
            print(f"Error downloading {url}: {e}")
        return None

    def extract_images(self):
        image_urls = []
        # Strategy 1: Look for img tags with specific domains
        for img in self.soup.find_all("img"):
            src = img.get("src") or img.get("data-src")
            if src and any(domain in src for domain in ["99acres", "mediacdn", "imagecdn"]):
                if src not in image_urls:
                    image_urls.append(src)
        
        self.data["image_urls"] = image_urls
        
        # Download images (Limit to 5 to save time/bandwidth)
        print(f"   Downloading {min(len(image_urls), 5)} images...")
        for img_url in image_urls[:5]:
            local_path = self.download_image(img_url)
            if local_path:
                self.data["local_images"].append(local_path)

    def extract_youtube_video(self):
        iframe = self.soup.find("iframe", src=re.compile(r"(youtube\.com|youtu\.be)"))
        if iframe:
            self.data["youtube_video"] = iframe.get("src")

    def extract_features(self):
        # Look for features in lists
        blocks = self.soup.find_all(["div", "ul"], class_=re.compile(r"(feature|amenity|highlight)", re.I))
        for block in blocks:
            for item in block.find_all(["li", "span", "div"]):
                text = item.get_text(strip=True)
                if text and len(text) < 40:
                    if any(word in text.lower() for word in ["society", "club", "security", "garden", "pool", "gym"]):
                        if text not in self.data["features"]["society"]:
                            self.data["features"]["society"].append(text)
                    else:
                        if text not in self.data["features"]["property"]:
                            self.data["features"]["property"].append(text)

    def extract_nearby_places(self):
        for tag in self.soup.find_all("span", class_="NearByLocation__infoText"):
            text = tag.get_text(strip=True)
            if text:
                self.data["nearby_places"].append(text)

    def extract_reviews(self):
        for block in self.soup.find_all("div", class_="cb___Wrap"):
            text = block.get_text(strip=True)
            rating_tag = block.find("div", class_="cb__desktopStarFont")
            rating = rating_tag.get_text(strip=True) if rating_tag else None
            self.data["reviews"].append({"text": text, "rating": rating})

    def extract_bhk_and_price(self, url):
        """Extract BHK and price from URL and page content."""
        # Extract BHK from URL (e.g., "3-bhk-bedroom")
        bhk_match = re.search(r"(\d+)-bhk", url, re.IGNORECASE)
        if bhk_match:
            self.data["bhk"] = int(bhk_match.group(1))
        
        # Try to find price in page content
        # Look for currency symbol
        price_match = re.search(r"₹\s*([\d,]+\s*(?:Cr|Lac|Lakh|Crore)?)", self.full_text, re.IGNORECASE)
        if price_match:
             self.data["price"] = price_match.group(1)

    def extract_all(self, url):
        self.data["url"] = url
        self.extract_json_ld()
        self.extract_meta_tags()
        self.extract_property_name()
        self.extract_bhk_and_price(url)
        self.extract_dynamic_facts()
        self.extract_images()
        self.extract_youtube_video()
        self.extract_features()
        self.extract_nearby_places()
        self.extract_reviews()
        return self.data

    @staticmethod
    def extract_property_id(url):
        match = re.search(r"spid-([A-Za-z0-9]+)", url)
        return match.group(1) if match else f"unknown_{int(datetime.now().timestamp())}"


# ------------------ Index File Save ------------------ #
def update_property_index(property_id, url):
    index_file = "scraped_data/properties_index.json"
    os.makedirs("scraped_data", exist_ok=True)

    if os.path.exists(index_file):
        with open(index_file, "r", encoding="utf-8") as f:
            index_data = json.load(f)
    else:
        index_data = []

    if any(entry["property_id"] == property_id for entry in index_data):
        return

    index_data.append({
        "property_id": property_id,
        "url": url,
        "saved_at": datetime.now().isoformat()
    })

    with open(index_file, "w", encoding="utf-8") as f:
        json.dump(index_data, f, ensure_ascii=False, indent=4)

    print(f"📌 Saved {property_id} to index")


# ------------------ Scrape Property Details ------------------ #
def scrape_property(url: str) -> dict:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        )
        page = context.new_page()
    
        print(f"🕐 Opening property: {url}")
        try:
            page.goto(url, wait_until="domcontentloaded", timeout=45000)
        except Exception as e:
            print(f"⚠ Error loading page: {e}")
            return None

        try:
            # Handle common popups
            page.click("text=OK", timeout=2000)
            page.click("div[data-label='FRAUD_ALERT_UNDERSTOOD']", timeout=2000)
        except:
            pass

        # Scroll to trigger lazy loading
        for _ in range(5):
             page.mouse.wheel(0, 1000)
             page.wait_for_timeout(1000)

        html = page.content()
        browser.close()

    prop_id = PropertyDataExtractor.extract_property_id(url)
    extractor = PropertyDataExtractor(html, prop_id)
    return extractor.extract_all(url)


# ------------------ Extract All Listing Links ------------------ #
def get_links_from_listing(listing_url):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        page.goto(listing_url, wait_until="domcontentloaded", timeout=30000)

        # Click popup
        try:
            page.locator("div[data-label='FRAUD_ALERT_UNDERSTOOD']").click(timeout=5000)
            print("✔ Fraud alert popup closed")
        except:
            print("ℹ No fraud popup found")

        page.wait_for_timeout(3000)  # allow page to load
        
        # Scroll to load more
        for _ in range(3):
            page.mouse.wheel(0, 1000)
            time.sleep(1)

        # --- Extract proper property card URLs ---
        content = page.content()
        soup = BeautifulSoup(content, "html.parser")
        links = []
        
        # Strategy 1: Look for specific project/property tuples
        # 99Acers often uses 'projectTuple__projectName' or 'srpTuple__tupleTitle'
        
        # Strategy 2: Brute force all links
        all_links = soup.find_all("a", href=True)
        print(f"   Found {len(all_links)} total links on page")
        
        for i, a in enumerate(all_links):
            href = a["href"]
            if i < 5:
                print(f"   Debug Link: {href}")
            
            # 99Acers property links usually contain 'spid-'
            if "spid-" in href:
                # Ensure it's a full URL
                if href.startswith("/"):
                    href = "https://www.99acres.com" + href
                
                if href not in links:
                    links.append(href)
        
        # Filter out duplicates and irrelevant ones
        links = list(set(links))

        print(f"🔍 Extracted {len(links)} real property links")

        browser.close()
        return links[:10]     # scrape first 10 to test



# ------------------ Main Execution ------------------ #
if __name__ == "__main__":
    keyword = "Greater Noida"
    if len(sys.argv) > 1:
        keyword = sys.argv[1]
        
    print(f"🔍 Searching for: {keyword}")
    encoded_keyword = quote(keyword)
    listing_url = f"https://www.99acres.com/search/property/rent/{encoded_keyword}?keyword={encoded_keyword}&preference=R"

    links = get_links_from_listing(listing_url)

    os.makedirs("scraped_data", exist_ok=True)

    for link in links:
        data = scrape_property(link)
        if data:
            filename = f"scraped_data/{data['property_id']}.json"

            with open(filename, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=4)

            update_property_index(data["property_id"], link)
            print(f"💾 Saved: {filename}\n")

    print("🎉 Done — properties scraped and indexed!")
