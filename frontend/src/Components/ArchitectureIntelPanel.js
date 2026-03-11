"use client";

function tryParseArchitectureIntel(rawText) {
  if (!rawText || typeof rawText !== "string") return null;

  try {
    const cleaned = rawText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

export default function ArchitectureIntelPanel({ intel }) {
  const parsed = tryParseArchitectureIntel(intel?.raw_response);

  if (!intel) {
    return (
      <div className="rounded-[28px] border border-white/10 bg-[#050b18] p-6 text-white/50">
        No architecture intelligence available yet.
      </div>
    );
  }

  if (!parsed) {
    return (
      <div className="rounded-[28px] border border-white/10 bg-[#050b18] p-6">
        <h2 className="text-2xl font-semibold text-white">
          Architecture Intelligence
        </h2>
        <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-white/70">
          {intel.raw_response}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[28px] border border-white/10 bg-[#050b18] p-6">
      <h2 className="text-2xl font-semibold text-white">
        Architecture Intelligence
      </h2>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h3 className="text-lg font-semibold text-cyan-300">
            System Overview
          </h3>
          <p className="mt-3 text-sm leading-7 text-white/70">
            {parsed.system_overview || "No system overview available."}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h3 className="text-lg font-semibold text-purple-300">
            Request Flow
          </h3>
          <div className="mt-4 space-y-3">
            {Array.isArray(parsed.request_flow) && parsed.request_flow.length > 0 ? (
              parsed.request_flow.map((step, index) => (
                <div
                  key={`${step}-${index}`}
                  className="rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-white/75"
                >
                  <span className="mr-2 text-cyan-300">#{index + 1}</span>
                  {step}
                </div>
              ))
            ) : (
              <div className="text-sm text-white/50">No request flow available.</div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
        <h3 className="text-lg font-semibold text-amber-300">
          Core Modules
        </h3>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {Array.isArray(parsed.core_modules) && parsed.core_modules.length > 0 ? (
            parsed.core_modules.map((module, index) => (
              <div
                key={`${module?.name || "module"}-${index}`}
                className="rounded-xl border border-white/10 bg-[#0b1220] p-4"
              >
                <div className="text-sm font-semibold text-white">
                  {module?.name || `Module ${index + 1}`}
                </div>
                <div className="mt-2 text-sm leading-6 text-white/60">
                  {module?.role || "No role description available."}
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-white/50">No core modules available.</div>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
        <h3 className="text-lg font-semibold text-emerald-300">
          Architecture Notes
        </h3>

        <div className="mt-4 space-y-3">
          {Array.isArray(parsed.architecture_notes) && parsed.architecture_notes.length > 0 ? (
            parsed.architecture_notes.map((note, index) => (
              <div
                key={`${note}-${index}`}
                className="rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-white/75"
              >
                {note}
              </div>
            ))
          ) : (
            <div className="text-sm text-white/50">No architecture notes available.</div>
          )}
        </div>
      </div>
    </div>
  );
}