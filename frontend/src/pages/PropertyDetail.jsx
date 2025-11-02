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
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* 🏠 Image Section */}
      <img
        src={property.images?.[0] || property.image}
        alt={property.title}
        className="w-full h-80 object-cover rounded-xl shadow"
      />

      {/* 🏷️ Title & Location */}
      <h1 className="text-3xl font-bold mt-6 text-gray-800">{property.title}</h1>
      <p className="text-gray-500 mt-1">
        {property.address}, {property.city}
      </p>

      {/* 💰 Price */}
      <p className="text-blue-600 font-bold text-2xl mt-4">
        ₹{property.price}/month
      </p>

      <div className="border-t my-6"></div>

      {/* 📝 Description */}
      <div className="mt-4">
        <h2 className="text-xl font-semibold">Description</h2>
        <p className="text-gray-700 mt-2 leading-relaxed">
          {property.description ||
            "Spacious, well-lit flat in a great neighborhood. Perfect for working professionals or families looking for comfort and convenience."}
        </p>
      </div>

      {/* 🧩 Features (✅ from backend) */}
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Features</h2>
        <div className="flex flex-wrap gap-2">
          {property.features && property.features.length > 0 ? (
            property.features.map((feature, i) => (
              <span
                key={i}
                className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full"
              >
                {feature}
              </span>
            ))
          ) : (
            <p className="text-gray-500">No features listed.</p>
          )}
        </div>
      </div>

      {/* 🛡️ Safety Score */}
      {property.safety_score !== null && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Safety Score</h2>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full ${
                property.safety_score >= 7
                  ? "bg-green-500"
                  : property.safety_score >= 4
                  ? "bg-yellow-400"
                  : "bg-red-500"
              }`}
              style={{ width: `${(property.safety_score / 10) * 100}%` }}
            ></div>
          </div>
          <p className="text-gray-600 mt-2">
            {property.safety_score}/10 – Based on AI safety analysis
          </p>
        </div>
      )}

      {/* 💬 Reviews */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-3">User Reviews</h2>
        {property.reviews && property.reviews.length > 0 ? (
          property.reviews.map((review, i) => (
            <div
              key={i}
              className="bg-gray-50 p-4 rounded-lg shadow-sm mb-3 border"
            >
              <p className="italic text-gray-700">“{review.comment}”</p>
              <p className="text-sm text-gray-500 mt-2">
                – {review.user || "Anonymous"}
              </p>
            </div>
          ))
        ) : (
          <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
            <p className="italic text-gray-600">
              “Peaceful area, near market and metro. Safe for families.”
            </p>
            <p className="text-sm text-gray-500 mt-2">– A Verified Tenant</p>
          </div>
        )}
      </div>
    </div>
  );
}
