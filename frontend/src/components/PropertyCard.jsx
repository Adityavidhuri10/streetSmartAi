export default function PropertyCard({ property }) {
  // Default safety_score and rating for demo
  const safetyScore = property.safety_score || Math.floor(Math.random() * 10) + 1;
  const avgRating = property.avgRating || (Math.random() * 5).toFixed(1);

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition duration-300">
      {/* Image */}
      <img
        src={property.image}
        alt={property.title}
        className="h-48 w-full object-cover"
      />

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800">{property.title}</h3>
        <p className="text-gray-500 text-sm">{property.location}</p>

        {/* Price */}
        <p className="text-blue-600 font-bold mt-2 text-lg">
          ₹{property.price}/month
        </p>

        {/* Tags */}
        <div className="mt-3 flex flex-wrap gap-2">
          {property.tags.map((tag, index) => (
            <span
              key={index}
              className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t mt-4 mb-3"></div>

        {/* Safety & Rating Row */}
        <div className="flex justify-between items-center text-sm">
          {/* Safety Score */}
          <div className="w-1/2">
            <p className="text-gray-600 mb-1">Safety Score</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  safetyScore >= 7
                    ? "bg-green-500"
                    : safetyScore >= 4
                    ? "bg-yellow-400"
                    : "bg-red-500"
                }`}
                style={{ width: `${(safetyScore / 10) * 100}%` }}
              ></div>
            </div>
            <p className="text-gray-500 mt-1 text-xs">{safetyScore}/10</p>
          </div>

          {/* Rating */}
          <div className="text-right w-1/2">
            <p className="text-gray-600 mb-1">Rating</p>
            <p className="font-semibold text-yellow-500 text-base">
              ★ {avgRating}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
