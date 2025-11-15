import { useState, useContext } from "react";
import API from "../utils/api";
import { AuthContext } from "../context/AuthContext";

export default function AddProperty() {
  const { user, token } = useContext(AuthContext); // Get logged-in user + token

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

  // Update form data
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      // Convert comma-separated values into arrays
      const featuresArray = formData.features
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean);

      const imagesArray = formData.images
        .split(",")
        .map((i) => i.trim())
        .filter(Boolean);

      // Property data
      const newProperty = {
        title: formData.title,
        description: formData.description,
        price: Number(formData.price),
        address: formData.address,
        city: formData.city,
        state: formData.state,
        features: featuresArray,
        images: imagesArray,
        safety_score: Math.floor(Math.random() * 10) + 1,
        owner: user?._id, // Logged-in landlord ID
      };

      // API request with JWT
      await API.post("/properties", newProperty, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setMessage("✅ Property added successfully!");

      // Clear form
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
    } catch (error) {
      console.error("Error adding property:", error);
      setMessage("❌ Failed to add property. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
        🏡 Add New Property
      </h1>

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
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-blue-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-blue-500"
          />
        </div>

        {/* Price */}
        <div>
          <label className="block font-medium text-gray-700 mb-1">
            Price (₹/month)
          </label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-blue-500"
          />
        </div>

        {/* Address, City, State */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Address
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-blue-500"
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
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-blue-500"
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">
              State
            </label>
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-blue-500"
            />
          </div>
        </div>

        {/* Features */}
        <div>
          <label className="block font-medium text-gray-700 mb-1">
            Features (comma-separated)
          </label>
          <input
            type="text"
            name="features"
            value={formData.features}
            onChange={handleChange}
            placeholder="WiFi, Parking, Security, Gym"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-blue-500"
          />
        </div>

        {/* Images */}
        <div>
          <label className="block font-medium text-gray-700 mb-1">
            Image URLs (comma-separated)
          </label>
          <input
            type="text"
            name="images"
            value={formData.images}
            onChange={handleChange}
            placeholder="https://image1.com, https://image2.com"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-blue-500"
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-2 rounded-lg text-white font-semibold ${
              loading
                ? "bg-gray-400"
                : "bg-blue-600 hover:bg-blue-700 transition duration-300"
            }`}
          >
            {loading ? "Submitting..." : "Add Property"}
          </button>
        </div>
      </form>

      {/* Message */}
      {message && (
        <p
          className={`text-center mt-6 font-medium ${
            message.startsWith("✅") ? "text-green-600" : "text-red-600"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
