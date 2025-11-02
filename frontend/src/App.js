import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Properties from "./pages/Properties";
import SafetyInsights from "./pages/SafetyInsights";
import AIAnalyzer from "./pages/AIAnalyzer";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

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
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
}

export default App;
