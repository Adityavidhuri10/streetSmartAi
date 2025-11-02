import { useState } from "react";
import PropertyCard from "../components/PropertyCard";

export default function Properties() {
  const [search, setSearch] = useState("");
  const [feature, setFeature] = useState("All");
  const [sort, setSort] = useState("none");

  const properties = [
    {
      id: 1,
      title: "3BHK Flat in Rohini, Delhi",
      location: "Sector 8, Rohini, New Delhi",
      city: "Delhi",
      price: 46000,
      image:
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
      tags: ["WiFi", "Parking", "Security", "Gym"],
      safety_score: 8,
    },
    {
      id: 2,
      title: "2BHK Flat in Dwarka, Delhi",
      location: "Pocket 14, Dwarka, New Delhi",
      city: "Delhi",
      price: 33000,
      image:
        "https://images.unsplash.com/photo-1600585154203-1925c9aa2e95?auto=format&fit=crop&w=800&q=80",
      tags: ["CCTV", "Lift", "24/7 Water", "Gym"],
      safety_score: 6,
    },
    {
      id: 3,
      title: "3BHK Apartment in Andheri East, Mumbai",
      location: "Western Express Highway, Andheri",
      city: "Mumbai",
      price: 50000,
      image:
        "https://images.unsplash.com/photo-1595514535171-8c871f5dc1da?auto=format&fit=crop&w=800&q=80",
      tags: ["WiFi", "Security", "Gym", "Parking"],
      safety_score: 9,
    },
  ];

  // Filtered + Sorted Data
  const filteredProperties = properties
    .filter(
      (p) =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.location.toLowerCase().includes(search.toLowerCase()) ||
        p.city.toLowerCase().includes(search.toLowerCase())
    )
    .filter((p) => (feature === "All" ? true : p.tags.includes(feature)))
    .sort((a, b) => {
      if (sort === "price_low") return a.price - b.price;
      if (sort === "price_high") return b.price - a.price;
      if (sort === "safety_high") return b.safety_score - a.safety_score;
      return 0;
    });

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
        Available Properties
      </h1>

      {/* Search + Filters */}
      <div className="mb-8 flex flex-col sm:flex-row gap-3 justify-center">
        {/* Search */}
        <input
          type="text"
          placeholder="Search by city or locality..."
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

      {/* Property Grid */}
      {filteredProperties.length === 0 ? (
        <p className="text-center text-gray-500">No matching properties found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProperties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </div>
  );
}
