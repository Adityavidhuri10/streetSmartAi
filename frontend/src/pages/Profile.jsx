import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import API from "../utils/api";

export default function Profile() {
    const { user, token, logout } = useContext(AuthContext);
    const [profile, setProfile] = useState(user);
    const [loading, setLoading] = useState(!user);
    const navigate = useNavigate();

    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }

        const fetchProfile = async () => {
            try {
                const res = await API.get("/auth/me");
                setProfile(res.data);
            } catch (error) {
                console.error("Error fetching profile:", error);
                if (error.response && error.response.status === 401) {
                    logout();
                    navigate("/login");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [token, navigate, logout]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
            </div>
        );
    }

    if (!profile) {
        return null; // Will redirect
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="bg-white rounded-2xl shadow-sm border p-8">
                <div className="flex items-center gap-6 mb-8">
                    <div className="h-24 w-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                        {profile.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{profile.name}</h1>
                        <p className="text-gray-500">{profile.email}</p>
                        <span className="inline-block mt-2 px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full capitalize">
                            {profile.role}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-gray-50 rounded-xl border hover:shadow-md transition cursor-pointer">
                        <h3 className="text-xl font-semibold mb-2">My Properties</h3>
                        <p className="text-gray-600 mb-4">
                            View and manage your listed properties.
                        </p>
                        <Link
                            to="/my-properties"
                            className="inline-block px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition"
                        >
                            View Properties
                        </Link>
                    </div>

                    <div className="p-6 bg-gray-50 rounded-xl border hover:shadow-md transition">
                        <h3 className="text-xl font-semibold mb-2">Account Settings</h3>
                        <p className="text-gray-600 mb-4">
                            Update your password and account details.
                        </p>
                        <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
                            Manage Account
                        </button>
                    </div>

                    <div className="p-6 bg-gray-50 rounded-xl border hover:shadow-md transition">
                        <h3 className="text-xl font-semibold mb-2">My Bookings</h3>
                        <p className="text-gray-600 mb-4">
                            View your bookings and condition proofs.
                        </p>
                        <Link
                            to="/my-bookings"
                            className="inline-block px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition"
                        >
                            View Bookings
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
