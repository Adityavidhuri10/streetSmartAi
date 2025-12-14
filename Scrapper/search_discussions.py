import sys
import json
import os
from playwright.sync_api import sync_playwright
from urllib.parse import quote
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
# Try to find .env in backend directory
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_env_path = os.path.join(current_dir, '../backend/.env')
load_dotenv(backend_env_path)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    print(f"DEBUG: API Key loaded: {GEMINI_API_KEY[:5]}...", file=sys.stderr)
else:
    print("DEBUG: GEMINI_API_KEY not found.", file=sys.stderr)


def analyze_with_gemini(query, title, comments):
    if not GEMINI_API_KEY:
        return None

    model = genai.GenerativeModel('gemini-2.0-flash')
    
    prompt = f"""
    Analyze the following Reddit discussion thread related to the search query: "{query}".
    
    Thread Title: "{title}"
    Comments:
    {json.dumps(comments)}
    
    Task:
    1. STRICTLY determine if this discussion is relevant to the specific real estate query: "{query}".
       - If the query is a specific project name (e.g., "NBCC Eternia"), the discussion MUST be about that project or very similar ones in the same area.
       - If the query is a locality (e.g., "Greater Noida West"), the discussion MUST be about living, renting, or buying in that area.
       - Ignore general discussions that just mention the location in passing without providing real estate or living context.
    2. Analyze the sentiment (Positive, Negative, Neutral, or Mixed).
    3. Summarize the main points discussed.
    4. Extract key pros and cons if available.

    Output strictly in JSON format with the following keys:
    {{
        "is_relevant": boolean,
        "sentiment": "string",
        "summary": "string",
        "key_points": ["string", "string"]
    }}
    """
    
    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        # Clean up markdown code blocks if present
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
        return json.loads(text)
    except Exception as e:
        print(f"Gemini Error: {e}", file=sys.stderr)
        return None

# import requests
# from bs4 import BeautifulSoup

def generate_simulation(query):
    if not GEMINI_API_KEY:
        return []
    
    try:
        model = genai.GenerativeModel('gemini-2.0-flash')
        prompt = f"""
        The user is searching for real estate discussions about "{query}" but none were found.
        Generate 2 ULTRA REALISTIC, simulated Reddit-style discussion threads about this specific property or locality.
        
        Rules for realism:
        1. Use typical Indian real estate context (Greater Noida/Noida specific issues like water hardness, registry delays, construction quality, maintenance charges).
        2. Mix of happy tenants and frustrated owners.
        3. Use casual language, some typos, abbreviations (BHK, sqft, maintenance), and internet slang.
        4. Make it sound authentic, not marketing copy.
        
        Output strictly a JSON LIST of objects. Each object must have:
        - "title": A realistic Reddit thread title.
        - "link": A dummy link (e.g., "https://www.reddit.com/r/NoidaRealEstate/...").
        - "source": "Community Insight (AI Simulated)"
        - "comments": A list of 3-5 realistic comments strings.
        - "analysis": An object with "is_relevant" (true), "sentiment" (string), "summary" (string), "key_points" (list of strings).
        """
        
        response = model.generate_content(prompt)
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
            
        return json.loads(text)
    except Exception as e:
        print(f"Simulation Error: {e}", file=sys.stderr)
        return []

def search_and_scrape_reddit(query):
    results = []
    links_to_scrape = []

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True, args=[
                '--disable-blink-features=AutomationControlled',
                '--no-sandbox',
                '--disable-setuid-sandbox'
            ])
            context = browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            )
            page = context.new_page()

            # 1. Search Reddit directly
            try:
                # Add 'review' or 'real estate' to context if needed, but user query might be specific enough
                search_query = quote(query + " review")
                search_url = f"https://www.reddit.com/search/?q={search_query}&type=link"
                print(f"DEBUG: Navigating to search: {search_url}", file=sys.stderr)
                
                page.goto(search_url, timeout=20000)
                
                # Wait for results - try to wait for something that looks like a post
                try:
                    page.wait_for_selector('a[href*="/comments/"]', timeout=10000)
                except:
                    print("DEBUG: Timeout waiting for search results", file=sys.stderr)

                # Extract links
                # Look for links that contain /r/ and /comments/
                # We get all 'a' tags and filter in python to be safe against UI changes
                all_links = page.query_selector_all('a')
                for a in all_links:
                    href = a.get_attribute('href')
                    if href and "/r/" in href and "/comments/" in href:
                        # Ensure it's a full URL
                        if href.startswith('/'):
                            href = "https://www.reddit.com" + href
                        
                        # Filter out some non-thread links if necessary
                        if "/comment/" in href: # Link to specific comment
                            continue
                            
                        # Avoid duplicates
                        if href not in links_to_scrape:
                            links_to_scrape.append(href)
                        
                        if len(links_to_scrape) >= 3: # Limit to 3 for speed
                            break
                
                print(f"DEBUG: Found {len(links_to_scrape)} links", file=sys.stderr)
                
            except Exception as e:
                print(f"Search Error: {e}", file=sys.stderr)

            if not links_to_scrape:
                browser.close()
                # FALLBACK: Generate simulation if no links found
                print("DEBUG: No links found, generating simulation...", file=sys.stderr)
                return generate_simulation(query)

            # 2. Scrape each Reddit thread
            for link in links_to_scrape:
                try:
                    # Use old.reddit.com for easier scraping
                    scrape_link = link.replace("www.reddit.com", "old.reddit.com")
                    print(f"DEBUG: Scraping {scrape_link}", file=sys.stderr)
                    page.goto(scrape_link, timeout=15000)
                    
                    # Extract Title
                    title = "Reddit Discussion"
                    try:
                        title_el = page.query_selector('a.title')
                        if title_el:
                            title = title_el.inner_text().strip()
                    except:
                        pass
                    
                    # Extract Comments (Old Reddit)
                    comments = []
                    
                    # Selectors for Old Reddit
                    # Comments are in div.entry
                    comment_elements = page.query_selector_all('div.entry')
                    
                    if comment_elements:
                        print(f"DEBUG: Found {len(comment_elements)} entry elements", file=sys.stderr)
                        
                    for comment_el in comment_elements[:10]: # Get top 10
                        try:
                            # The comment text is in div.usertext-body > div.md
                            md_div = comment_el.query_selector('div.usertext-body div.md')
                            if md_div:
                                text = md_div.inner_text()
                                # Clean up
                                if len(text) > 30 and "deleted" not in text:
                                    comments.append(text[:500])
                        except:
                            continue
                    
                    print(f"DEBUG: Extracted {len(comments)} comments for {link}", file=sys.stderr)
                    
                    if comments:
                        analysis = analyze_with_gemini(query, title, comments)
                        
                        # Relaxed relevancy check
                        is_relevant = analysis and (
                            analysis.get("is_relevant") or 
                            query.lower() in str(analysis).lower() or
                            "Greater Noida" in str(analysis)
                        )

                        if is_relevant:
                            result_item = {
                                "title": title,
                                "link": link, # Keep original link for the user
                                "source": "Reddit",
                                "comments": comments,
                                "analysis": analysis
                            }
                            results.append(result_item)
                        else:
                            print(f"DEBUG: Skipping irrelevant thread: {title}", file=sys.stderr)
                    
                except Exception as e:
                    print(f"Error scraping link {link}: {e}", file=sys.stderr)
                    continue
            
            browser.close()
    except Exception as e:
        print(f"Global Error: {e}", file=sys.stderr)
        pass
        
    # If after scraping we still have no results, simulate
    if not results:
        print("DEBUG: No relevant results found after scraping, generating simulation...", file=sys.stderr)
        return generate_simulation(query)

    return results

if __name__ == "__main__":
    query = sys.argv[1] if len(sys.argv) > 1 else "Greater Noida"
    data = search_and_scrape_reddit(query)
    print(json.dumps(data))
