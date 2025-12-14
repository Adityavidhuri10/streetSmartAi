import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Properties from "./pages/Properties";
import SafetyInsights from "./pages/SafetyInsights";
import AIAnalyzer from "./pages/AIAnalyzer";
import PropertyDetail from "./pages/PropertyDetail";
import AgreementAnalyzer from "./pages/AgreementAnalyzer";
import AddProperty from "./pages/AddProperty";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Discussion from "./pages/Discussion";
import Profile from "./pages/Profile";
import MyProperties from "./pages/MyProperties";
import SavedProperties from "./pages/SavedProperties";
import MyBookings from "./pages/MyBookings";

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/properties" element={<Properties />} />
          <Route path="/safety" element={<SafetyInsights />} />
          <Route path="/analyzer" element={<AIAnalyzer />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/my-properties" element={<MyProperties />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/saved-properties" element={<SavedProperties />} />
          <Route path="/property/:id" element={<PropertyDetail />} />
          <Route path="/agreement-analyzer" element={<AgreementAnalyzer />} />
          <Route path="/add-property" element={<AddProperty />} />
          <Route path="/discussions" element={<Discussion />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;
