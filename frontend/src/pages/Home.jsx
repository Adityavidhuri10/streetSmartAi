import { Link } from "react-router-dom";

export default function Home() {
  return (
    <section
      className="relative h-[85vh] flex flex-col justify-center items-center text-center text-white"
      style={{ 
        backgroundImage: `url('/city.jpg')`, 
        backgroundSize: "cover",
        backgroundPosition: "cover",
      }}
    >

      <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/40"></div>

   
      <div className="relative z-10 max-w-3xl px-4">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-6">
          Find Your Perfect Home with Confidence
        </h1>

        <p className="text-lg md:text-xl mb-10">
          Hyperlocal insights, safety ratings, and AI-powered rent analysis for smarter housing decisions.
        </p>

        
        <div className="flex flex-col md:flex-row justify-center gap-4">
          <input
            type="text"
            placeholder="Search by area, locality..."
            className="px-5 py-3 rounded-lg w-80 text-black shadow focus:outline-none"
          />

          <Link
            to="/properties"
            className="bg-white text-black px-6 py-3 rounded-lg font-semibold shadow hover:scale-105 transition"
          >
            Search Properties
          </Link>
        </div>
      </div>
    </section>
  );
}
