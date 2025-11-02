import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api", // update this to your Render backend URL after deployment
});

export default API;
