import { Link, NavLink } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-blue-600">
          StreetSmart AI
        </Link>

        <div className="hidden md:flex gap-6 text-gray-700 font-medium">
          <NavLink to="/properties" className="hover:text-blue-600">
            Properties
          </NavLink>
          <NavLink to="/safety" className="hover:text-blue-600">
            Safety Map
          </NavLink>
          <NavLink to="/analyzer" className="hover:text-blue-600">
            AI Analyzer
          </NavLink>
          <NavLink to="/login" className="hover:text-blue-600">
            Login
          </NavLink>
          <NavLink
            to="/signup"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Sign Up
          </NavLink>
        </div>
      </div>
    </nav>
  );
}
