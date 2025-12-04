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
  });

  const [images, setImages] = useState([]);            // File objects
  const [imagePreviews, setImagePreviews] = useState([]); // Preview URLs

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle file selection + preview
 const handleImageChange = (e) => {
  const newFiles = Array.from(e.target.files);

  // Merge old + new images
  const updatedImages = [...images, ...newFiles];
  setImages(updatedImages);

  // previews
  const previews = updatedImages.map((file) => URL.createObjectURL(file));
  setImagePreviews(previews);
};


  // Remove selected file BEFORE uploading
  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);

    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  // Submit Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const featuresArray = formData.features
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean);

      const fd = new FormData();

      fd.append("title", formData.title);
      fd.append("description", formData.description);
      fd.append("price", Number(formData.price));
      fd.append("address", formData.address);
      fd.append("city", formData.city);
      fd.append("state", formData.state);
      fd.append("owner", user?._id);
      fd.append("safety_score", Math.floor(Math.random() * 10) + 1);

      featuresArray.forEach((item) => fd.append("features", item));

      // Append image files
      images.forEach((img) => {
  fd.append("images", img);  // MUST BE SAME FIELD NAME
});


      await API.post("/properties", fd, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
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
      });
      setImages([]);
      setImagePreviews([]);
    } catch (err) {
      console.error(err);
      setMessage("Failed to add property.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 animate-fadeIn">
      {/* HEADER */}
      <div className="text-center mb-10">
        <div className="mx-auto w-16 h-16 flex items-center justify-center bg-black text-white rounded-2xl shadow-md">
          {/* Outline Home Icon */}
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

      {/* FORM CARD */}
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
            <label className="block font-medium text-gray-700 mb-1">
              Price (₹/month)
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
              className="input-modern"
            />
          </div>

          {/* Address Grid */}
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

          {/* Features */}
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

          {/* IMAGES UPLOAD */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Upload Images
            </label>

            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              className="w-full border rounded-lg px-4 py-2"
            />

            {/* Preview Selected Images */}
            {imagePreviews.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                {imagePreviews.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded-lg shadow-md"
                    />

                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-black/70 text-white w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 text-lg font-semibold text-white rounded-xl shadow-md transition ${
              loading ? "bg-gray-400" : "bg-black hover:bg-gray-900"
            }`}
          >
            {loading ? "Submitting..." : "Add Property"}
          </button>
        </form>

        {/* MESSAGE */}
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
    </div>
  );
}
