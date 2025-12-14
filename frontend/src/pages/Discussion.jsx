import React, { useEffect, useState, useContext } from "react";
import API from "../utils/api";
import { AuthContext } from "../context/AuthContext";
import ReplyBox from "../components/ReplyBox";

export default function Discussion() {
  const { user } = useContext(AuthContext) || {};
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filter, setFilter] = useState("");
  const [sortBy, setSortBy] = useState("recent");

  const [form, setForm] = useState({
    propertyTitle: "",
    locality: "",
    rating: 0,
    text: "",
  });

  const [message, setMessage] = useState("");

  /** Fetch discussions */
  useEffect(() => {
    fetchDiscussions();
  }, []);

  const fetchDiscussions = async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/discussions");
      setDiscussions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setMessage("Failed to load discussions");
    } finally {
      setLoading(false);
    }
  };

  /** Post new discussion */
  const handleSubmitDiscussion = async () => {
    if (!user) return setMessage("Login to start a discussion");

    const { propertyTitle, locality, rating, text } = form;
    if (!propertyTitle || !locality || !rating || !text)
      return setMessage("Please fill all fields");

    try {
      await API.post("/discussions", form);
      setForm({ propertyTitle: "", locality: "", rating: 0, text: "" });
      setMessage("Discussion posted");
      fetchDiscussions();
    } catch (err) {
      console.error(err);
      setMessage("Failed to create discussion");
    }
  };

  /** Like discussion */
  const handleLikeDiscussion = async (id) => {
    try {
      await API.put(`/discussions/${id}/like`);
      setDiscussions((prev) =>
        prev.map((d) => (d._id === id ? { ...d, likes: (d.likes || 0) + 1 } : d))
      );
    } catch (err) {
      console.error(err);
      setMessage("Could not like");
    }
  };

  /** Like reply */
  const handleLikeReply = async (discussionId, replyId) => {
    try {
      await API.put(`/discussions/${discussionId}/reply/${replyId}/like`);
      fetchDiscussions();
    } catch (err) {
      console.error(err);
    }
  };

  /** Add reply */
  const handleAddReply = async (discussionId, text, parentId = null) => {
    if (!user) return setMessage("Login to reply");
    if (!text.trim()) return;

    try {
      await API.post(`/discussions/${discussionId}/reply`, {
        text,
        parentId,
      });
      fetchDiscussions();
    } catch (err) {
      console.error(err);
    }
  };

  /** Filter + Sort */
  const filtered = discussions
    .filter((d) => {
      const q = filter.toLowerCase();
      return (
        d.propertyTitle?.toLowerCase().includes(q) ||
        d.locality?.toLowerCase().includes(q) ||
        d.text?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "likes") return (b.likes || 0) - (a.likes || 0);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  /** Reply component */
  const ReplyNode = ({ reply, discussionId, depth = 0 }) => {
    const [showReply, setShowReply] = useState(false);
    const initials = (reply.author?.name || "U")
      .split(" ")
      .map((n) => n[0])
      .join("");

    return (
      <div className={`mt-3 animate-fadeIn ${depth > 0 ? "ml-6" : ""}`}>
        <div className="flex gap-3">
          <div className="h-9 w-9 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium">
            {initials}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{reply.author?.name}</span>
              <span className="text-xs text-gray-500">
                {new Date(reply.createdAt).toLocaleString()}
              </span>
            </div>

            <p className="text-sm mt-2">{reply.text}</p>

            <div className="flex gap-3 mt-2 text-xs text-gray-600">
              <button
                onClick={() => handleLikeReply(discussionId, reply._id)}
                className="hover:text-black transition"
              >
                👍 {reply.likes}
              </button>

              <button
                className="hover:text-black transition"
                onClick={() => setShowReply((s) => !s)}
              >
                💬 Reply
              </button>
            </div>

            {showReply && (
              <div className="mt-2">
                <ReplyBox
                  placeholder="Write a reply..."
                  onSubmit={(txt) => {
                    handleAddReply(discussionId, txt, reply._id);
                    setShowReply(false);
                  }}
                />
              </div>
            )}

            {/* Nested replies */}
            {reply.replies?.length > 0 &&
              reply.replies.map((nested) => (
                <ReplyNode
                  key={nested._id}
                  reply={nested}
                  discussionId={discussionId}
                  depth={depth + 1}
                />
              ))}
          </div>
        </div>
      </div>
    );
  };

  /** UI --------------------------------------------- */
  return (
    <div className="container mx-auto px-4 py-8 animate-fadeIn">
      <h1 className="text-3xl font-extrabold mb-1">Property Discussions</h1>
      <p className="text-gray-500 text-sm mb-6">
        Discuss properties, ask questions, and share real experiences.
      </p>

      {message && (
        <div className="bg-red-50 text-red-600 px-4 py-2 rounded-md mb-4 border border-red-200">
          {message}
        </div>
      )}

      <div className="grid lg:grid-cols-4 gap-8">
        {/* LEFT SIDE — DISCUSSION LIST */}
        <div className="lg:col-span-3 space-y-6">

          {/* SEARCH + SORT */}
          <div className="bg-white/70 backdrop-blur-md border shadow-sm rounded-xl p-4 flex flex-col sm:flex-row gap-4">

            {/* Search */}
            <div className="relative flex-1">
              <input
                className="w-full border rounded-xl pl-10 pr-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-black outline-none"
                placeholder="Search discussions..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
              <svg
                className="absolute left-3 top-3 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z"
                />
              </svg>
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border rounded-xl px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-black"
            >
              <option value="recent">Most Recent</option>
              <option value="rating">Highest Rating</option>
              <option value="likes">Most Liked</option>
            </select>
          </div>

          {/* DISCUSSION LIST */}
          <div className="space-y-5">
            {loading ? (
              <div className="text-center text-gray-500 py-6">
                Loading discussions...
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 opacity-70">
                <div className="text-6xl mb-4">💬</div>
                <p className="text-gray-600">No discussions yet.</p>
              </div>
            ) : (
              filtered.map((d, index) => (
                <div
                  key={d._id}
                  className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition animate-fadeIn"
                  style={{ animationDelay: `${index * 0.07}s` }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {d.propertyTitle}
                      </h3>
                      <p className="text-sm text-gray-500">{d.locality}</p>
                    </div>

                    <div className="flex items-center gap-1 text-lg">
                      ⭐ <span className="font-semibold">{d.rating}</span>
                    </div>
                  </div>

                  {/* Author */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium">
                      {(d.author?.name || "U")
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>

                    <div>
                      <p className="font-medium text-sm">{d.author?.name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(d.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Text */}
                  <p className="text-sm mb-4 leading-relaxed">{d.text}</p>

                  {/* Buttons */}
                  <div className="flex items-center gap-4 text-sm">
                    <button
                      onClick={() => handleLikeDiscussion(d._id)}
                      className="hover:text-black transition"
                    >
                      👍 {d.likes || 0}
                    </button>
                    <button className="hover:text-black transition">
                      💬 Reply
                    </button>
                  </div>

                  {/* Replies */}
                  {d.replies?.length > 0 && (
                    <div className="mt-4 pl-4 border-l-2 border-gray-200">
                      {d.replies.map((r) => (
                        <ReplyNode
                          key={r._id}
                          reply={r}
                          discussionId={d._id}
                        />
                      ))}
                    </div>
                  )}

                  {/* Add Reply */}
                  <div className="mt-4 pt-4 border-t">
                    {user ? (
                      <ReplyBox
                        placeholder="Write a reply..."
                        onSubmit={(txt) => handleAddReply(d._id, txt)}
                      />
                    ) : (
                      <div className="text-xs text-gray-500">
                        Login to reply
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT SIDE — CREATE & STATS */}
        <div className="space-y-6 lg:sticky lg:top-24 h-fit">

          {/* Create Discussion */}
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="font-semibold mb-3">Start a Discussion</h3>

            <input
              className="w-full border rounded-lg px-3 py-2 text-sm mb-3"
              placeholder="Property title"
              value={form.propertyTitle}
              onChange={(e) =>
                setForm((s) => ({ ...s, propertyTitle: e.target.value }))
              }
            />

            <input
              className="w-full border rounded-lg px-3 py-2 text-sm mb-3"
              placeholder="Locality (e.g., Sector 62, Noida)"
              value={form.locality}
              onChange={(e) =>
                setForm((s) => ({ ...s, locality: e.target.value }))
              }
            />

            <p className="text-sm text-gray-500 mb-2">Rate your experience</p>

            <div className="flex gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((n) => {
                const selected = n <= form.rating;

                return (
                  <button
                    key={n}
                    onClick={() =>
                      setForm((s) => ({
                        ...s,
                        rating: s.rating === n ? 0 : n,
                      }))
                    }
                    className="focus:outline-none"
                  >
                    {selected ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="#FACC15"
                        stroke="#FACC15"
                        className="w-6 h-6"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M11.48 3.499a.562.562 0 011.04 0l2.18 4.66a.563.563 0 00.423.308l5.16.75a.563.563 0 01.312.96l-3.732 3.64a.563.563 0 00-.162.5l.88 5.13a.563.563 0 01-.817.592l-4.61-2.42a.563.563 0 00-.524 0l-4.61 2.42a.563.563 0 01-.818-.593l.881-5.13a.563.563 0 00-.162-.5L2.405 10.18a.563.563 0 01.312-.96l5.16-.75a.563.563 0 00.423-.308l2.18-4.66z"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#94A3B8"
                        className="w-6 h-6"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M11.48 3.499a.562.562 0 011.04 0l2.18 4.66a.563.563 0 00.423.308l5.16.75a.563.563 0 01.312.96l-3.732 3.64a.563.563 0 00-.162.5l.88 5.13a.563.563 0 01-.817.592l-4.61-2.42a.563.563 0 00-.524 0l-4.61 2.42a.563.563 0 01-.818-.593l.881-5.13a.563.563 0 00-.162-.5L2.405 10.18a.563.563 0 01.312-.96l5.16-.75a.563.563 0 00.423-.308l2.18-4.66z"
                        />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>

            <textarea
              className="w-full border rounded-lg px-3 py-2 text-sm min-h-[120px] mb-4"
              placeholder="Share your experience..."
              value={form.text}
              onChange={(e) => setForm((s) => ({ ...s, text: e.target.value }))}
            />

            <button
              className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-900 transition"
              onClick={handleSubmitDiscussion}
            >
              📤 Submit Discussion
            </button>
          </div>

          {/* Stats */}
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="font-semibold mb-2">Stats</h3>
            <p className="text-gray-600 text-sm">
              Total discussions: {discussions.length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
