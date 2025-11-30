import { useState, useContext } from "react";
import API from "../utils/api";
import { AuthContext } from "../context/AuthContext";

export default function AddProperty() {
  const { user, token } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    address: "",
    city: "",
    state: "",
    features: "",
    images: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const featuresArray = formData.features
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean);

      const imagesArray = formData.images
        .split(",")
        .map((i) => i.trim())
        .filter(Boolean);

      const newProperty = {
        ...formData,
        price: Number(formData.price),
        features: featuresArray,
        images: imagesArray,
        safety_score: Math.floor(Math.random() * 10) + 1,
        owner: user?._id,
      };

      await API.post("/properties", newProperty, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMessage("✅ Property added successfully!");
      setFormData({
        title: "",
        description: "",
        price: "",
        address: "",
        city: "",
        state: "",
        features: "",
        images: "",
      });
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to add property.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 animate-fadeIn">

      {/* HEADER */}
      <div className="text-center mb-10">
        <div className="mx-auto w-16 h-16 flex items-center justify-center bg-black text-white rounded-2xl shadow-md">
          {/* Outline house icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-9 h-9"
            fill="none"
            viewBox="0 0 24 24"
            stroke="white"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 12l9-9 9 9M4 10v10a1 1 0 001 1h4m10-11v10a1 1 0 01-1 1h-4m-6 0h6"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-bold mt-5 text-gray-800 tracking-tight">
          Add New Property
        </h1>
      </div>

      {/* CARD FORM CONTAINER */}
      <div className="bg-white/80 backdrop-blur-xl shadow-lg rounded-2xl p-8 border">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Title */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="input-modern"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              rows="4"
              value={formData.description}
              onChange={handleChange}
              required
              className="input-modern"
            ></textarea>
          </div>

          {/* Price */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">Price (₹/month)</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
              className="input-modern"
            />
          </div>

          {/* ADDRESS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                className="input-modern"
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                className="input-modern"
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">State</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                required
                className="input-modern"
              />
            </div>
          </div>

          {/* FEATURES */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Features (comma-separated)
            </label>
            <input
              type="text"
              name="features"
              placeholder="WiFi, Parking, Security, Gym..."
              value={formData.features}
              onChange={handleChange}
              className="input-modern"
            />
          </div>

          {/* IMAGES */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Image URLs (comma-separated)
            </label>
            <input
              type="text"
              name="images"
              placeholder="https://img1.com, https://img2.com"
              value={formData.images}
              onChange={handleChange}
              className="input-modern"
            />
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 text-lg font-semibold text-white rounded-xl shadow-md transition ${loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-black hover:bg-gray-900"
              }`}
          >
            {loading ? "Submitting..." : "Add Property"}
          </button>
        </form>

        {/* MESSAGE */}
        {message && (
          <p
            className={`text-center mt-6 font-medium ${message.startsWith("✅") ? "text-green-600" : "text-red-600"
              }`}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
