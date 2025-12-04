import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../utils/api";

export default function PropertyDetail() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const res = await API.get(`/properties/${id}`);
        setProperty(res.data);
      } catch (error) {
        console.error("Error fetching property:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [id]);

  if (loading)
    return <p className="text-center py-10 text-gray-500">Loading property...</p>;

  if (!property)
    return <p className="text-center py-10 text-gray-500">Property not found.</p>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* HERO IMAGE */}
      <div className="w-full h-72 md:h-96 rounded-xl overflow-hidden shadow-sm mb-8">
        <img
          src={property.images?.[0] || property.images || property.image}
          alt={property.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* MAIN CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

        {/* Left Content */}
        <div className="lg:col-span-2 space-y-8">

          {/* TITLE + LOCATION */}
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              {property.title}
            </h1>

            <p className="text-gray-500 mt-2 flex items-center gap-2">
              📍 {property.address}, {property.city}
            </p>

            {/* PRICE */}
            <p className="text-4xl font-bold text-gray-900 mt-4">
              ₹{property.price?.toLocaleString()}/month
            </p>

            {/* RATING */}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-yellow-500 text-xl">⭐</span>
              <span className="font-medium text-gray-700">N/A</span>
              <span className="text-gray-500">(0 reviews)</span>
            </div>
          </div>

          {/* FEATURES */}
          <div>
            <h2 className="text-xl font-semibold mb-2">Features</h2>

            <div className="flex flex-wrap gap-2">
              {property.features?.length > 0 ? (
                property.features.map((feature, i) => (
                  <span
                    key={i}
                    className="px-4 py-1 rounded-full bg-gray-100 text-gray-700 text-sm shadow-sm"
                  >
                    {feature}
                  </span>
                ))
              ) : (
                <p className="text-gray-500">No features listed.</p>
              )}
            </div>
          </div>

          {/* DESCRIPTION */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-3">Description</h2>
            <p className="text-gray-700 leading-relaxed">
              {property.description || "No description available."}
            </p>
          </div>

          {/* REVIEWS */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">Reviews (0)</h2>

            <div className="text-center text-gray-500 py-6">
              No reviews yet.
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-8">

          {/* OWNER DETAILS */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Owner Details</h3>

            <p className="font-medium text-gray-900 flex items-center gap-2">
              👤 {property.owner?.name || "Owner"}
            </p>
            <p className="text-gray-500 mt-1">
              {property.owner?.email || "owner@example.com"}
            </p>
          </div>

          {/* PAYMENT CARD */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-2">Payment</h3>
            <p className="text-gray-600 mb-4">
              Secure your booking with a deposit payment
            </p>

            <button className="w-full bg-gray-900 hover:bg-black text-white font-semibold py-3 rounded-lg transition">
              Pay Deposit ₹{property.price?.toLocaleString()}
            </button>

            <p className="text-xs text-gray-500 text-center mt-2">
              Powered by Stripe • Secure Payment
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
