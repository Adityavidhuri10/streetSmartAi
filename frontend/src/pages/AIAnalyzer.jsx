import { useState } from "react";
import API from "../utils/api";
import { Upload, AlertTriangle, CheckCircle, Activity, AlertOctagon, FileImage, FileText, Hammer } from "lucide-react";
import AgreementAnalyzer from "./AgreementAnalyzer";

export default function AIAnalyzer() {
  const [activeTab, setActiveTab] = useState("defect"); // 'defect' or 'agreement'
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      const res = await API.post("/defects/analyze", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setResult(res.data.result);
    } catch (err) {
      console.error("Analysis failed:", err);
      setError(err.response?.data?.message || "Failed to analyze image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 animate-fadeIn">

      {/* Tab Navigation */}
      <div className="flex justify-center mb-10">
        <div className="bg-gray-100 p-1 rounded-xl inline-flex">
          <button
            onClick={() => setActiveTab("defect")}
            className={`flex items-center px-6 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === "defect"
                ? "bg-white text-black shadow-sm"
                : "text-gray-500 hover:text-gray-900"
              }`}
          >
            <Hammer className="w-4 h-4 mr-2" />
            Defect Detection
          </button>
          <button
            onClick={() => setActiveTab("agreement")}
            className={`flex items-center px-6 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === "agreement"
                ? "bg-white text-black shadow-sm"
                : "text-gray-500 hover:text-gray-900"
              }`}
          >
            <FileText className="w-4 h-4 mr-2" />
            Agreement Analyzer
          </button>
        </div>
      </div>

      {/* Content Area */}
      {activeTab === "agreement" ? (
        <AgreementAnalyzer />
      ) : (
        /* Defect Detection UI */
        <div>
          <div className="text-center mb-10">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
              Building Defect Detection 🏗️
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Upload an image of a building component (wall, ceiling, etc.) and our AI will detect defects like cracks, mold, or peeling paint.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

            {/* Left Column: Upload & Preview */}
            <div className="space-y-6">
              <div
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${previewUrl ? "border-blue-300 bg-blue-50/50" : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
                  }`}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="defect-upload"
                />

                {previewUrl ? (
                  <div className="relative group">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-64 object-cover rounded-lg shadow-md"
                    />
                    <label
                      htmlFor="defect-upload"
                      className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-lg text-white font-medium"
                    >
                      Change Image
                    </label>
                  </div>
                ) : (
                  <label htmlFor="defect-upload" className="cursor-pointer flex flex-col items-center justify-center h-64">
                    <div className="bg-blue-100 p-4 rounded-full mb-4">
                      <Upload className="w-8 h-8 text-blue-600" />
                    </div>
                    <span className="text-lg font-semibold text-gray-700">Click to Upload Image</span>
                    <span className="text-sm text-gray-500 mt-2">JPG, PNG, WEBP supported</span>
                  </label>
                )}
              </div>

              <button
                onClick={handleAnalyze}
                disabled={!selectedFile || loading}
                className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform hover:-translate-y-1 ${!selectedFile
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : loading
                    ? "bg-gray-800 text-white cursor-wait"
                    : "bg-black text-white hover:bg-gray-800"
                  }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Analyzing...
                  </span>
                ) : (
                  "Analyze Defect"
                )}
              </button>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start">
                  <AlertOctagon className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Right Column: Results */}
            <div className="relative">
              {!result && !loading && (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 border border-gray-100 rounded-2xl bg-gray-50 p-10">
                  <Activity className="w-16 h-16 mb-4 opacity-20" />
                  <p>Analysis results will appear here</p>
                </div>
              )}

              {loading && (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 border border-gray-100 rounded-2xl bg-white p-10">
                  <div className="animate-pulse flex flex-col items-center">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="h-32 bg-gray-200 rounded w-full mb-4"></div>
                    <p className="text-sm font-medium animate-bounce">AI is processing image...</p>
                  </div>
                </div>
              )}

              {result && (
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-slideUp">
                  <div className={`p-6 text-white ${result.defect_detected ? "bg-red-500" : "bg-green-500"}`}>
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold">
                        {result.defect_detected ? "Defect Detected" : "No Defect Detected"}
                      </h2>
                      {result.defect_detected ? <AlertTriangle className="w-8 h-8" /> : <CheckCircle className="w-8 h-8" />}
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    <div>
                      <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold mb-1">Defect Type</p>
                      <p className="text-3xl font-bold text-gray-800 capitalize">{result.defect_type}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <p className="text-sm text-gray-500 mb-1">Confidence</p>
                        <p className="text-xl font-bold text-blue-600">{(result.confidence * 100).toFixed(1)}%</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <p className="text-sm text-gray-500 mb-1">Severity</p>
                        <p className={`text-xl font-bold ${result.severity === "High" ? "text-red-600" :
                          result.severity === "Medium" ? "text-orange-500" : "text-green-600"
                          }`}>
                          {result.severity}
                        </p>
                      </div>
                    </div>

                    {result.defect_detected && (
                      <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4">
                        <h3 className="font-bold text-yellow-800 mb-2 flex items-center">
                          <FileImage className="w-4 h-4 mr-2" />
                          Recommendation
                        </h3>
                        <p className="text-yellow-700 text-sm leading-relaxed">
                          Based on the detected {result.defect_type}, it is recommended to inspect the structural integrity of the affected area.
                          {result.severity === "High" ? " Immediate professional assessment is advised." : " Monitor for further changes."}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
