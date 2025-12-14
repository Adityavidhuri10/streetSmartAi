import { useState } from "react";
import API from "../utils/api";
import { FileText, AlertTriangle, CheckCircle, Scale, Shield, Upload } from "lucide-react";

export default function AgreementAnalyzer() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setAnalysis(null);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);
    setAnalysis(null);

    const formData = new FormData();
    formData.append("agreement", selectedFile);

    try {
      const res = await API.post("/agreements/analyze", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAnalysis(res.data.analysis);
    } catch (err) {
      console.error("Analysis failed:", err);
      setError(err.response?.data?.message || "Failed to analyze agreement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 animate-fadeIn">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
          AI Agreement Fairness Analyzer ⚖️
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Upload your rental agreement PDF. Our AI will analyze it for fairness, identify hidden risks, and highlight clauses that favor the owner or tenant.
        </p>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-10 text-center">
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer relative">
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center">
            <Upload className="w-12 h-12 text-blue-500 mb-4" />
            {selectedFile ? (
              <p className="text-lg font-semibold text-gray-800">{selectedFile.name}</p>
            ) : (
              <>
                <p className="text-lg font-semibold text-gray-700">Click or Drag PDF here</p>
                <p className="text-sm text-gray-500 mt-2">Max file size 10MB</p>
              </>
            )}
          </div>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={!selectedFile || loading}
          className={`mt-6 w-full md:w-1/3 py-3 rounded-xl font-bold text-lg shadow-lg transition-all transform hover:-translate-y-1 ${!selectedFile
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : loading
              ? "bg-gray-800 text-white cursor-wait"
              : "bg-black text-white hover:bg-gray-800"
            }`}
        >
          {loading ? "Analyzing Fairness..." : "Analyze Agreement"}
        </button>

        {error && (
          <div className="mt-4 bg-red-50 text-red-700 px-4 py-3 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}
      </div>

      {/* Results Section */}
      {analysis && (
        <div className="space-y-8 animate-slideUp">

          {/* Scores */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Fairness Score */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-gray-500 font-medium mb-1">Fairness Score</p>
                <h3 className={`text-4xl font-extrabold ${analysis.fairness_score >= 8 ? "text-green-600" :
                  analysis.fairness_score >= 5 ? "text-yellow-600" : "text-red-600"
                  }`}>
                  {analysis.fairness_score}/10
                </h3>
              </div>
              <Scale className={`w-12 h-12 ${analysis.fairness_score >= 8 ? "text-green-100" :
                analysis.fairness_score >= 5 ? "text-yellow-100" : "text-red-100"
                } bg-current rounded-full p-2`} />
            </div>

            {/* Risk Score */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-gray-500 font-medium mb-1">Tenant Risk Level</p>
                <h3 className={`text-4xl font-extrabold ${analysis.risk_score <= 3 ? "text-green-600" :
                  analysis.risk_score <= 7 ? "text-yellow-600" : "text-red-600"
                  }`}>
                  {analysis.risk_score}/10
                </h3>
              </div>
              <Shield className={`w-12 h-12 ${analysis.risk_score <= 3 ? "text-green-100" :
                analysis.risk_score <= 7 ? "text-yellow-100" : "text-red-100"
                } bg-current rounded-full p-2`} />
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-blue-600" />
              Summary
            </h3>
            <p className="text-gray-700 leading-relaxed">{analysis.summary}</p>
            <div className="mt-4 flex items-center text-xs text-gray-400">
              <span className="bg-gray-100 px-2 py-1 rounded border border-gray-200">
                Processed via: {analysis.extraction_method === "python-ocr" ? "Advanced OCR (Python)" : "Standard Parser (JS)"}
              </span>
            </div>
          </div>

          {/* Clause Analysis Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* Owner Favored */}
            <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
              <h3 className="text-lg font-bold text-red-800 mb-4 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Favors Owner
              </h3>
              <ul className="space-y-3">
                {analysis.owner_favored_clauses?.length > 0 ? (
                  analysis.owner_favored_clauses.map((clause, i) => (
                    <li key={i} className="flex items-start text-red-700 text-sm">
                      <span className="mr-2">•</span>
                      {clause}
                    </li>
                  ))
                ) : (
                  <li className="text-gray-500 italic">No significant owner bias detected.</li>
                )}
              </ul>
            </div>

            {/* Tenant Favored */}
            <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
              <h3 className="text-lg font-bold text-green-800 mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                Favors Tenant
              </h3>
              <ul className="space-y-3">
                {analysis.tenant_favored_clauses?.length > 0 ? (
                  analysis.tenant_favored_clauses.map((clause, i) => (
                    <li key={i} className="flex items-start text-green-700 text-sm">
                      <span className="mr-2">•</span>
                      {clause}
                    </li>
                  ))
                ) : (
                  <li className="text-gray-500 italic">No significant tenant bias detected.</li>
                )}
              </ul>
            </div>
          </div>

          {/* Unfair Clauses */}
          {analysis.unfair_clauses?.length > 0 && (
            <div className="bg-yellow-50 p-6 rounded-2xl border border-yellow-100">
              <h3 className="text-lg font-bold text-yellow-800 mb-4 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Potentially Unfair / Risky Clauses
              </h3>
              <ul className="space-y-3">
                {analysis.unfair_clauses.map((clause, i) => (
                  <li key={i} className="flex items-start text-yellow-800 text-sm bg-white/50 p-3 rounded-lg">
                    <span className="mr-2 font-bold text-yellow-600">!</span>
                    {clause}
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
