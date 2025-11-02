import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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

function App() {
  return (
    <Router>
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
            <Route path="/property/:id" element={<PropertyDetail />} />
            <Route path="/analyzer" element={<AgreementAnalyzer />} />
            <Route path="/add-property" element={<AddProperty />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
}

export default App;
