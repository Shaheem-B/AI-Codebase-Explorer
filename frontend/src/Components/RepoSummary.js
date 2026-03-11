"use client";

function SummarySection({ title, children }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export default function RepoSummary({ data }) {
  const ai = data?.ai_summary;

  if (!ai) {
    return (
      <div className="rounded-[28px] border border-white/10 bg-[#050b18] p-6 text-white/55">
        AI-generated summary is not available yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SummarySection title={ai.project_title || "Repository Summary"}>
        <div className="space-y-4">
          {ai.project_purpose && (
            <div>
              <div className="text-sm font-semibold text-cyan-300">
                Project Purpose
              </div>
              <p className="mt-2 text-sm leading-7 text-white/75">
                {ai.project_purpose}
              </p>
            </div>
          )}

          {ai.executive_summary && (
            <div>
              <div className="text-sm font-semibold text-purple-300">
                Executive Summary
              </div>
              <p className="mt-2 text-sm leading-7 text-white/75">
                {ai.executive_summary}
              </p>
            </div>
          )}

          {ai.architecture_style && (
            <div className="inline-flex rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-sm text-amber-300">
              Architecture Style: {ai.architecture_style}
            </div>
          )}
        </div>
      </SummarySection>

      {Array.isArray(ai.main_flow) && ai.main_flow.length > 0 && (
        <SummarySection title="How the Repository Works">
          <div className="space-y-3">
            {ai.main_flow.map((step, index) => (
              <div
                key={`${step}-${index}`}
                className="rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-white/75"
              >
                <span className="mr-2 text-cyan-300">#{index + 1}</span>
                {step}
              </div>
            ))}
          </div>
        </SummarySection>
      )}

      {Array.isArray(ai.key_capabilities) && ai.key_capabilities.length > 0 && (
        <SummarySection title="Key Capabilities">
          <div className="grid gap-3 md:grid-cols-2">
            {ai.key_capabilities.map((item, index) => (
              <div
                key={`${item}-${index}`}
                className="rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-white/75"
              >
                {item}
              </div>
            ))}
          </div>
        </SummarySection>
      )}

      {Array.isArray(ai.core_modules) && ai.core_modules.length > 0 && (
        <SummarySection title="Core Modules">
          <div className="grid gap-4 md:grid-cols-2">
            {ai.core_modules.map((module, index) => (
              <div
                key={`${module?.name || "module"}-${index}`}
                className="rounded-xl border border-white/10 bg-[#0b1220] p-4"
              >
                <div className="text-sm font-semibold text-cyan-300">
                  {module?.name || `Module ${index + 1}`}
                </div>
                <div className="mt-2 text-sm leading-6 text-white/65">
                  {module?.role || "No description available."}
                </div>
              </div>
            ))}
          </div>
        </SummarySection>
      )}

      {Array.isArray(ai.tech_stack) && ai.tech_stack.length > 0 && (
        <SummarySection title="Tech Stack">
          <div className="flex flex-wrap gap-3">
            {ai.tech_stack.map((tech, index) => (
              <div
                key={`${tech}-${index}`}
                className="rounded-full border border-purple-400/20 bg-purple-400/10 px-4 py-2 text-sm text-purple-300"
              >
                {tech}
              </div>
            ))}
          </div>
        </SummarySection>
      )}

      {Array.isArray(ai.important_files) && ai.important_files.length > 0 && (
        <SummarySection title="Important Files">
          <div className="space-y-3">
            {ai.important_files.map((item, index) => (
              <div
                key={`${item?.file || "file"}-${index}`}
                className="rounded-xl border border-white/10 bg-[#0b1220] p-4"
              >
                <div className="text-sm font-semibold text-amber-300">
                  {item?.file || "Unknown file"}
                </div>
                <div className="mt-2 text-sm leading-6 text-white/65">
                  {item?.why_it_matters || "No explanation available."}
                </div>
              </div>
            ))}
          </div>
        </SummarySection>
      )}

      {Array.isArray(ai.developer_insights) && ai.developer_insights.length > 0 && (
        <SummarySection title="Developer Insights">
          <div className="space-y-3">
            {ai.developer_insights.map((item, index) => (
              <div
                key={`${item}-${index}`}
                className="rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-white/75"
              >
                {item}
              </div>
            ))}
          </div>
        </SummarySection>
      )}

      {Array.isArray(ai.notable_observations) && ai.notable_observations.length > 0 && (
        <SummarySection title="Notable Observations">
          <div className="space-y-3">
            {ai.notable_observations.map((item, index) => (
              <div
                key={`${item}-${index}`}
                className="rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-white/75"
              >
                {item}
              </div>
            ))}
          </div>
        </SummarySection>
      )}
    </div>
  );
}