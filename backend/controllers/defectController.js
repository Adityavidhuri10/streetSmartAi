const asyncHandler = require("express-async-handler");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

// @desc    Analyze building defect from image
// @route   POST /api/defects/analyze
// @access  Public
const analyzeDefect = asyncHandler(async (req, res) => {
    if (!req.files || req.files.length === 0) {
        res.status(400);
        throw new Error("Please upload at least one image");
    }

    const results = [];
    const scriptPath = path.join(__dirname, "../../BD3-Dataset/api_predict.py");
    const pythonPath = path.join(__dirname, "../../BD3-Dataset/venv/bin/python3");

    for (const file of req.files) {
        const imagePath = file.path;
        console.log(`Received image for defect analysis: ${imagePath} (Field: ${file.fieldname})`);

        // Execute Python script
        const command = `"${pythonPath}" "${scriptPath}" "${imagePath}"`;

        try {
            const { stdout, stderr } = await new Promise((resolve, reject) => {
                exec(command, (error, stdout, stderr) => {
                    if (error) reject(error);
                    else resolve({ stdout, stderr });
                });
            });

            console.log("Python Output:", stdout);
            if (stderr) console.error("Python Error:", stderr);

            // Parse JSON output from Python
            let result;
            try {
                // Find the last line that looks like JSON in case of other print outputs
                const lines = stdout.trim().split('\n');
                const jsonLine = lines[lines.length - 1];
                result = JSON.parse(jsonLine);
            } catch (e) {
                // If parsing fails, push an error result but don't fail the whole request
                result = { error: "Failed to parse model output" };
            }

            results.push({
                filename: file.filename,
                originalName: file.originalname,
                analysis: result,
                image_url: `/uploads/defects/${file.filename}`
            });

        } catch (error) {
            console.error(`Analysis failed for ${file.originalname}:`, error);
            results.push({
                filename: file.filename,
                originalName: file.originalname,
                error: error.message
            });
        }
    }

    // Check if any defects were detected across all images
    const anyDefectDetected = results.some(r => r.analysis && r.analysis.defect_detected);

    // Aggregate defect types
    const defectTypes = [...new Set(results
        .filter(r => r.analysis && r.analysis.defect_detected)
        .map(r => r.analysis.defect_type))];

    res.json({
        message: "Defect analysis complete",
        results: results,
        summary: {
            defect_detected: anyDefectDetected,
            defect_types: defectTypes,
            total_images: results.length
        }
    });
});

module.exports = { analyzeDefect };
