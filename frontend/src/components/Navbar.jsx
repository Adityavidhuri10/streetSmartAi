import { NavLink, useNavigate } from "react-router-dom";
import { useContext, useState, useEffect, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import API from "../utils/api";

export default function Navbar() {
  const { user, token, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  const isLoggedIn = !!token;

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await API.get("/notifications");
      setNotifications(res.data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll for notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [token]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notificationRef]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const markAsRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

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

          {/* LANDLORD OPTIONS */}
          {user?.role === "landlord" && (
            <>
              <NavLink
                to="/my-properties"
                className={({ isActive }) =>
                  `flex items-center gap-2 relative hover:text-black transition ${isActive ? "text-black" : ""
                  } group`
                }
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                My Properties
                <span className="absolute left-0 -bottom-1 h-[2px] w-0 bg-black group-hover:w-full transition-all duration-300"></span>
              </NavLink>

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
            </>
          )}

          {/* TENANT OPTIONS */}
          {user?.role === "tenant" && (
            <NavLink
              to="/saved-properties"
              className={({ isActive }) =>
                `flex items-center gap-2 relative hover:text-black transition ${isActive ? "text-black" : ""
                } group`
              }
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Saved
              <span className="absolute left-0 -bottom-1 h-[2px] w-0 bg-black group-hover:w-full transition-all duration-300"></span>
            </NavLink>
          )}
        </div>

        {/* AUTH BUTTONS */}
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <>
              {/* Notification Bell */}
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-full hover:bg-gray-100 transition relative"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                    <div className="p-3 border-b bg-gray-50 flex justify-between items-center">
                      <h3 className="font-bold text-sm">Notifications</h3>
                      <button onClick={fetchNotifications} className="text-xs text-blue-600 hover:underline">Refresh</button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">No notifications</div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif._id}
                            className={`p-3 border-b hover:bg-gray-50 transition cursor-pointer flex gap-3 items-start ${!notif.read ? "bg-blue-50/50" : ""}`}
                            onClick={() => {
                              markAsRead(notif._id);
                              if (notif.type === "booking_created") {
                                navigate("/my-properties", { state: { tab: "bookings" } });
                              }
                            }}
                          >
                            {/* Property Image */}
                            <div className="flex-shrink-0">
                              {notif.relatedId?.property?.images?.[0] && (
                                <img
                                  src={notif.relatedId.property.images[0].startsWith("http") ? notif.relatedId.property.images[0] : `http://localhost:5000${notif.relatedId.property.images[0]}`}
                                  alt="Property"
                                  className="w-12 h-12 rounded-lg object-cover mb-1"
                                />
                              )}
                              {/* Proof Image Thumbnail (Mini) */}
                              {notif.relatedId?.proofImage?.[0] && (
                                <div className="relative w-12 h-8 rounded overflow-hidden border border-gray-200" title="Condition Proof">
                                  <img
                                    src={notif.relatedId.proofImage[0].startsWith("http") ? notif.relatedId.proofImage[0] : `http://localhost:5000${notif.relatedId.proofImage[0]}`}
                                    alt="Proof"
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                    <span className="text-[8px] text-white font-bold">PROOF</span>
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-800 font-medium line-clamp-2">{notif.message}</p>

                              {/* Analysis Badges */}
                              {notif.relatedId && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {/* Defect Badge */}
                                  {notif.relatedId.defectAnalysis && (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${notif.relatedId.defectAnalysis.summary?.defect_detected
                                      ? "bg-red-50 text-red-700 border-red-200"
                                      : "bg-green-50 text-green-700 border-green-200"
                                      }`}>
                                      {notif.relatedId.defectAnalysis.summary?.defect_detected ? "⚠️ Defects" : "✅ No Defects"}
                                    </span>
                                  )}

                                  {/* Risk Badge */}
                                  {notif.relatedId.agreementAnalysis && (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${notif.relatedId.agreementAnalysis.risk_score > 5
                                      ? "bg-orange-50 text-orange-700 border-orange-200"
                                      : "bg-blue-50 text-blue-700 border-blue-200"
                                      }`}>
                                      🛡️ Risk: {notif.relatedId.agreementAnalysis.risk_score}/10
                                    </span>
                                  )}
                                </div>
                              )}

                              <p className="text-xs text-gray-400 mt-1">{new Date(notif.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <NavLink
                to="/profile"
                className="px-4 py-2 text-gray-700 font-medium hover:text-black transition"
              >
                Profile
              </NavLink>
              <button
                onClick={handleLogout}
                className="px-5 py-2 bg-black text-white rounded-xl hover:bg-gray-900 transition shadow-sm"
              >
                Logout
              </button>
            </>
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
