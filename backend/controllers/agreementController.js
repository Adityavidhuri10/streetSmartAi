const asyncHandler = require("express-async-handler");
const pdf = require("pdf-parse");
const fs = require("fs");

const { spawn } = require("child_process");
const path = require("path");

// @desc    Upload and analyze rental agreement PDF
// @route   POST /api/agreements/analyze
// @access  Public (or Private)
// Helper to run Python script
const extractTextWithPython = (filePath) => {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(__dirname, "../scripts/analyze_agreement.py");
        const pythonProcess = spawn("python3", [scriptPath, filePath]);

        let scriptOutput = "";
        let scriptError = "";

        pythonProcess.stdout.on("data", (data) => {
            scriptOutput += data.toString();
        });

        pythonProcess.stderr.on("data", (data) => {
            scriptError += data.toString();
        });

        pythonProcess.on("error", (err) => {
            reject(err);
        });

        pythonProcess.on("close", (code) => {
            if (code !== 0) {
                reject(new Error(`Python script exited with code ${code}: ${scriptError}`));
            } else {
                try {
                    if (!scriptOutput.trim()) {
                        reject(new Error("Empty output from Python script"));
                    }
                    const result = JSON.parse(scriptOutput);
                    resolve(result);
                } catch (e) {
                    reject(new Error("Failed to parse Python output"));
                }
            }
        });
    });
};

// Helper to run JS fallback
const extractTextWithJS = async (filePath) => {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    return { text: data.text, entities: {} };
};

// @desc    Upload and analyze rental agreement PDF
// @route   POST /api/agreements/analyze
// @access  Public (or Private)
const analyzeAgreement = asyncHandler(async (req, res) => {
    if (!req.file) {
        res.status(400);
        throw new Error("Please upload a PDF file");
    }

    let extractedText = "";
    let nerEntities = {};
    let usedFallback = false;

    try {
        // 1. Try Python Extraction (OCR + NER)
        console.log("Attempting text extraction via Python...");
        const pythonResult = await extractTextWithPython(req.file.path);
        extractedText = pythonResult.text;
        nerEntities = pythonResult.entities;
    } catch (pythonError) {
        console.warn("Python extraction failed, switching to JS fallback:", pythonError.message);

        // 2. Fallback to JS Extraction (pdf-parse)
        try {
            console.log("Attempting text extraction via pdf-parse...");
            const jsResult = await extractTextWithJS(req.file.path);
            extractedText = jsResult.text;
            usedFallback = true;
        } catch (jsError) {
            console.error("JS fallback failed:", jsError);
            if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            res.status(500);
            throw new Error("Failed to extract text from PDF. Please ensure the file is a valid PDF.");
        }
    }

    // Validate extracted text
    if (!extractedText || extractedText.length < 10) {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(400);
        throw new Error("Could not extract sufficient text. If this is a scanned document, OCR might be unavailable.");
    }

    // 3. Analyze with Gemini
    try {
        const { GoogleGenerativeAI } = require("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `
          Analyze the following rental agreement text and provide a JSON response with the following fields:
          - summary: A brief summary of the agreement.
          - fairness_score: A score from 0-10 indicating how fair the agreement is (10 being perfectly fair).
          - risk_score: A score from 0-10 indicating the risk level for the tenant (higher is riskier).
          - tenant_favored_clauses: An array of strings listing clauses that favor the tenant.
          - owner_favored_clauses: An array of strings listing clauses that favor the owner.
          - unfair_clauses: An array of strings listing any clauses that are arguably unfair or biased towards either party (specify who it is unfair to).
          - key_terms: An object containing key terms like "rent", "deposit", "notice_period", "lock_in_period".

          Text:
          ${extractedText.substring(0, 100000)}
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        console.log("Gemini Raw Response:", text);

        let analysisResult;
        try {
            // robust JSON extraction
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            const jsonString = jsonMatch ? jsonMatch[0] : text;
            analysisResult = JSON.parse(jsonString);
        } catch (parseError) {
            console.error("JSON Parse Error:", parseError);
            throw new Error("Failed to parse AI response. The model might be overloaded.");
        }

        // Add metadata
        analysisResult.ner_entities = nerEntities;
        analysisResult.extraction_method = usedFallback ? "pdf-parse" : "python-ocr";

        // Cleanup
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

        res.json({
            success: true,
            analysis: analysisResult
        });

    } catch (aiError) {
        console.error("AI Analysis Error:", aiError);
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500);
        throw new Error("AI Analysis failed: " + aiError.message);
    }
});

module.exports = {
    analyzeAgreement,
};
