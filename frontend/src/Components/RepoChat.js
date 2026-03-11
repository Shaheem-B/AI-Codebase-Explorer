"use client";

import { useState } from "react";
import { Bot, Send, User, Sparkles, FileText } from "lucide-react";
import FileExplainer from "./FileExplainer";

export default function RepoChat({ repoUrl, repoName }) {
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: repoUrl
        ? `Repository context loaded for ${repoName || "this repository"}. Ask me anything about the project, architecture, README, stack, or important files.`
        : "No repository selected yet. Analyze a repository first.",
      evidence: [],
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);
  const [fileLoading, setFileLoading] = useState(false);

  const backendUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  const explainFile = async (filePath) => {
    if (!filePath || !repoUrl) return;

    setFileLoading(true);
    setSelectedFile({
      file_path: filePath,
      content: "",
      explanation: "",
    });

    try {
      const res = await fetch(`${backendUrl}/explain-file`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repo_url: repoUrl,
          file_path: filePath,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to explain file.");
      }

      setSelectedFile({
        file_path: data.file_path,
        content: data.content,
        explanation: data.explanation,
      });
    } catch (err) {
      setSelectedFile({
        file_path: filePath,
        content: "",
        explanation:
          err.message || "Something went wrong while explaining the file.",
      });
    } finally {
      setFileLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !repoUrl || loading) return;

    const userMessage = input.trim();

    setMessages((prev) => [
      ...prev,
      { role: "user", text: userMessage, evidence: [] },
    ]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${backendUrl}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          repo_url: repoUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Chat request failed.");
      }

      const aiText =
        typeof data.response === "string"
          ? data.response
          : typeof data.detail === "string"
          ? data.detail
          : JSON.stringify(data, null, 2);

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: aiText,
          evidence: Array.isArray(data.evidence) ? data.evidence : [],
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text:
            err.message ||
            "Something went wrong while asking about the repository.",
          evidence: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 rounded-[28px] border border-white/10 bg-[#050b18] p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold text-white">
            AI Repository Chat
          </h2>
          <p className="mt-2 text-sm leading-7 text-white/55">
            Ask questions about the repository, architecture, README, stack,
            and project structure.
          </p>
        </div>

        <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-300">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Repo Context Loaded
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-[24px] border border-white/10 bg-[#020817] p-4">
        <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/60">
          Current repository:{" "}
          <span className="font-medium text-cyan-300">
            {repoName || "Not selected"}
          </span>
        </div>

        <div className="h-[420px] overflow-y-auto rounded-2xl border border-white/10 bg-[#07101f] p-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-7 ${
                    message.role === "user"
                      ? "bg-cyan-400 text-black"
                      : "border border-white/10 bg-white/5 text-white/75"
                  }`}
                >
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                    {message.role === "user" ? (
                      <>
                        <User className="h-3.5 w-3.5" />
                        You
                      </>
                    ) : (
                      <>
                        <Bot className="h-3.5 w-3.5" />
                        AI Chat
                      </>
                    )}
                  </div>

                  <div className="whitespace-pre-wrap">{message.text}</div>

                  {message.role === "ai" &&
                    Array.isArray(message.evidence) &&
                    message.evidence.length > 0 && (
                      <div className="mt-4">
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/45">
                          Evidence Files
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {message.evidence.map((item, idx) => (
                            <button
                              key={`${item.file_path}-${idx}`}
                              onClick={() => explainFile(item.file_path)}
                              className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-300 transition hover:scale-[1.01]"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              {item.file_path}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/65">
                  AI Chat is analyzing the repository context...
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                sendMessage();
              }
            }}
            placeholder="Ask something like: What is this repo built for?"
            className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white outline-none placeholder:text-white/35"
          />

          <button
            onClick={sendMessage}
            disabled={loading || !repoUrl}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-4 text-sm font-semibold text-black transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            Send
          </button>
        </div>
      </div>

      <FileExplainer
        selectedFile={selectedFile}
        onClose={() => setSelectedFile(null)}
        loading={fileLoading}
      />
    </div>
  );
}