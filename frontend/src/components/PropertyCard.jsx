import { AuthContext } from "../context/AuthContext";
import API from "../utils/api";
import { useContext } from "react";
import { Link } from "react-router-dom";

export default function PropertyCard({ property }) {
  const { user, token } = useContext(AuthContext);

  const handleDelete = async () => {
  if (!window.confirm("Are you sure you want to delete this property?")) return;

  try {
    await API.delete(`/properties/${property._id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    alert("Property deleted successfully!");
    window.location.reload();
  } catch (err) {
    console.error(err);
    alert("Failed to delete property.");
  }
};


  return (
    <div className="bg-white rounded-2xl shadow-md p-4 hover:shadow-xl transition">

      {/* Property Image */}
      <Link to={`/property/${property._id}`}>
        <img
          src={property.images?.[0] || "/placeholder.jpg"}
          alt={property.title}
          className="w-full h-48 object-cover rounded-xl mb-4"
        />
      </Link>

      {/* Title */}
      <h2 className="text-lg font-semibold text-gray-900 mb-1">
        {property.title}
      </h2>

      {/* Address */}
      <p className="text-sm text-gray-500">
        {property.address}, {property.city}, {property.state}
      </p>

      {/* Price */}
      <p className="text-xl font-bold mt-2">
        ₹{property.price}/month
      </p>

      {/* Features */}
      <div className="mt-2 flex flex-wrap gap-2">
        {property.features?.slice(0, 3).map((f, i) => (
          <span
            key={i}
            className="text-xs bg-gray-100 px-2 py-1 rounded-md text-gray-700"
          >
            {f}
          </span>
        ))}
      </div>

      {/* Safety score */}
      <p className="text-sm text-gray-600 mt-2">
        Safety: {property.safety_score}/10 ⭐
      </p>

      {/* DELETE BUTTON — ONLY IF YOU ARE THE OWNER */}
     {user?._id === property.owner?._id && (
  <button
    onClick={handleDelete}
    className="mt-3 px-3 py-1.5 text-sm rounded-md 
               bg-neutral-200 text-neutral-700 
               hover:bg-neutral-300 transition border border-neutral-300"
  >
    Delete
  </button>
)}

    </div>
  );
}
