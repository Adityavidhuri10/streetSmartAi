export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-8 mt-12 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="text-sm">
          © {new Date().getFullYear()} StreetSmart AI — All Rights Reserved
        </p>
      </div>
    </footer>
  );
}
