import { NavLink, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Navbar() {
  const { user, token, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const isLoggedIn = !!token;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="bg-white border-b backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-4 py-3">

        {/* LOGO */}
        <NavLink to="/" className="flex items-center gap-3">
          <div className="h-10 w-10 bg-black text-white rounded-xl flex items-center justify-center">
            {/* House Icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="white"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 12l9-9 9 9M4 10v10a1 1 0 001 1h4m6 0h4a1 1 0 001-1V10"
              />
            </svg>
          </div>
          <span className="text-2xl font-semibold tracking-tight">StreetSmart AI</span>
        </NavLink>

        {/* NAV LINKS */}
        <div className="hidden md:flex items-center gap-8 text-gray-700 font-medium">

          {/* HOME */}
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center gap-2 relative hover:text-black transition ${isActive ? "text-black" : ""
              } group`
            }
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 12l9-9 9 9M4 10v10a1 1 0 001 1h4m6 0h4a1 1 0 001-1V10"
              />
            </svg>
            Home
            <span className="absolute left-0 -bottom-1 h-[2px] w-0 bg-black group-hover:w-full transition-all duration-300"></span>
          </NavLink>

          {/* PROPERTIES */}
          <NavLink
            to="/properties"
            className={({ isActive }) =>
              `flex items-center gap-2 relative hover:text-black transition ${isActive ? "text-black" : ""
              } group`
            }
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 10l8-8 8 8M5 11v9a1 1 0 001 1h4m4 0h4a1 1 0 001-1v-9"
              />
            </svg>
            Properties
            <span className="absolute left-0 -bottom-1 h-[2px] w-0 bg-black group-hover:w-full transition-all duration-300"></span>
          </NavLink>

          {/* AI ANALYZER */}
          <NavLink
            to="/analyzer"
            className={({ isActive }) =>
              `flex items-center gap-2 relative hover:text-black transition ${isActive ? "text-black" : ""
              } group`
            }
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h6M9 16h6M7 4h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z"
              />
            </svg>
            AI Analyzer
            <span className="absolute left-0 -bottom-1 h-[2px] w-0 bg-black group-hover:w-full transition-all duration-300"></span>
          </NavLink>

          {/* DISCUSSIONS */}
          <NavLink
            to="/discussions"
            className={({ isActive }) =>
              `flex items-center gap-2 relative hover:text-black transition ${isActive ? "text-black" : ""
              } group`
            }
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 10h8m-8 4h6M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Discussions
            <span className="absolute left-0 -bottom-1 h-[2px] w-0 bg-black group-hover:w-full transition-all duration-300"></span>
          </NavLink>

          {/* LANDLORD OPTION */}
          {user?.role === "landlord" && (
            <NavLink
              to="/add-property"
              className={({ isActive }) =>
                `flex items-center gap-2 relative hover:text-black transition ${isActive ? "text-black" : ""
                } group`
              }
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Property
              <span className="absolute left-0 -bottom-1 h-[2px] w-0 bg-black group-hover:w-full transition-all duration-300"></span>
            </NavLink>
          )}
        </div>

        {/* AUTH BUTTONS */}
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="px-5 py-2 bg-black text-white rounded-xl hover:bg-gray-900 transition shadow-sm"
            >
              Logout
            </button>
          ) : (
            <>
              <NavLink
                to="/login"
                className="px-4 py-2 border border-gray-300 rounded-xl text-gray-800 hover:bg-gray-100 transition shadow-sm"
              >
                Login
              </NavLink>

              <NavLink
                to="/signup"
                className="px-5 py-2 bg-black text-white rounded-xl hover:bg-gray-900 transition shadow-sm"
              >
                Sign Up
              </NavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
