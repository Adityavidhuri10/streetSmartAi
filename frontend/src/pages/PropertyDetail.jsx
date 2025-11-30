import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../utils/api";

export default function PropertyDetail() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch property by ID (from backend)
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

  if (loading)
    return <p className="text-center py-20 text-gray-500">Loading property...</p>;

  if (!property)
    return <p className="text-center py-20 text-gray-500">Property not found.</p>;

  return (
  <div className="max-w-6xl mx-auto px-6 py-10 animate-fadeIn">

    {/* 🏠 Image Section with subtle zoom */}
    <div className="overflow-hidden rounded-2xl shadow-xl">
      <img
        src={property.images?.[0] || property.image}
        alt={property.title}
        className="w-full h-[400px] object-cover transition-transform duration-500 hover:scale-105"
      />
    </div>

    {/* Title & Location */}
    <div className="mt-6">
      <h1 className="text-4xl font-extrabold text-gray-900">
        {property.title}
      </h1>
      <p className="text-gray-500 mt-1 text-lg">
        📍 {property.address}, {property.city}
      </p>
    </div>

    {/* Price Card */}
    <div className="mt-4 bg-gradient-to-r from-black via-gray-900 to-black text-white px-6 py-4 rounded-xl shadow-lg inline-block">
      <p className="text-3xl font-semibold">₹{property.price}/month</p>
    </div>

    <div className="border-t mt-8 mb-6"></div>

    {/* Description */}
    <div className="mt-4">
      <h2 className="text-2xl font-semibold mb-2">Description</h2>
      <p className="text-gray-700 leading-relaxed text-lg">
        {property.description ||
          "Spacious, well-lit flat in a great neighborhood. Perfect for working professionals or families looking for comfort and convenience."}
      </p>
    </div>

    {/* Features */}
    <div className="mt-8">
      <h2 className="text-2xl font-semibold mb-3">Features</h2>
      <div className="flex flex-wrap gap-3">
        {property.features && property.features.length > 0 ? (
          property.features.map((feature, i) => (
            <span
              key={i}
              className="px-4 py-2 bg-white/70 backdrop-blur-sm shadow text-gray-800 rounded-full text-sm border hover:bg-black hover:text-white transition"
            >
              {feature}
            </span>
          ))
        ) : (
          <p className="text-gray-500">No features listed.</p>
        )}
      </div>
    </div>

    {/* Safety Score */}
    {property.safety_score !== null && (
      <div className="mt-10">
        <h2 className="text-2xl font-semibold mb-3">Safety Score</h2>

        <div className="relative w-full bg-gray-200 h-4 rounded-full overflow-hidden">
          <div
            className={`h-4 transition-all duration-700 ${
              property.safety_score >= 7
                ? "bg-green-500"
                : property.safety_score >= 4
                ? "bg-yellow-400"
                : "bg-red-500"
            }`}
            style={{ width: `${(property.safety_score / 10) * 100}%` }}
          ></div>
        </div>
        <p className="mt-2 text-gray-600 text-lg">
          {property.safety_score}/10 — AI Safety Index
        </p>
      </div>
    )}

    {/* Reviews Section */}
    <div className="mt-12">
      <h2 className="text-2xl font-semibold mb-4">User Reviews</h2>

      {property.reviews && property.reviews.length > 0 ? (
        property.reviews.map((review, i) => (
          <div
            key={i}
            className="p-5 mb-4 rounded-xl bg-white/60 backdrop-blur shadow border hover:shadow-xl transition"
          >
            <p className="italic text-gray-700 text-lg">“{review.comment}”</p>
            <p className="text-sm text-gray-500 mt-2">— {review.user || "Anonymous"}</p>
          </div>
        ))
      ) : (
        <div className="p-6 rounded-xl bg-white/60 backdrop-blur shadow border">
          <p className="italic text-gray-700 text-lg">
            “Peaceful area, near market and metro. Safe for families.”
          </p>
          <p className="text-sm text-gray-500 mt-2">— A Verified Tenant</p>
        </div>
      )}
    </div>
  </div>
);

}
