import os
import json
from collections import defaultdict

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "scraped_data")
PROPERTIES_DIR = DATA_DIR

def analyze_properties():
    """Analyze all property files for null/missing values."""
    
    null_stats = defaultdict(lambda: {"count": 0, "files": []})
    total_files = 0
    
    # Fields to check
    fields_to_check = [
        "bhk", "price", "area", "url", 
        ("location", "address"), ("location", "locality")
    ]
    
    print("=" * 60)
    print("ANALYZING SCRAPED DATA FOR NULL VALUES")
    print("=" * 60)
    
    for filename in os.listdir(PROPERTIES_DIR):
        if not filename.endswith(".json"):
            continue
            
        total_files += 1
        filepath = os.path.join(PROPERTIES_DIR, filename)
        
        try:
            with open(filepath, 'r') as f:
                data = json.load(f)
        except:
            print(f"⚠ Error reading {filename}")
            continue
        
        properties_list = []
        if isinstance(data, list):
            properties_list.extend(data)
        elif isinstance(data, dict):
            properties_list.append(data)
            
        for prop in properties_list:
            # Check each field
            for field in fields_to_check:
                if isinstance(field, tuple):
                    # Nested field
                    value = prop.get(field[0], {}).get(field[1])
                    field_name = f"{field[0]}.{field[1]}"
                else:
                    value = prop.get(field)
                    field_name = field
            
            if value is None or value == "" or value == "Unknown":
                null_stats[field_name]["count"] += 1
                null_stats[field_name]["files"].append(filename)
    
    # Print summary
    print(f"\nTotal files analyzed: {total_files}")
    print("\n" + "=" * 60)
    print("NULL VALUE SUMMARY")
    print("=" * 60)
    
    for field, stats in sorted(null_stats.items(), key=lambda x: x[1]["count"], reverse=True):
        percentage = (stats["count"] / total_files) * 100
        print(f"\n{field}:")
        print(f"  Null count: {stats['count']}/{total_files} ({percentage:.1f}%)")
        print(f"  Files: {', '.join(stats['files'][:5])}")
        if len(stats['files']) > 5:
            print(f"         ... and {len(stats['files']) - 5} more")
    
    # Detailed analysis by source
    print("\n" + "=" * 60)
    print("BREAKDOWN BY SOURCE")
    print("=" * 60)
    
    source_stats = {"99Acers": {"total": 0, "null_bhk": 0, "null_url": 0, "null_address": 0},
                    "MagicBricks": {"total": 0, "null_bhk": 0, "null_url": 0, "null_address": 0}}
    
    for filename in os.listdir(PROPERTIES_DIR):
        if not filename.endswith(".json"):
            continue
            
        filepath = os.path.join(PROPERTIES_DIR, filename)
        try:
            with open(filepath, 'r') as f:
                data = json.load(f)
        except:
            continue
        
        properties_list = []
        if isinstance(data, list):
            properties_list.extend(data)
        elif isinstance(data, dict):
            properties_list.append(data)

        for prop in properties_list:
            source = prop.get("source", "Unknown")
            if source in source_stats:
                source_stats[source]["total"] += 1
                if not prop.get("bhk"):
                    source_stats[source]["null_bhk"] += 1
                if not prop.get("url"):
                    source_stats[source]["null_url"] += 1
                if not prop.get("location", {}).get("address"):
                    source_stats[source]["null_address"] += 1
    
    for source, stats in source_stats.items():
        if stats["total"] > 0:
            print(f"\n{source}:")
            print(f"  Total properties: {stats['total']}")
            print(f"  Missing BHK: {stats['null_bhk']} ({stats['null_bhk']/stats['total']*100:.1f}%)")
            print(f"  Missing URL: {stats['null_url']} ({stats['null_url']/stats['total']*100:.1f}%)")
            print(f"  Missing Address: {stats['null_address']} ({stats['null_address']/stats['total']*100:.1f}%)")
    
    print("\n" + "=" * 60)
    print("RECOMMENDATIONS")
    print("=" * 60)
    
    # Provide recommendations
    if null_stats.get("bhk", {}).get("count", 0) > 0:
        print("\n✓ BHK: Can be extracted from title or property features")
    if null_stats.get("url", {}).get("count", 0) > 0:
        print("✓ URL: Missing from 99Acers - need to store original URL during scraping")
    if null_stats.get("location.address", {}).get("count", 0) > 0:
        print("✓ Address: Can be improved by better title parsing or using nearby_places")
    if null_stats.get("price", {}).get("count", 0) > 0:
        print("✓ Price: Need to extract from page content during scraping")
    
    print("\n")

if __name__ == "__main__":
    analyze_properties()
