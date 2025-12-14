import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import API from "../utils/api";

export default function MyBookings() {
    const { token } = useContext(AuthContext);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedBookingImages, setSelectedBookingImages] = useState(null);

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const res = await API.get("/bookings/my");
                setBookings(res.data);
            } catch (error) {
                console.error("Error fetching bookings:", error);
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchBookings();
        }
    }, [token]);

    const handleCancelBooking = async (id) => {
        if (!window.confirm("Are you sure you want to cancel this booking?")) return;

        try {
            await API.delete(`/bookings/${id}`);
            setBookings(bookings.filter((b) => b._id !== id));
        } catch (error) {
            console.error("Error cancelling booking:", error);
            alert("Failed to cancel booking");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
            </div>
        );
    }



    return (
        <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
                <p className="text-gray-500 mt-1">Track your property bookings and condition proofs.</p>
            </div>

            {bookings.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No bookings yet</h3>
                    <p className="text-gray-500 mt-1">Book a property to see it here.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {bookings.map((booking) => (
                        <div key={booking._id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6">
                            {/* Property Image */}
                            <div className="w-full md:w-48 h-32 rounded-xl overflow-hidden flex-shrink-0">
                                <img
                                    src={booking.property?.images?.[0] ? (booking.property.images[0].startsWith("http") ? booking.property.images[0] : `http://localhost:5000${booking.property.images[0]}`) : "https://placehold.co/200?text=No+Image"}
                                    alt={booking.property?.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            {/* Details */}
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">{booking.property?.title}</h3>
                                        <p className="text-gray-500">{booking.property?.address || booking.property?.city}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${booking.status === "confirmed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                                            }`}>
                                            {booking.status}
                                        </span>
                                        <button
                                            onClick={() => handleCancelBooking(booking._id)}
                                            className="text-xs text-red-600 hover:text-red-800 font-medium underline"
                                        >
                                            Cancel Booking
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Booking Date</p>
                                        <p className="font-medium">{new Date(booking.bookingDate).toLocaleDateString()}</p>
                                    </div>

                                    {/* Defect Analysis */}
                                    {booking.defectAnalysis && (
                                        <div className={`p-3 rounded-lg border ${(booking.defectAnalysis.summary?.defect_detected || booking.defectAnalysis.defect_detected)
                                            ? "bg-red-50 border-red-200"
                                            : "bg-green-50 border-green-200"
                                            }`}>
                                            <div className="flex justify-between items-start mb-1">
                                                <p className="text-xs uppercase font-bold opacity-70">Condition Proof</p>
                                                {booking.proofImage && booking.proofImage.length > 0 && (
                                                    <button
                                                        onClick={() => setSelectedBookingImages({
                                                            images: booking.proofImage,
                                                            results: booking.defectAnalysis?.results || []
                                                        })}
                                                        className="text-xs text-blue-600 hover:underline font-bold"
                                                    >
                                                        View Images
                                                    </button>
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                {(booking.defectAnalysis.summary?.defect_detected || booking.defectAnalysis.defect_detected) ? (
                                                    <>
                                                        <span className="text-red-700 font-bold text-sm">
                                                            ⚠️ Defects: {
                                                                booking.defectAnalysis.summary?.defect_types?.join(", ") ||
                                                                booking.defectAnalysis.defect_type
                                                            }
                                                        </span>
                                                        {booking.defectAnalysis.summary?.total_images > 1 && (
                                                            <span className="text-xs text-red-600">
                                                                Found in {booking.defectAnalysis.results?.filter(r => r.analysis?.defect_detected).length} of {booking.defectAnalysis.summary.total_images} images
                                                            </span>
                                                        )}
                                                    </>
                                                ) : (
                                                    <span className="text-green-700 font-bold text-sm">✅ No Defects</span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Agreement Analysis */}
                                    {booking.agreementAnalysis && (
                                        <div className="p-3 rounded-lg border bg-blue-50 border-blue-200">
                                            <p className="text-xs uppercase font-bold mb-1 opacity-70">Agreement</p>
                                            <div className="text-sm">
                                                <p className="font-bold text-blue-700">Risk Score: {booking.agreementAnalysis.risk_score}/100</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Image Modal */}
            {selectedBookingImages && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setSelectedBookingImages(null)}>
                    <div className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Condition Proof Images</h3>
                            <button onClick={() => setSelectedBookingImages(null)} className="text-gray-500 hover:text-black">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {selectedBookingImages.images.map((img, idx) => {
                                const result = selectedBookingImages.results[idx];
                                const isDefect = result?.analysis?.defect_detected;
                                const defectType = result?.analysis?.defect_type || "Normal";

                                return (
                                    <div key={idx} className="relative rounded-lg overflow-hidden border group">
                                        <img
                                            src={img.startsWith("http") ? img : `http://localhost:5000${img}`}
                                            alt={`Proof ${idx + 1}`}
                                            className="w-full h-48 object-cover transition duration-300"
                                        />
                                        <div className={`absolute bottom-0 left-0 right-0 px-3 py-2 text-xs font-bold text-white ${isDefect ? "bg-red-600/90" : "bg-green-600/90"}`}>
                                            {defectType}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
