import React, { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { assets } from "../assets/assets";
import Message from "./Message";

const Chatbot = () => {
  const containerRef = React.useRef(null);
  const { selectedChat, theme } = useAppContext();

  const [messages, setMessages] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("text");
  const [isPublished, setIsPublished] = useState(false);

  useEffect(() => {
    if (selectedChat?.messages) {
      setMessages(selectedChat.messages);
    } else {
      setMessages([]);
    }
  }, [selectedChat]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);

    setMessages((prev) => [
      ...prev,
      { role: "user", content: prompt }
    ]);

    setPrompt("");

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "This is a demo response." }
      ]);
      setLoading(false);
    }, 1000);
  };
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      })

    } }, [messages, loading]);
  return (
    <div className="flex-1 flex flex-col h-screen max-md:mt-14 relative">

      {/* CHAT MESSAGES */}
      <div ref={containerRef} className="flex-1 overflow-y-auto px-4 md:px-10 pb-40">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
            <img
              src={theme === "dark" ? assets.logo_full : assets.logo_full_dark}
              alt="logo"
              className="w-56"
            />
            <p className="text-4xl md:text-6xl text-gray-400 dark:text-white">
              Ask me anything.
            </p>
          </div>
        )}

        {messages.map((msg, index) => (
          <Message key={index} message={msg} />
        ))}

        {loading && (
          <div className="flex gap-2 mt-4">
            <span className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" />
            <span className="w-2 h-2 rounded-full bg-gray-500 animate-bounce200" />
            <span className="w-2 h-2 rounded-full bg-gray-500 animate-bounce400" />
          </div>
        )}
      </div>

      {/* ✅ IMAGE MODE PUBLISH TOGGLE (CENTERED ABOVE INPUT) */}
      {mode === "image" && (
        <div
          className="
            fixed bottom-20 left-1/2 -translate-x-1/2
            flex items-center gap-2
            bg-white/80 dark:bg-[#3b1f52]/80
            px-4 py-2
            rounded-full
            text-xs
            backdrop-blur-md
            border border-primary/30
            z-50
          "
        >
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="cursor-pointer"
          />
          <span>Publish Generated Image to Community</span>
        </div>
      )}

      {/* INPUT BAR */}
      <form
        onSubmit={onSubmit}
        className="
          fixed bottom-4 left-1/2 -translate-x-1/2
          w-[95%] max-w-2xl
          bg-primary/20 dark:bg-[#583C79]/30
          border border-primary dark:border-[#80609F]/30
          backdrop-blur-md
          rounded-full
          flex items-center gap-3
          px-4 py-2
          z-40
        "
      >
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          className="bg-transparent outline-none text-sm text-gray-700 dark:text-white"
        >
          <option value="text" className="dark:bg-purple-900">Text</option>
          <option value="image" className="dark:bg-purple-900">Image</option>
        </select>

        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Type your prompt here..."
          className="
            flex-1 bg-transparent outline-none text-sm
            text-gray-800 dark:text-white
            placeholder:text-gray-500 dark:placeholder:text-gray-300
          "
          required
        />

        <button type="submit" disabled={loading}>
          <img
            src={loading ? assets.stop_icon : assets.send_icon}
            alt="send"
            className="w-8 h-8"
          />
        </button>
      </form>
    </div>
  );
};

export default Chatbot;
