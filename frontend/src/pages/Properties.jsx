import { useState, useEffect } from "react";
import PropertyCard from "../components/PropertyCard";
import API from "../utils/api";

export default function Properties() {
  const [properties, setProperties] = useState([]);
  const [search, setSearch] = useState("");
  const [feature, setFeature] = useState("All");
  const [sort, setSort] = useState("none");
  const [loading, setLoading] = useState(true);

  // ✅ Fetch properties from backend
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const res = await API.get("/properties"); // from backend route
        setProperties(res.data);
      } catch (error) {
        console.error("Error fetching properties:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  // 🔍 Filter + Sort logic
  const filteredProperties = properties
    .filter((p) => {
      const query = search.toLowerCase();
      return (
        p.title?.toLowerCase().includes(query) ||
        p.address?.toLowerCase().includes(query) ||
        p.city?.toLowerCase().includes(query) ||
        p.state?.toLowerCase().includes(query)
      );
    })
    .filter((p) => (feature === "All" ? true : p.features?.includes(feature)))
    .sort((a, b) => {
      if (sort === "price_low") return a.price - b.price;
      if (sort === "price_high") return b.price - a.price;
      if (sort === "safety_high") return b.safety_score - a.safety_score;
      return 0;
    });

  if (loading)
    return <p className="text-center py-20 text-gray-500">Loading properties...</p>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
        Available Properties
      </h1>

      {/* 🔍 Search + Filters */}
      <div className="mb-8 flex flex-col sm:flex-row gap-3 justify-center">
        {/* Search */}
        <input
          type="text"
          placeholder="Search by city, locality or title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 w-full sm:w-1/2 focus:outline-none"
        />

        {/* Filter */}
        <select
          value={feature}
          onChange={(e) => setFeature(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2"
        >
          <option value="All">All Features</option>
          <option value="WiFi">WiFi</option>
          <option value="Parking">Parking</option>
          <option value="Security">Security</option>
          <option value="Gym">Gym</option>
          <option value="Lift">Lift</option>
          <option value="CCTV">CCTV</option>
          <option value="24/7 Water">24/7 Water</option>
        </select>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2"
        >
          <option value="none">Sort By</option>
          <option value="price_low">Price: Low to High</option>
          <option value="price_high">Price: High to Low</option>
          <option value="safety_high">Safety Score</option>
        </select>
      </div>

      {/* 🧹 Clear Filters */}
      <div className="flex justify-center mb-6">
        <button
          onClick={() => {
            setSearch("");
            setFeature("All");
            setSort("none");
          }}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg"
        >
          Clear Filters
        </button>
      </div>

      {/* Property Grid */}
      {filteredProperties.length === 0 ? (
        <p className="text-center text-gray-500">No matching properties found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProperties.map((property) => (
            <PropertyCard key={property._id || property.id} property={property} />
          ))}
        </div>
      )}
    </div>
  );
}
