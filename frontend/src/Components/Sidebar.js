"use client";

import {
  Home,
  LayoutDashboard,
  Network,
  Languages,
  FileText,
  BrainCircuit,
  FolderKanban,
  Pin,
  PinOff,
  Trash2,
  Clock3,
} from "lucide-react";

const navItems = [
  { key: "home", label: "Home", icon: Home, requiresAnalysis: false },
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, requiresAnalysis: true },
  { key: "architecture", label: "Architecture", icon: Network, requiresAnalysis: true },
  { key: "languages", label: "Languages", icon: Languages, requiresAnalysis: true },
  { key: "summary", label: "Summary", icon: FileText, requiresAnalysis: true },
  { key: "repositories", label: "Repositories", icon: FolderKanban, requiresAnalysis: true },
  { key: "ai-explorer", label: "AI Chat", icon: BrainCircuit, requiresAnalysis: true },
];

function getRepoLabel(url) {
  if (!url) return "Unknown Repo";
  const cleaned = url.replace(/\/+$/, "");
  const parts = cleaned.split("/");
  return parts[parts.length - 1] || url;
}

function formatTime(ts) {
  if (!ts) return "Unknown time";

  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "Unknown time";
  }
}

function RepoCard({ repoUrl, pinned, repoMeta, onOpen, onTogglePin }) {
  const meta = repoMeta?.[repoUrl] || {};
  const mainLanguage = meta.mainLanguage || "Unknown";
  const architectureStyle = meta.architectureStyle || "General";
  const lastAnalyzed = formatTime(meta.lastAnalyzedAt);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition hover:border-cyan-400/20 hover:bg-cyan-400/10">
      <div className="flex items-start justify-between gap-3">
        <button onClick={() => onOpen?.(repoUrl)} className="min-w-0 flex-1 text-left">
          <div className="text-sm font-medium text-white">{getRepoLabel(repoUrl)}</div>

          <div className="mt-1 truncate text-xs text-white/45">{repoUrl}</div>

          <div className="mt-3 flex flex-wrap gap-2">
            <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-[11px] text-cyan-300">
              {mainLanguage}
            </div>

            <div className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-[11px] text-amber-300">
              {architectureStyle}
            </div>
          </div>

          <div className="mt-3 flex items-center gap-1 text-[11px] text-white/40">
            <Clock3 className="h-3.5 w-3.5" />
            {lastAnalyzed}
          </div>
        </button>

        <button
          onClick={() => onTogglePin?.(repoUrl)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#0d1526] text-white/65 transition hover:border-cyan-400/20 hover:text-cyan-300"
          title={pinned ? "Unpin repository" : "Pin repository"}
        >
          {pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export default function Sidebar({
  activeSection,
  setActiveSection,
  recentRepos = [],
  pinnedRepos = [],
  repoMeta = {},
  onSelectRecentRepo,
  onTogglePinRepo,
  onClearRecentRepos,
  hasAnalysis = false,
}) {
  return (
    <div className="flex h-screen flex-col">
      <div className="border-b border-white/10 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 shadow-[0_0_24px_rgba(34,211,238,0.15)]">
            <BrainCircuit className="h-6 w-6 text-cyan-300" />
          </div>

          <div>
            <h2 className="text-sm font-semibold tracking-wide text-white">
              AI Codebase Explorer
            </h2>
            <p className="text-xs text-white/45">Developer Intelligence Suite</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="mb-4 px-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/35">
          Workspace
        </div>

        <div className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.key;
            const isLocked = item.requiresAnalysis && !hasAnalysis;

            return (
              <button
                key={item.key}
                onClick={() => {
                  if (!isLocked) setActiveSection(item.key);
                }}
                disabled={isLocked}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
                  isActive
                    ? "border border-cyan-400/20 bg-cyan-400/10 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.08)]"
                    : isLocked
                    ? "cursor-not-allowed border border-transparent bg-transparent text-white/25"
                    : "border border-transparent bg-transparent text-white/65 hover:border-white/10 hover:bg-white/5 hover:text-white"
                }`}
                title={isLocked ? "Analyze a repository first" : item.label}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-8">
          <div className="mb-4 flex items-center gap-2 px-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/35">
            <Pin className="h-3.5 w-3.5" />
            Pinned Repositories
          </div>

          {pinnedRepos.length > 0 ? (
            <div className="space-y-2">
              {pinnedRepos.map((repoUrl, index) => (
                <RepoCard
                  key={`${repoUrl}-${index}`}
                  repoUrl={repoUrl}
                  pinned
                  repoMeta={repoMeta}
                  onOpen={onSelectRecentRepo}
                  onTogglePin={onTogglePinRepo}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/45">
              No pinned repositories yet.
            </div>
          )}
        </div>

        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between gap-3 px-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/35">
              <Clock3 className="h-3.5 w-3.5" />
              Recent Repositories
            </div>

            {recentRepos.length > 0 && (
              <button
                onClick={onClearRecentRepos}
                className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/50 transition hover:border-red-400/20 hover:bg-red-400/10 hover:text-red-300"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear
              </button>
            )}
          </div>

          {recentRepos.length > 0 ? (
            <div className="space-y-2">
              {recentRepos.map((repoUrl, index) => (
                <RepoCard
                  key={`${repoUrl}-${index}`}
                  repoUrl={repoUrl}
                  pinned={pinnedRepos.includes(repoUrl)}
                  repoMeta={repoMeta}
                  onOpen={onSelectRecentRepo}
                  onTogglePin={onTogglePinRepo}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/45">
              No repositories analyzed yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}