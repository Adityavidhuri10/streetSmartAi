import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link, useLocation } from "react-router-dom";
import API from "../utils/api";

export default function MyProperties() {
    const { token } = useContext(AuthContext);
    const [properties, setProperties] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [activeTab, setActiveTab] = useState("properties"); // 'properties' or 'bookings'
    const [selectedProofImages, setSelectedProofImages] = useState(null);

    const fetchProperties = async () => {
        try {
            const res = await API.get("/properties/myproperties");
            setProperties(res.data);
        } catch (error) {
            console.error("Error fetching properties:", error);
        }
    };

    const fetchBookings = async () => {
        try {
            const res = await API.get("/bookings/landlord");
            setBookings(res.data);
        } catch (error) {
            console.error("Error fetching bookings:", error);
        }
    };

    const location = useLocation();

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            if (token) {
                await Promise.all([fetchProperties(), fetchBookings()]);
            }
            setLoading(false);
        };
        loadData();

        // Check if we should switch to bookings tab (from notification)
        if (location.state?.tab === "bookings") {
            setActiveTab("bookings");
        }
    }, [token, location.state]);

    const handleCreateFake = async () => {
        setCreating(true);
        try {
            const res = await API.post("/properties/fake");
            if (res.status === 201) {
                await fetchProperties(); // Refresh list
            } else {
                alert("Failed to create fake listing.");
            }
        } catch (error) {
            console.error("Error creating fake property:", error);
        } finally {
            setCreating(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
            </div>
        );
    }



    return (
        <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Landlord Dashboard</h1>
                    <p className="text-gray-500 mt-1">Manage your properties and view bookings</p>
                </div>

                {activeTab === "properties" && (
                    <button
                        onClick={handleCreateFake}
                        disabled={creating}
                        className="px-5 py-2.5 bg-black text-white rounded-xl hover:bg-gray-800 transition shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {creating ? "Generating..." : "Create Fake Listing"}
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex space-x-4 mb-8 border-b">
                <button
                    onClick={() => setActiveTab("properties")}
                    className={`pb-3 px-4 font-medium transition-colors relative ${activeTab === "properties" ? "text-black" : "text-gray-500 hover:text-black"}`}
                >
                    My Properties
                    {activeTab === "properties" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-black"></div>}
                </button>
                <button
                    onClick={() => setActiveTab("bookings")}
                    className={`pb-3 px-4 font-medium transition-colors relative ${activeTab === "bookings" ? "text-black" : "text-gray-500 hover:text-black"}`}
                >
                    Bookings & Requests
                    {bookings.length > 0 && (
                        <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{bookings.length}</span>
                    )}
                    {activeTab === "bookings" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-black"></div>}
                </button>
            </div>

            {activeTab === "properties" ? (
                /* Properties Grid */
                properties.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                        <h3 className="text-lg font-medium text-gray-900">No properties listed</h3>
                        <button onClick={handleCreateFake} className="mt-4 px-4 py-2 bg-black text-white rounded-lg">Generate Demo Listing</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {properties.map((property) => (
                            <div key={property._id} className="bg-white rounded-2xl overflow-hidden shadow-sm border hover:shadow-md transition group relative">
                                {property.status === "booked" && (
                                    <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold z-10 shadow-sm">
                                        BOOKED
                                    </div>
                                )}
                                <div className="relative h-64 overflow-hidden">
                                    <img
                                        src={property.images[0] ? (property.images[0].startsWith("http") ? property.images[0] : `http://localhost:5000${property.images[0]}`) : "https://placehold.co/400x300?text=No+Image"}
                                        alt={property.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                                    />
                                </div>
                                <div className="p-5">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2 truncate">{property.title}</h3>
                                    <p className="text-gray-500 text-sm mb-4 line-clamp-2">{property.description}</p>
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-lg">₹{property.price.toLocaleString()}</span>
                                        <Link to={`/property/${property._id}`} className="text-blue-600 font-medium hover:underline">View Details</Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            ) : (
                /* Bookings List */
                bookings.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                        <h3 className="text-lg font-medium text-gray-900">No bookings yet</h3>
                        <p className="text-gray-500 mt-1">When tenants book your properties, they will appear here.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {bookings.map((booking) => (
                            <div key={booking._id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-8">
                                {/* Property Info */}
                                <div className="lg:w-1/3 flex gap-4">
                                    <img
                                        src={booking.property?.images?.[0] ? (booking.property.images[0].startsWith("http") ? booking.property.images[0] : `http://localhost:5000${booking.property.images[0]}`) : "https://placehold.co/150?text=No+Image"}
                                        alt={booking.property?.title}
                                        className="w-24 h-24 rounded-xl object-cover"
                                    />
                                    <div>
                                        <h3 className="font-bold text-gray-900 line-clamp-1">{booking.property?.title}</h3>
                                        <p className="text-sm text-gray-500">{booking.property?.address}</p>
                                        <div className="mt-2 text-sm">
                                            <span className="text-gray-500">Tenant:</span> <span className="font-medium">{booking.user?.name}</span>
                                            <br />
                                            <span className="text-gray-500">Email:</span> <span className="font-medium">{booking.user?.email}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Analysis Results */}
                                <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Defect Analysis */}
                                    <div className={`p-4 rounded-xl border ${booking.defectAnalysis?.summary?.defect_detected ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="text-xs font-bold uppercase opacity-70">Condition Proof</h4>
                                            {booking.proofImage && booking.proofImage.length > 0 && (
                                                <button
                                                    onClick={() => setSelectedProofImages({
                                                        images: booking.proofImage,
                                                        results: booking.defectAnalysis?.results || []
                                                    })}
                                                    className="text-xs text-blue-600 hover:underline font-bold"
                                                >
                                                    View Images
                                                </button>
                                            )}
                                        </div>
                                        {booking.defectAnalysis ? (
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    {booking.defectAnalysis.summary?.defect_detected ? "⚠️ Defect Detected" : "✅ No Defects"}
                                                </div>
                                                {booking.defectAnalysis.summary?.defect_detected && (
                                                    <p className="text-sm text-gray-700">Type: {booking.defectAnalysis.summary?.defect_types?.join(", ")}</p>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 text-sm">Not provided</span>
                                        )}
                                    </div>

                                    {/* Agreement Analysis */}
                                    <div className="p-4 rounded-xl border bg-blue-50 border-blue-200">
                                        <h4 className="text-xs font-bold uppercase mb-2 opacity-70">Agreement Analysis</h4>
                                        {booking.agreementAnalysis ? (
                                            <div>
                                                <p className="font-bold text-blue-700">Risk Score: {booking.agreementAnalysis.risk_score}/100</p>
                                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">{booking.agreementAnalysis.summary}</p>
                                                {booking.agreementAnalysis.flagged_clauses?.length > 0 && (
                                                    <p className="text-xs text-red-600 mt-1 font-medium">{booking.agreementAnalysis.flagged_clauses.length} clauses flagged</p>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 text-sm">Not provided</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}

            {/* Image Modal */}
            {selectedProofImages && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setSelectedProofImages(null)}>
                    <div className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Condition Proof Images</h3>
                            <button onClick={() => setSelectedProofImages(null)} className="text-gray-500 hover:text-black">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {selectedProofImages.images.map((img, idx) => {
                                const result = selectedProofImages.results[idx];
                                const isDefect = result?.analysis?.defect_detected;
                                const defectType = result?.analysis?.defect_type || "Normal";

                                return (
                                    <div key={idx} className="relative rounded-lg overflow-hidden border group">
                                        <img
                                            src={img.startsWith("http") ? img : `http://localhost:5000${img}`}
                                            alt={`Proof ${idx + 1}`}
                                            className="w-full h-48 object-cover transition duration-300"
                                        />
                                        <div className={`absolute bottom-0 left-0 right-0 px-3 py-2 text-xs font-bold text-white ${isDefect ? "bg-red-600/90" : "bg-green-600/90"}`}>
                                            {defectType}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
