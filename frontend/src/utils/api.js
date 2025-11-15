import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Automatically attach token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // Or sessionStorage

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

export default API;
