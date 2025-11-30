import React, { useState } from "react";

export default function ReplyBox({ placeholder = "Write a reply...", onSubmit }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);

    try {
      await onSubmit(text.trim());
      setText("");
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex gap-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className="flex-1 border rounded-md px-3 py-2 text-sm"
      />
      <button
        onClick={send}
        disabled={sending}
        className="bg-black-600 text-white px-3 py-2 rounded-md"
      >
        📤
      </button>
    </div>
  );
}
