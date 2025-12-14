import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";
import API from "../utils/api";

export default function SavedProperties() {
    const { token } = useContext(AuthContext);
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSavedProperties = async () => {
            try {
                const res = await API.get("/auth/saved");
                setProperties(res.data);
            } catch (error) {
                console.error("Error fetching saved properties:", error);
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchSavedProperties();
        }
    }, [token]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Saved Properties</h1>
                <p className="text-gray-500 mt-1">Properties you have shortlisted.</p>
            </div>

            {properties.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No saved properties</h3>
                    <p className="text-gray-500 mt-1 mb-6">Browse properties and save the ones you like!</p>
                    <Link
                        to="/properties"
                        className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition"
                    >
                        Browse Properties
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {properties.map((property) => (
                        <div key={property._id} className="bg-white rounded-2xl overflow-hidden shadow-sm border hover:shadow-md transition group">
                            <div className="relative h-64 overflow-hidden">
                                <img
                                    src={
                                        property.images && property.images.length > 0
                                            ? (property.images[0].startsWith("http")
                                                ? property.images[0]
                                                : `http://localhost:5000${property.images[0]}`)
                                            : "https://placehold.co/400x300?text=No+Image"
                                    }
                                    alt={property.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                                />
                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-gray-900">
                                    ₹{property.price.toLocaleString()}
                                </div>
                            </div>
                            <div className="p-5">
                                <h3 className="text-xl font-bold text-gray-900 mb-2 truncate">{property.title}</h3>
                                <p className="text-gray-500 text-sm mb-4 line-clamp-2">{property.description}</p>

                                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                                    <div className="flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                        {property.bhk || "2 BHK"}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                        </svg>
                                        {property.area || "1200 sqft"}
                                    </div>
                                </div>

                                <Link
                                    to={`/property/${property._id}`}
                                    className="block w-full text-center py-2.5 bg-gray-50 text-gray-900 font-medium rounded-xl hover:bg-gray-100 transition"
                                >
                                    View Details
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
