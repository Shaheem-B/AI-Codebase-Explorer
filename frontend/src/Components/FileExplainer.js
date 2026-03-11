"use client";

import { FileCode2, Sparkles, X } from "lucide-react";

export default function FileExplainer({
  selectedFile,
  onClose,
  loading,
}) {
  if (!selectedFile) return null;

  return (
    <div className="mt-6 rounded-[28px] border border-white/10 bg-[#050b18] p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">
            File Explainer
          </h2>
          <p className="mt-2 text-sm text-white/55">
            AI explanation for the selected evidence file.
          </p>
        </div>

        <button
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center gap-2 text-cyan-300">
          <FileCode2 className="h-4 w-4" />
          <span className="text-sm font-medium">{selectedFile.file_path}</span>
        </div>
      </div>

      {loading ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-5 text-white/60">
          Explaining file with AI...
        </div>
      ) : (
        <>
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="mb-3 flex items-center gap-2 text-purple-300">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-semibold">AI Explanation</span>
            </div>

            <div className="whitespace-pre-wrap text-sm leading-7 text-white/75">
              {selectedFile.explanation || "No explanation available."}
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-[#020611] p-5">
            <div className="mb-3 text-sm font-semibold text-white/70">
              File Content Preview
            </div>

            <pre className="overflow-auto whitespace-pre-wrap text-xs leading-6 text-white/70">
              {selectedFile.content || "No file content available."}
            </pre>
          </div>
        </>
      )}
    </div>
  );
}