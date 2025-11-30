import { useState } from "react";

export default function AgreementAnalyzer() {
  const [agreementText, setAgreementText] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = () => {
    setLoading(true);

    // Simulated AI response (replace later with backend AI API)
    setTimeout(() => {
      const ownerClauses = [];
      const tenantClauses = [];

      if (agreementText.toLowerCase().includes("late payment")) {
        ownerClauses.push("Clause: Late Payment Penalty — favors owner");
      }
      if (agreementText.toLowerCase().includes("security deposit")) {
        tenantClauses.push("Clause: Security Deposit Refund — favors tenant");
      }
      if (agreementText.toLowerCase().includes("maintenance")) {
        ownerClauses.push("Clause: Maintenance Cost Responsibility — favors owner");
      }

      setAnalysis({
        owner: ownerClauses.length ? ownerClauses : ["No owner-biased clauses found."],
        tenant: tenantClauses.length ? tenantClauses : ["No tenant-biased clauses found."],
      });

      setLoading(false);
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
        🧠 AI Rent Agreement Analyzer
      </h1>

      <textarea
        placeholder="Paste your rent agreement text here..."
        value={agreementText}
        onChange={(e) => setAgreementText(e.target.value)}
        rows={10}
        className="w-full border border-gray-300 rounded-lg p-4 text-gray-700 focus:outline-black-500 resize-none"
      ></textarea>

      <div className="flex justify-center mt-6">
        <button
          onClick={handleAnalyze}
          disabled={!agreementText || loading}
          className={`px-6 py-2 rounded-lg text-white ${
            loading ? "bg-gray-400" : "bg-black-600 hover:bg-black-700"
          }`}
        >
          {loading ? "Analyzing..." : "Analyze Agreement"}
        </button>
      </div>

      {analysis && (
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-red-50 p-5 rounded-xl border border-red-200">
            <h2 className="text-lg font-semibold text-red-600 mb-2">
              🔴 Clauses Favoring Owner
            </h2>
            <ul className="list-disc ml-5 text-gray-700">
              {analysis.owner.map((clause, i) => (
                <li key={i}>{clause}</li>
              ))}
            </ul>
          </div>

          <div className="bg-green-50 p-5 rounded-xl border border-green-200">
            <h2 className="text-lg font-semibold text-green-600 mb-2">
              🟢 Clauses Favoring Tenant
            </h2>
            <ul className="list-disc ml-5 text-gray-700">
              {analysis.tenant.map((clause, i) => (
                <li key={i}>{clause}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
