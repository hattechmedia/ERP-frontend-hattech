import { useState } from "react";
import { motion } from "framer-motion";

export default function ProjectChatBot() {
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: "Hi 👋 I am Project Assistant. Ask me anything about this project.",
    },
    {
      from: "admin",
      text: "What is the current project status?",
    },
    {
      from: "bot",
      text: "The project is 60% completed. Frontend is in progress, backend pending.",
    },
  ]);

  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;

    setMessages((prev) => [
      ...prev,
      { from: "user", text: input },
      {
        from: "bot",
        text: "I have noted your query. This will be linked with project data.",
      },
    ]);

    setInput("");
  };

  return (
    <div className="flex flex-col h-[420px] rounded-xl border overflow-hidden"
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border-color)",
      }}
    >
      {/* HEADER */}
      <div
        className="px-4 py-3 text-sm font-medium"
        style={{ background: "rgba(124,58,237,0.15)" }}
      >
        🤖 Project Assistant Bot
      </div>

      {/* CHAT BODY */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {messages.map((msg, i) => (
          <div key={i} className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
            msg.from === "bot"
              ? "bg-purple-600/20 text-purple-300"
              : "bg-gray-700 text-white ml-auto"
          }`}>
            {msg.text}
          </div>
        ))}
      </div>

      {/* INPUT */}
      <div className="flex gap-2 p-3 border-t"
        style={{ borderColor: "var(--border-color)" }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about tasks, progress, deadlines..."
          className="flex-1 px-3 py-2 rounded-lg text-sm bg-transparent border outline-none"
          style={{ borderColor: "var(--border-color)" }}
        />

        <button
          onClick={sendMessage}
          className="px-4 rounded-lg text-sm"
          style={{ background: "var(--primary)", color: "white" }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
