import os
import json
import glob

def index_files():
    base_dir = "scraped_data"
    index_file = os.path.join(base_dir, "index.json")
    properties_index_file = os.path.join(base_dir, "properties_index.json")
    
    # Files to ignore (index files themselves)
    ignore_files = {"index.json", "properties_index.json"}
    
    indexed_data = []
    
    # Load existing properties index for lookup (99Acers metadata)
    properties_lookup = {}
    if os.path.exists(properties_index_file):
        try:
            with open(properties_index_file, "r", encoding="utf-8") as f:
                p_index = json.load(f)
                for item in p_index:
                    properties_lookup[item.get("property_id")] = item
        except Exception as e:
            print(f"Warning: Could not read properties_index.json: {e}")

    # Pattern 1: 99Acers files in scraped_data root
    files_99acers = glob.glob(os.path.join(base_dir, "*.json"))
    
    # Pattern 2: MagicBricks files in scraped_data/properties
    files_magicbricks = glob.glob(os.path.join(base_dir, "properties", "*.json"))
    
    print(f"Found {len(files_99acers)} 99Acers files and {len(files_magicbricks)} MagicBricks files.")
    
    # Process 99Acers files
    for file_path in files_99acers:
        filename = os.path.basename(file_path)
        if filename in ignore_files:
            continue
            
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            
            prop_id = data.get("property_id")
            
            # Look up in properties_index.json
            lookup = properties_lookup.get(prop_id, {})
            url = lookup.get("url")
            
            entry = {
                "property_id": prop_id,
                "property_name": data.get("property_name"),
                "url": url,
                "file_path": file_path,
                "scraped_at": data.get("scraped_at") or lookup.get("saved_at"),
                "source": "99Acers"
            }
            indexed_data.append(entry)
        except Exception as e:
            print(f"Error processing {file_path}: {e}")

    # Process MagicBricks files
    for file_path in files_magicbricks:
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            
            entry = {
                "property_id": data.get("property_id"),
                "property_name": data.get("property_name"),
                "url": data.get("link"),
                "file_path": file_path,
                "scraped_at": data.get("scraped_at"),
                "source": "MagicBricks"
            }
            indexed_data.append(entry)
        except Exception as e:
            print(f"Error processing {file_path}: {e}")

    # Write the index
    with open(index_file, "w", encoding="utf-8") as f:
        json.dump(indexed_data, f, ensure_ascii=False, indent=4)
        
    print(f"Successfully indexed {len(indexed_data)} properties to {index_file}")

if __name__ == "__main__":
    index_files()
