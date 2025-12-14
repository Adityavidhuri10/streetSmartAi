import { useParams } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import API from "../utils/api";
import { AuthContext } from "../context/AuthContext";
import { MapPin, Shield, Home, Maximize, Bath, Building, Info, CheckCircle } from "lucide-react";

export default function PropertyDetail() {
  const { id } = useParams();
  const { user, token, updateUser } = useContext(AuthContext);
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  const [discussions, setDiscussions] = useState([]);
  const [loadingDiscussions, setLoadingDiscussions] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Fetch discussions when property loads
  useEffect(() => {
    if (property) {
      const title = property.title;
      const query = `${title} Greater Noida`;

      if (query) {
        setLoadingDiscussions(true);
        API.get(`/scrape/discussions?query=${encodeURIComponent(query)}`)
          .then(res => setDiscussions(res.data))
          .catch(err => console.error("Failed to fetch discussions", err))
          .finally(() => setLoadingDiscussions(false));
      }
    }
  }, [property]);

  // Fetch property by ID (from backend)
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const res = await API.get(`/properties/${id}`);
        setProperty(res.data);
      } catch (error) {
        console.error("Error fetching property:", error);
        setProperty(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [id]);

  // Check if property is saved
  useEffect(() => {
    if (user && user.savedProperties) {
      setIsSaved(user.savedProperties.includes(id));
    }
  }, [user, id]);

  const handleSave = async () => {
    if (!token) {
      alert("Please login to save properties");
      return;
    }
    try {
      const res = await API.put(`/auth/save/${id}`);
      if (res.status === 200) {
        setIsSaved(!isSaved);
        // Update user context with new saved list
        updateUser({ ...user, savedProperties: res.data.savedProperties });
      }
    } catch (error) {
      console.error("Error saving property:", error);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    );

  if (!property)
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center">
        <h2 className="text-2xl font-bold text-gray-800">Property Not Found</h2>
        <p className="text-gray-500 mt-2">The property you are looking for does not exist or has been removed.</p>
      </div>
    );

  const {
    title,
    description,
    price,
    address,
    city,
    images,
    features,
    safety_score,
    bhk,
    area,
    dynamic_facts,
    isScraped
  } = property;

  const displayImage = images && images.length > 0
    ? (images[0].startsWith("http") ? images[0] : `http://localhost:5000${images[0]}`)
    : "https://placehold.co/800x500?text=No+Image";

  const formatPrice = (price) => {
    if (!price) return "Price on Request";
    if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
    if (price >= 100000) return `₹${(price / 100000).toFixed(2)} L`;
    return `₹${price.toLocaleString()}`;
  };

  const society = dynamic_facts?.["Society"] !== "N/A" ? dynamic_facts?.["Society"] : null;
  const propType = dynamic_facts?.["Property Type"] || "Apartment";
  const bathrooms = dynamic_facts?.["Bathrooms"];

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fadeIn">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
        <div>
          {/* Society Name as Main Title */}
          <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 leading-tight">
            {society || title}
          </h1>

          {/* Subtitle: BHK + Type */}
          {society && bhk && (
            <div className="text-2xl text-gray-600 font-semibold mt-2">
              {bhk} {propType}
            </div>
          )}

          {/* Address */}
          <div className="flex items-center text-gray-500 mt-3 text-xl">
            <MapPin className="w-6 h-6 mr-2 text-blue-600" />
            <span>{address || city}</span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-4xl font-bold text-gray-900">{formatPrice(price)}</div>
          {isScraped && <span className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-md mt-2 font-medium">Scraped Listing</span>}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">

        {/* Left Column: Main Info (Takes up 8/12 columns on XL screens) */}
        <div className="xl:col-span-8 space-y-10">

          {/* Image Gallery (Hero) */}
          <div className="rounded-3xl overflow-hidden shadow-xl border border-gray-100 relative group">
            <img
              src={displayImage}
              alt={title}
              className="w-full h-[450px] md:h-[600px] object-cover transform group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute bottom-6 right-6 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">
              {images?.length || 1} Photos
            </div>
          </div>

          {/* Key Highlights Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-blue-50 p-6 rounded-2xl flex flex-col items-center justify-center text-center border border-blue-100 hover:shadow-md transition-shadow">
              <Home className="w-8 h-8 text-blue-600 mb-3" />
              <span className="text-sm text-gray-500 font-medium uppercase tracking-wide">Configuration</span>
              <span className="text-xl font-bold text-gray-900 mt-1">{bhk || "N/A"}</span>
            </div>
            <div className="bg-green-50 p-6 rounded-2xl flex flex-col items-center justify-center text-center border border-green-100 hover:shadow-md transition-shadow">
              <Maximize className="w-8 h-8 text-green-600 mb-3" />
              <span className="text-sm text-gray-500 font-medium uppercase tracking-wide">Area</span>
              <span className="text-xl font-bold text-gray-900 mt-1">
                {area || dynamic_facts?.["Super Area"] || dynamic_facts?.["Carpet Area"] || "N/A"}
              </span>
            </div>
            <div className="bg-purple-50 p-6 rounded-2xl flex flex-col items-center justify-center text-center border border-purple-100 hover:shadow-md transition-shadow">
              <Building className="w-8 h-8 text-purple-600 mb-3" />
              <span className="text-sm text-gray-500 font-medium uppercase tracking-wide">Type</span>
              <span className="text-xl font-bold text-gray-900 mt-1">{propType}</span>
            </div>
            <div className="bg-orange-50 p-6 rounded-2xl flex flex-col items-center justify-center text-center border border-orange-100 hover:shadow-md transition-shadow">
              <Bath className="w-8 h-8 text-orange-600 mb-3" />
              <span className="text-sm text-gray-500 font-medium uppercase tracking-wide">Bathrooms</span>
              <span className="text-xl font-bold text-gray-900 mt-1">{bathrooms || "N/A"}</span>
            </div>
          </div>

          {/* 1. Amenities Card */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <CheckCircle className="w-7 h-7 mr-3 text-gray-400" />
              Amenities
            </h2>
            <div className="flex flex-wrap gap-4">
              {features && features.length > 0 ? (
                features.map((feature, i) => (
                  <span key={i} className="px-5 py-2.5 bg-gray-50 text-gray-900 rounded-xl text-sm font-semibold border border-gray-200 hover:bg-gray-100 transition-colors">
                    {feature}
                  </span>
                ))
              ) : (
                <p className="text-gray-500 italic">No specific amenities listed.</p>
              )}
            </div>
          </div>

          {/* 2. Explore Project Card */}
          {society && (
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Building className="w-7 h-7 mr-3 text-gray-400" />
                Explore Project
              </h2>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="bg-gray-100 p-4 rounded-xl mr-5">
                    <Building className="w-8 h-8 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{society}</h3>
                    <p className="text-gray-500 text-lg">{address || city}</p>
                  </div>
                </div>

                {dynamic_facts?.["Project Amenities"] && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <h4 className="font-bold text-gray-800 mb-3">Project Amenities</h4>
                    <p className="text-gray-600 leading-relaxed">
                      {dynamic_facts["Project Amenities"]}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. Description Card */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Info className="w-7 h-7 mr-3 text-gray-400" />
              Description
            </h2>
            <p className="text-gray-800 text-lg leading-relaxed whitespace-pre-line font-medium">
              {description || "No description available for this property."}
            </p>
          </div>

          {/* 4. More Details Card */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">More Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {/* Render dynamic facts in a grid of cards */}
              {Object.entries(dynamic_facts || {}).map(([key, value]) => {
                // Skip fields we've already highlighted elsewhere
                if (["Society", "Address", "Property Type", "Bathrooms", "Super Area", "Carpet Area", "BHK", "Price", "Project Amenities"].includes(key)) return null;

                return (
                  <div key={key} className="bg-gray-50 p-5 rounded-2xl border border-gray-200 flex flex-col hover:border-gray-300 transition-colors">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{key.replace(/_/g, " ")}</span>
                    <span className="text-gray-900 font-bold text-lg break-words">{value}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5. Community Discussions (New) */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="bg-orange-100 p-2 rounded-full mr-3">
                <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12c0 5.52 4.48 10 10 10s10-4.48 10-10c0-5.52-4.48-10-10-10zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-1.07 3.97-2.9 5.4z" /></svg>
              </span>
              Community Discussions
            </h3>

            {loadingDiscussions ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
                <span className="ml-3 text-gray-500">Searching for discussions...</span>
              </div>
            ) : discussions.length > 0 ? (
              <div className="space-y-4">
                {discussions.map((disc, idx) => (
                  <div key={idx} className="bg-gray-50 p-5 rounded-xl border border-gray-200 hover:border-orange-300 transition-all group">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 gap-2">
                      <a
                        href={disc.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-gray-900 group-hover:text-orange-700 text-lg leading-snug hover:underline"
                      >
                        {disc.title}
                      </a>
                      <span className="text-xs font-bold text-white bg-orange-500 px-2 py-1 rounded-full flex-shrink-0 self-start">
                        {disc.source}
                      </span>
                    </div>

                    {/* AI Analysis Section */}
                    {disc.analysis ? (
                      <div className="bg-white p-4 rounded-lg border border-orange-100 mb-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex items-center">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mr-2">AI Insight:</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold border ${disc.analysis.sentiment === 'Positive' ? 'bg-green-50 text-green-700 border-green-200' :
                              disc.analysis.sentiment === 'Negative' ? 'bg-red-50 text-red-700 border-red-200' :
                                'bg-gray-100 text-gray-700 border-gray-200'
                              }`}>
                              {disc.analysis.sentiment}
                            </span>
                          </div>
                        </div>

                        <p className="text-gray-800 text-sm mb-3 font-medium leading-relaxed">
                          {disc.analysis.summary}
                        </p>

                        {disc.analysis.key_points && disc.analysis.key_points.length > 0 && (
                          <div className="mt-2">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Key Takeaways:</span>
                            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                              {disc.analysis.key_points.map((point, i) => (
                                <li key={i} className="pl-1">{point}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mb-4 text-sm text-gray-500 italic">
                        No AI analysis available for this thread.
                      </div>
                    )}

                    {/* Raw Comments Section (Collapsible or just listed below) */}
                    {disc.comments && disc.comments.length > 0 && (
                      <div className="mt-4">
                        <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Relevant Comments</h5>
                        <div className="space-y-2">
                          {disc.comments.slice(0, 3).map((comment, cIdx) => (
                            <div key={cIdx} className="bg-white p-3 rounded border border-gray-100 text-sm text-gray-600 italic relative">
                              <span className="text-gray-300 absolute top-1 left-2 text-xl">"</span>
                              <p className="pl-4">{comment.length > 150 ? comment.substring(0, 150) + "..." : comment}</p>
                            </div>
                          ))}
                          {disc.comments.length > 3 && (
                            <p className="text-xs text-gray-400 italic pl-1">
                              + {disc.comments.length - 3} more comments
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 pt-3 border-t border-gray-200 flex justify-end">
                      <a
                        href={disc.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-orange-600 font-bold hover:text-orange-800 flex items-center transition-colors"
                      >
                        Read full discussion on Reddit <span className="ml-1">→</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-500 mb-2">No recent discussions found on Reddit.</p>
                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent((society || title) + " reviews reddit")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-600 font-bold hover:underline"
                >
                  Search manually on Google
                </a>
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Sidebar Info (Takes up 4/12 columns on XL screens) */}
        <div className="xl:col-span-4 space-y-8">

          {/* Safety & Rating Card */}
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 sticky top-28">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Safety & Insights</h3>

            <div className="mb-8">
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-600 flex items-center font-medium"><Shield className="w-5 h-5 mr-2 text-green-600" /> Safety Score</span>
                <span className="font-bold text-2xl text-green-600">{safety_score || "N/A"}/10</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="bg-green-600 h-3 rounded-full" style={{ width: `${(safety_score || 5) * 10}%` }}></div>
              </div>
              <p className="text-sm text-gray-400 mt-3">Based on AI analysis of crime data and locality safety.</p>
            </div>

            {/* Contact / Action Button */}
            <div className="space-y-4">
              {property.status === "booked" ? (
                <button
                  disabled
                  className="w-full bg-gray-300 text-gray-500 py-4 rounded-2xl font-bold text-lg cursor-not-allowed"
                >
                  Property Booked
                </button>
              ) : (
                <button
                  onClick={() => setShowBookingModal(true)}
                  className="w-full bg-black text-white py-4 rounded-2xl font-bold text-lg hover:bg-gray-800 transition shadow-lg transform hover:-translate-y-1"
                >
                  Book Now
                </button>
              )}

              {user?.role === "tenant" && (
                <button
                  onClick={handleSave}
                  className={`w-full py-4 rounded-2xl font-bold text-lg border-2 transition shadow-sm flex items-center justify-center gap-2 ${isSaved
                    ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`w-6 h-6 ${isSaved ? "fill-current" : "none"}`}
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {isSaved ? "Saved" : "Save Property"}
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
      {/* Booking Modal */}
      {showBookingModal && (
        <BookingModal
          property={property}
          onClose={() => setShowBookingModal(false)}
          user={user}
        />
      )}
    </div>
  );
}

function BookingModal({ property, onClose, user }) {
  const [step, setStep] = useState(1);

  // Defect Analysis State
  const [defectFiles, setDefectFiles] = useState([]);
  const [defectPreviews, setDefectPreviews] = useState([]);
  const [defectResult, setDefectResult] = useState(null);
  const [analyzingDefect, setAnalyzingDefect] = useState(false);

  // Agreement Analysis State
  const [agreementFile, setAgreementFile] = useState(null);
  const [agreementResult, setAgreementResult] = useState(null);
  const [analyzingAgreement, setAnalyzingAgreement] = useState(false);

  const [bookingLoading, setBookingLoading] = useState(false);


  const handleDefectFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setDefectFiles(files);
      const previews = files.map(file => URL.createObjectURL(file));
      setDefectPreviews(previews);
      setDefectResult(null);
    }
  };

  const handleAgreementFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAgreementFile(file);
      setAgreementResult(null);
    }
  };

  const analyzeDefect = async () => {
    if (defectFiles.length === 0) return;
    setAnalyzingDefect(true);
    const formData = new FormData();
    defectFiles.forEach(file => {
      formData.append("images", file);
    });

    try {
      const res = await API.post("/defects/analyze", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setDefectResult(res.data);
    } catch (err) {
      console.error("Defect analysis failed", err);
      alert("Analysis failed. Please try again.");
    } finally {
      setAnalyzingDefect(false);
    }
  };

  const analyzeAgreement = async () => {
    if (!agreementFile) return;
    setAnalyzingAgreement(true);
    const formData = new FormData();
    formData.append("agreement", agreementFile);

    try {
      const res = await API.post("/agreements/analyze", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAgreementResult(res.data);
    } catch (err) {
      console.error("Agreement analysis failed", err);
      alert("Analysis failed. Please try again.");
    } finally {
      setAnalyzingAgreement(false);
    }
  };

  const handleConfirmBooking = async () => {
    setBookingLoading(true);
    try {
      // Extract image URLs from defectResult if available
      const proofImages = defectResult && defectResult.results
        ? defectResult.results.map(r => r.image_url)
        : ["https://placehold.co/150?text=No+Image"];

      await API.post("/bookings", {
        propertyId: property._id,
        proofImage: proofImages,
        defectAnalysis: defectResult,
        agreementAnalysis: agreementResult ? agreementResult.analysis : null
      });


      setStep(5);
    } catch (err) {
      console.error("Booking failed", err);
      alert("Booking failed. Please try again.");
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-fadeIn max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center sticky top-0 z-10">
          <h3 className="font-bold text-lg">Book Property</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-black">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Progress Bar */}
          <div className="flex justify-between mb-8 relative">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10"></div>
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= s ? "bg-black text-white" : "bg-gray-200 text-gray-500"}`}>
                {s}
              </div>
            ))}
          </div>

          {/* STEP 1: Confirm Details */}
          {step === 1 && (
            <div className="space-y-4">
              <h4 className="text-xl font-bold">Confirm Details</h4>
              <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                <p className="text-sm text-gray-500">Property</p>
                <p className="font-medium">{property.title}</p>
                <p className="text-sm text-gray-500 mt-2">Price</p>
                <p className="font-bold text-lg">₹{property.price.toLocaleString()}</p>
              </div>
              <p className="text-sm text-gray-600">
                The booking process involves two AI verification steps:
                <br />1. <b>Defect Detection</b> (Condition Proof)
                <br />2. <b>Agreement Analysis</b> (Rental Contract)
              </p>
              <button onClick={() => setStep(2)} className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition">
                Start Process
              </button>
            </div>
          )}

          {/* STEP 2: Defect Detection */}
          {step === 2 && (
            <div className="space-y-6">
              <h4 className="text-xl font-bold">1. Defect Detection</h4>
              <p className="text-sm text-gray-600">Upload an image of the property's current condition.</p>

              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition cursor-pointer relative">
                <input type="file" accept="image/*" multiple onChange={handleDefectFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                {defectPreviews.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {defectPreviews.map((src, idx) => {
                      const resultItem = defectResult?.results?.[idx];
                      const analysis = resultItem?.analysis;
                      return (
                        <div key={idx} className="relative group">
                          <img src={src} alt={`Preview ${idx}`} className="h-24 w-full object-cover rounded-lg border border-gray-200" />
                          {analysis && (
                            <div className={`absolute bottom-0 left-0 right-0 p-1 text-[10px] uppercase tracking-wide font-bold text-white text-center rounded-b-lg backdrop-blur-md z-10 ${analysis.defect_detected ? "bg-red-600/90" : "bg-green-600/90"}`}>
                              {analysis.defect_detected ? analysis.defect_type : "Normal"}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-gray-400">
                    <div className="mx-auto h-12 w-12 mb-2">📷</div>
                    <p>Upload Condition Images (Select Multiple)</p>
                  </div>
                )}
              </div>

              {defectResult ? (
                <div className={`p-4 rounded-xl border ${defectResult.summary.defect_detected ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {defectResult.summary.defect_detected ? "⚠️ Defects Detected" : "✅ No Defects Found"}
                  </div>
                  {defectResult.summary.defect_detected && (
                    <p className="text-sm capitalize font-medium">
                      Types: {defectResult.summary.defect_types.join(", ")}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Analyzed {defectResult.summary.total_images} images</p>
                </div>
              ) : (
                <button
                  onClick={analyzeDefect}
                  disabled={defectFiles.length === 0 || analyzingDefect}
                  className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition disabled:opacity-50"
                >
                  {analyzingDefect ? "Analyzing..." : "Analyze Image"}
                </button>
              )}

              {defectResult && (
                <button onClick={() => setStep(3)} className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition">
                  Next Step
                </button>
              )}

              <button onClick={() => setStep(3)} className="w-full text-gray-500 text-sm hover:underline">
                Skip this step
              </button>
            </div>
          )}

          {/* STEP 3: Agreement Analysis */}
          {step === 3 && (
            <div className="space-y-6">
              <h4 className="text-xl font-bold">2. Agreement Analysis</h4>
              <p className="text-sm text-gray-600">Upload the rental agreement (PDF/Image) for risk analysis.</p>

              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition cursor-pointer relative">
                <input type="file" accept=".pdf,image/*" onChange={handleAgreementFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                {agreementFile ? (
                  <div className="text-gray-600 font-medium flex flex-col items-center">
                    <span className="text-4xl mb-2">📄</span>
                    {agreementFile.name}
                  </div>
                ) : (
                  <div className="text-gray-400">
                    <div className="mx-auto h-12 w-12 mb-2">📄</div>
                    <p>Upload Agreement</p>
                  </div>
                )}
              </div>

              {agreementResult && agreementResult.analysis ? (
                <div className="p-4 rounded-xl border bg-blue-50 border-blue-200">
                  <p className="font-bold text-blue-700">Risk Score: {agreementResult.analysis.risk_score}/10</p>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{agreementResult.analysis.summary}</p>
                  {agreementResult.analysis.unfair_clauses && agreementResult.analysis.unfair_clauses.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-bold text-red-600">Unfair Clauses:</p>
                      <ul className="list-disc list-inside text-xs text-red-500">
                        {agreementResult.analysis.unfair_clauses.slice(0, 2).map((clause, i) => (
                          <li key={i}>{clause}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={analyzeAgreement}
                  disabled={!agreementFile || analyzingAgreement}
                  className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition disabled:opacity-50"
                >
                  {analyzingAgreement ? "Analyzing..." : "Analyze Agreement"}
                </button>
              )}

              {agreementResult && (
                <button onClick={() => setStep(4)} className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition">
                  Next Step
                </button>
              )}

              <button onClick={() => setStep(4)} className="w-full text-gray-500 text-sm hover:underline">
                Skip this step
              </button>
            </div>
          )}

          {/* STEP 4: Final Review */}
          {step === 4 && (
            <div className="space-y-4">
              <h4 className="text-xl font-bold">Review & Confirm</h4>

              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <span className="text-xs font-bold text-gray-500 uppercase">Defect Analysis</span>
                  {defectResult ? (
                    <div className={defectResult.summary.defect_detected ? "text-red-600 font-bold" : "text-green-600 font-bold"}>
                      {defectResult.summary.defect_detected ? `⚠️ ${defectResult.summary.defect_types.join(", ")}` : "✅ No Defects"}
                    </div>
                  ) : (
                    <div className="text-gray-400 text-sm">Skipped</div>
                  )}
                </div>

                <div className="p-3 bg-gray-50 rounded-lg border">
                  <span className="text-xs font-bold text-gray-500 uppercase">Agreement Analysis</span>
                  {agreementResult && agreementResult.analysis ? (
                    <div className="text-blue-600 font-bold">
                      Risk Score: {agreementResult.analysis.risk_score}/10
                    </div>
                  ) : (
                    <div className="text-gray-400 text-sm">Skipped</div>
                  )}
                </div>
              </div>

              <button
                onClick={handleConfirmBooking}
                disabled={bookingLoading}
                className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition disabled:opacity-50"
              >
                {bookingLoading ? "Confirming..." : "Confirm Booking"}
              </button>
            </div>
          )}

          {/* STEP 5: Success */}
          {step === 5 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="text-2xl font-bold mb-2">Booking Confirmed!</h4>
              <p className="text-gray-500 mb-6">Your booking request has been sent to the owner along with the analysis reports.</p>
              <button onClick={onClose} className="w-full bg-gray-100 text-gray-900 py-3 rounded-xl font-bold hover:bg-gray-200 transition">
                Close
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
