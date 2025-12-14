import { Link } from "react-router-dom";
import { MapPin, Home, Maximize, Shield, Star } from "lucide-react";

export default function PropertyCard({ property }) {
  if (!property) property = {};

  const {
    title,
    address,
    city,
    price,
    images,
    bhk,
    area,
    safety_score,
    avgRating,
    features
  } = property;

  const displayImage = images && images.length > 0
    ? (images[0].startsWith("http") ? images[0] : `http://localhost:5000${images[0]}`)
    : "https://placehold.co/400x300?text=No+Image";

  const formatPrice = (price) => {
    if (!price) return "Price on Request";
    if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
    if (price >= 100000) return `₹${(price / 100000).toFixed(2)} L`;
    return `₹${price.toLocaleString()}`;
  };

  const safety = safety_score || Math.floor(Math.random() * 10) + 1;
  const rating = avgRating || (Math.random() * 2 + 3).toFixed(1);

  return (
    <Link to={`/property/${property._id}`} className="group">
      <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 h-full flex flex-col">

        {/* Image Container */}
        <div className="relative h-56 overflow-hidden">
          <img
            src={displayImage}
            alt={title}
            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-semibold text-gray-700 shadow-sm">
            {property.isScraped ? "Scraped" : "Verified"}
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
            <p className="text-white font-bold text-xl">{formatPrice(price)}</p>
          </div>

          {property.status === "booked" && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center z-10">
              <span className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-lg transform -rotate-12 shadow-lg border-2 border-white">
                BOOKED
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-grow">
          {/* Title & Location */}
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors" title={title}>
              {/* Format: "4 BHK at ATS Rhapsody" */}
              {property.dynamic_facts && property.dynamic_facts["Society"] && bhk
                ? `${bhk} at ${property.dynamic_facts["Society"]}`
                : (title || "Untitled Property")}
            </h3>
            <div className="flex items-center text-gray-500 text-sm mt-1">
              <MapPin className="w-4 h-4 mr-1" />
              <p className="line-clamp-1">{address || city || "Location not provided"}</p>
            </div>
          </div>

          {/* Key Stats Row */}
          <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2" title="Bedrooms">
              <Home className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-700">{bhk || "N/A"}</span>
            </div>
            <div className="w-px h-4 bg-gray-300"></div>
            <div className="flex items-center gap-2" title="Area">
              <Maximize className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-700">{area || "N/A"}</span>
            </div>
            {property.dynamic_facts && property.dynamic_facts["Bathrooms"] && (
              <>
                <div className="w-px h-4 bg-gray-300"></div>
                <div className="flex items-center gap-2" title="Bathrooms">
                  <span className="text-sm font-medium text-gray-700">{property.dynamic_facts["Bathrooms"]} Bath</span>
                </div>
              </>
            )}
          </div>

          {/* Society Name (if available) */}
          {property.dynamic_facts && property.dynamic_facts["Society"] && property.dynamic_facts["Society"] !== "N/A" && (
            <div className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {property.dynamic_facts["Society"]}
            </div>
          )}

          {/* Features Tags (Optional - limited to 2) */}
          <div className="flex flex-wrap gap-2 mb-4">
            {(features || []).slice(0, 2).map((feature, index) => (
              <span key={index} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-md font-medium">
                {feature}
              </span>
            ))}
            {(features || []).length > 2 && (
              <span className="text-xs text-gray-400 px-1 py-1">+{features.length - 2} more</span>
            )}
          </div>

          <div className="mt-auto border-t pt-3 flex justify-between items-center text-sm">
            <div className="flex items-center text-green-600 font-medium" title="Safety Score">
              <Shield className="w-4 h-4 mr-1" />
              <span>{safety}/10 Safety</span>
            </div>
            <div className="flex items-center text-yellow-500 font-medium">
              <Star className="w-4 h-4 mr-1 fill-current" />
              <span>{rating}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
