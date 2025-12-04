import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../utils/api";

export default function PropertyDetail() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);

  // Carousel index
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const res = await API.get(`/properties/${id}`);

        // ensure images array works even if comma-separated string
        const images =
          Array.isArray(res.data.images)
            ? res.data.images
            : res.data.images?.split(",").map((url) => url.trim());

        setProperty({ ...res.data, images });
      } catch (err) {
        console.error("Error fetching property:", err);
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

  const images = property.images || [];

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">

      {/* ----------------------------------------------------------
          IMAGE CAROUSEL (supports multiple comma-separated URLs)
      ----------------------------------------------------------- */}
      <div className="relative w-full h-72 md:h-96 rounded-xl overflow-hidden shadow mb-10">
        <img
          src={images[currentImage]}
          alt="Property"
          className="w-full h-full object-cover transition-all duration-500"
        />

        {/* LEFT ARROW */}
        {images.length > 1 && (
          <button
            onClick={() =>
              setCurrentImage(
                currentImage === 0 ? images.length - 1 : currentImage - 1
              )
            }
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white px-3 py-2 rounded-full"
          >
            ‹
          </button>
        )}

        {/* RIGHT ARROW */}
        {images.length > 1 && (
          <button
            onClick={() =>
              setCurrentImage((currentImage + 1) % images.length)
            }
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white px-3 py-2 rounded-full"
          >
            ›
          </button>
        )}

        {/* DOTS */}
        {images.length > 1 && (
          <div className="absolute bottom-4 w-full flex justify-center gap-2">
            {images.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 w-2 rounded-full ${
                  idx === currentImage ? "bg-white" : "bg-white/50"
                }`}
              ></div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

        {/* LEFT SIDE: TITLE, PRICE, FEATURES, DESCRIPTION, REVIEWS */}
        <div className="lg:col-span-2">

          {/* TITLE */}
          <h1 className="text-4xl font-bold mb-2 capitalize">
            {property.title}
          </h1>

          {/* LOCATION */}
          <p className="text-gray-600 flex items-center gap-2 mb-4">
            📍 {property.address}, {property.city}, {property.state}
          </p>

          {/* PRICE + RATING */}
          <div className="flex items-center gap-4 mb-6">
            <p className="text-3xl font-semibold">
              ₹{property.price?.toLocaleString()}/month
            </p>

            <span className="flex items-center gap-1 text-gray-700">
              ⭐ {property.safety_score || "N/A"}
            </span>
          </div>

          {/* FEATURES */}
          <h2 className="text-xl font-semibold mb-3">Features</h2>
          <div className="flex flex-wrap gap-2 mb-8">
            {property.features?.length > 0 ? (
              property.features.map((f, i) => (
                <span
                  key={i}
                  className="bg-gray-100 px-3 py-1 rounded-full text-sm"
                >
                  {f}
                </span>
              ))
            ) : (
              <p className="text-gray-500">No features listed.</p>
            )}
          </div>

          {/* DESCRIPTION */}
          <div className="bg-white p-6 rounded-xl shadow-sm border mb-10">
            <h2 className="text-xl font-semibold mb-2">Description</h2>
            <p className="text-gray-700 leading-relaxed">
              {property.description}
            </p>
          </div>

          {/* REVIEWS */}
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-xl font-semibold mb-4">
              Reviews ({property.reviews?.length || 0})
            </h2>

            {property.reviews?.length > 0 ? (
              property.reviews.map((r, i) => (
                <div key={i} className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <p className="italic">“{r.comment}”</p>
                  <p className="text-sm text-gray-500 mt-2">
                    — {r.user || "Anonymous"}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-6">No reviews yet.</p>
            )}
          </div>
        </div>

        {/* RIGHT SIDE: OWNER + PAYMENT */}
        <div className="space-y-6">

          {/* OWNER CARD */}
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="font-semibold text-lg mb-4">Owner Details</h3>
            <p className="flex items-center gap-2 font-medium">
              👤 {property.owner?.name || "Not provided"}
            </p>
            <p className="text-gray-600">{property.owner?.email}</p>
          </div>

          {/* PAYMENT CARD */}
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="text-lg font-semibold mb-1">Payment</h3>
            <p className="text-gray-600 mb-4">
              Secure your booking with a deposit payment
            </p>

            <button className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-900 transition">
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
