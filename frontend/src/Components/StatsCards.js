"use client";

import {
  ChevronRight,
  FolderTree,
  FileCode2,
  Binary,
  Github,
  Layers3,
} from "lucide-react";

function normalizeValue(value) {
  if (value === null || value === undefined) return "--";

  if (typeof value === "string" || typeof value === "number") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? `${value.length} items` : "0 items";
  }

  if (typeof value === "object") {
    if (value.name) return value.name;
    if (value.label) return value.label;
    if (value.main_language) return value.main_language;
    if (value.value) return value.value;

    const keys = Object.keys(value);
    return keys.length > 0 ? keys.join(", ") : "--";
  }

  return String(value);
}

function getAccentClasses(accent) {
  switch (accent) {
    case "cyan":
      return "from-cyan-500/40 to-cyan-400/10";
    case "violet":
      return "from-fuchsia-500/40 to-violet-400/10";
    case "emerald":
      return "from-emerald-500/40 to-emerald-400/10";
    case "amber":
      return "from-amber-500/40 to-yellow-400/10";
    default:
      return "from-slate-500/30 to-slate-400/10";
  }
}

function fallbackIcon(index) {
  const icons = [Github, FileCode2, Binary, FolderTree, Layers3];
  return icons[index % icons.length];
}

export default function StatsCards({ stats = [] }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((item, index) => {
        const Icon = item.icon || fallbackIcon(index);
        const value = normalizeValue(item.value);

        return (
          <div
            key={`${item.title}-${index}`}
            className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,16,34,0.94),rgba(7,11,24,0.98))] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.25)] transition hover:-translate-y-1"
          >
            <div
              className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${getAccentClasses(
                item.accent
              )}`}
            />

            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm text-white/50">{item.title}</div>
                <div className="mt-4 text-3xl font-semibold text-white break-words">
                  {value}
                </div>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/70">
                <Icon className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2 text-sm text-white/35">
              <ChevronRight className="h-4 w-4" />
              Live repository insight
            </div>
          </div>
        );
      })}
    </div>
  );
}