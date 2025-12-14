import sys
import json
import fitz  # PyMuPDF
import spacy
import pytesseract
from pdf2image import convert_from_path
import os

# Load SpaCy model
nlp = spacy.load("en_core_web_sm")

def extract_text_from_pdf(pdf_path):
    text = ""
    try:
        # 1. Try PyMuPDF (Text based)
        doc = fitz.open(pdf_path)
        for page in doc:
            text += page.get_text()
        
        # 2. If text is too short, try OCR (Image based)
        if len(text.strip()) < 50:
            # Check if tesseract is available
            try:
                images = convert_from_path(pdf_path)
                for img in images:
                    text += pytesseract.image_to_string(img)
            except Exception as e:
                # If OCR fails (e.g. tesseract not installed), just return what we have
                pass
                
    except Exception as e:
        return ""
        
    return text

def analyze_text(text):
    doc = nlp(text)
    
    entities = {}
    for ent in doc.ents:
        if ent.label_ not in entities:
            entities[ent.label_] = []
        if ent.text not in entities[ent.label_]:
            entities[ent.label_].append(ent.text)
            
    return entities

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No file path provided"}))
        sys.exit(1)
        
    pdf_path = sys.argv[1]
    
    if not os.path.exists(pdf_path):
        print(json.dumps({"error": "File not found"}))
        sys.exit(1)

    extracted_text = extract_text_from_pdf(pdf_path)
    ner_entities = analyze_text(extracted_text)
    
    result = {
        "text": extracted_text,
        "entities": ner_entities
    }
    
    print(json.dumps(result))
