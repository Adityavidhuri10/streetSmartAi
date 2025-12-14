import { createContext, useState, useEffect } from "react";
import API from "../utils/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          // First try to load from local storage for immediate render
          const storedUser = JSON.parse(localStorage.getItem("user"));
          if (storedUser) setUser(storedUser);

          // Then fetch fresh data from API
          const res = await API.get("/auth/me");

          if (res.status === 200) {
            const data = res.data;
            setUser(data);
            localStorage.setItem("user", JSON.stringify(data));
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          if (error.response && error.response.status === 401) {
            logout();
          }
        }
      }
    };

    fetchUser();
  }, [token]);

  const login = (userData, jwt) => {
    setUser(userData);
    setToken(jwt);
    localStorage.setItem("token", jwt);
    localStorage.setItem("user", JSON.stringify(userData));
  };



  const updateUser = (updatedUserData) => {
    setUser(updatedUserData);
    localStorage.setItem("user", JSON.stringify(updatedUserData));
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
