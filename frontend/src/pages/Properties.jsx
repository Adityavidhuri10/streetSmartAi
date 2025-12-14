import { useState, useEffect } from "react";
import PropertyCard from "../components/PropertyCard";
import API from "../utils/api";

export default function Properties() {
  const [properties, setProperties] = useState([]);
  const [search, setSearch] = useState("");
  const [feature, setFeature] = useState("All");
  const [sort, setSort] = useState("none");
  const [loading, setLoading] = useState(true);

  const [scraping, setScraping] = useState(false);

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

  // 🔍 Handle Search (Triggers Scrape)
  const handleSearch = async () => {
    if (!search.trim()) return;

    setScraping(true);
    try {
      // Call the scrape endpoint
      const res = await API.post("/scrape", { keyword: search });
      if (res.data && res.data.properties) {
        setProperties(res.data.properties);
      }
    } catch (error) {
      console.error("Error searching properties:", error);
      alert("Search failed. Please try again.");
    } finally {
      setScraping(false);
    }
  };

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
    <div className="max-w-7xl mx-auto px-4 py-10 animate-fadeIn">

      {/* Title */}
      <h1 className="text-4xl font-extrabold mb-10 text-center text-gray-900">
        Available Properties
      </h1>

      {/* Search + Filters Panel */}
      <div className="mb-10 mx-auto bg-white/70 backdrop-blur-lg shadow-lg border rounded-2xl p-6 w-full sm:w-4/5 lg:w-3/5 transition hover:shadow-xl">

        <div className="flex flex-col gap-4">

          {/* Search */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="🔍 Search by city, locality or title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="border border-gray-300 rounded-xl px-4 py-3 w-full text-gray-700 focus:ring-2 focus:ring-black focus:outline-none transition"
            />
            <button
              onClick={handleSearch}
              disabled={scraping}
              className="bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition disabled:bg-gray-400 whitespace-nowrap"
            >
              {scraping ? "Searching..." : "Search"}
            </button>
          </div>

          {/* Filters Row */}
          <div className="flex flex-col sm:flex-row gap-4">

            {/* Feature Filter */}
            <select
              value={feature}
              onChange={(e) => setFeature(e.target.value)}
              className="border border-gray-300 rounded-xl px-4 py-3 flex-1 focus:ring-2 focus:ring-black transition"
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
              className="border border-gray-300 rounded-xl px-4 py-3 flex-1 focus:ring-2 focus:ring-black transition"
            >
              <option value="none">Sort By</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="safety_high">Safety Score</option>
            </select>
          </div>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setSearch("");
              setFeature("All");
              setSort("none");
              // Optionally fetch all properties again
            }}
            className="bg-gray-200 text-gray-800 py-2 px-4 rounded-xl hover:bg-gray-300 transition w-full mt-2"
          >
            Clear Filters
          </button>

        </div>
      </div>

      {/* Property Grid */}
      {scraping ? (
        <div className="text-center py-20">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-black mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Searching... Please check the opened browser window.</p>
          <p className="text-gray-400 text-sm mt-2">Select a property in the browser to scrape it.</p>
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="text-center text-gray-500 mt-0">

          <div className="text-center py-10 opacity-80 animate-fadeIn">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-16 h-16 mx-auto text-gray-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.6}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 12l9-9 9 9M4 10v10a1 1 0 001 1h4m10-11v10a1 1 0 01-1 1h-4m-6 0h6"
              />
            </svg>

            <p className="text-gray-500 text-lg">
              No matching properties found.
            </p>
          </div>

        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredProperties.map((property, index) => (
            <div
              key={property._id || property.id}
              className="animate-fadeIn"
              style={{ animationDelay: `${index * 0.07}s` }}
            >
              <PropertyCard property={property} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
