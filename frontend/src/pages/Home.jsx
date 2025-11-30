import { Link } from "react-router-dom";

export default function Home() {
  return (
    <section className="text-center py-20 bg-gradient-to-r from-black via-gray-900 to-black text-white animate-fadeIn">
      <h1 className="text-4xl md:text-5xl font-bold mb-4">
        Find Your Perfect Home with Confidence
      </h1>
      <p className="text-lg mb-8">
        Hyperlocal insights, safety ratings, and AI-powered rent analysis for smarter housing decisions.
      </p>
      <Link
        to="/properties"
        className="bg-white text-black px-6 py-3 rounded-lg font-semibold hover:scale-105 shadow transition"
      >
        Browse Properties
      </Link>
    </section>
  );
}
