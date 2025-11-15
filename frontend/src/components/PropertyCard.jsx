import { Link } from "react-router-dom";

export default function PropertyCard({ property }) {
  property = property || {};
  const tags = property.tags || [];

  const safetyScore =
    property.safety_score || Math.floor(Math.random() * 10) + 1;
  const avgRating = property.avgRating || (Math.random() * 5).toFixed(1);

  return (
    <Link to={`/property/${property._id}`}>
      <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition duration-300">

        <img
          src={(property.images && property.images[0]) || "https://via.placeholder.com/400"}
          alt={property.title}
          className="h-48 w-full object-cover"
        />

        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-800">{property.title}</h3>
          <p className="text-gray-500 text-sm">{property.location}</p>

          <p className="text-blue-600 font-bold mt-2 text-lg">
            ₹{property.price}/month
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
              >
                {feature}
              </span>
            ))}
          </div>

          <div className="border-t mt-3 mb-2" />

          <div className="flex justify-between items-center text-sm">
            <p className="text-gray-500">Safety: {safetyScore}/10</p>
            <p className="text-yellow-500 font-semibold">★ {avgRating}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
