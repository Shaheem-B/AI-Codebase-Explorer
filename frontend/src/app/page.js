"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Github,
  Sparkles,
  Loader2,
  AlertCircle,
  FolderGit2,
  Braces,
  Layers3,
  FileCode2,
  Network,
  MessageSquareText,
  SearchCode,
} from "lucide-react";

import RepoFileTree from "../Components/RepoFileTree";
import FileExplainer from "../Components/FileExplainer";
import Sidebar from "../Components/Sidebar";
import Topbar from "../Components/Topbar";
import StatsCards from "../Components/StatsCards";
import ArchitectureIntelPanel from "../Components/ArchitectureIntelPanel";
import ArchitectureGraph from "../Components/ArchitectureGraph";
import RepoSummary from "../Components/RepoSummary";
import RepoChat from "../Components/RepoChat";

function safeText(value, fallback = "Not available") {
  if (value === null || value === undefined) return fallback;

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return fallback;
    return value.map((item) => safeText(item, "")).filter(Boolean).join(", ");
  }

  if (typeof value === "object") {
    if (typeof value.summary === "string") return value.summary;
    if (typeof value.description === "string") return value.description;
    if (typeof value.main_language === "string") return value.main_language;
    if (typeof value.name === "string") return value.name;
    if (typeof value.label === "string") return value.label;

    const keys = Object.keys(value);
    return keys.length > 0 ? `Available keys: ${keys.join(", ")}` : fallback;
  }

  return fallback;
}

function getRepoName(result) {
  return (
    safeText(result?.repo_name, "") ||
    safeText(result?.repository, "") ||
    safeText(result?.name, "") ||
    safeText(result?.analysis?.repository, "") ||
    "Unknown Repo"
  );
}

function getMainLanguage(result) {
  return (
    safeText(result?.main_language, "") ||
    safeText(result?.language, "") ||
    safeText(result?.analysis?.main_language, "") ||
    safeText(result?.summary?.main_language, "") ||
    safeText(result?.overview?.main_language, "") ||
    "Unknown"
  );
}

function getTotalFiles(result) {
  return (
    result?.stats?.total_files ??
    result?.total_files ??
    result?.file_count ??
    result?.analysis?.total_files ??
    result?.analysis?.file_count ??
    result?.summary?.total_files ??
    result?.analysis?.top_level_files?.length ??
    result?.top_level_files?.length ??
    "--"
  );
}

function getSummary(result) {
  const candidates = [
    result?.summary,
    result?.project_summary,
    result?.description,
    result?.analysis?.summary,
    result?.overview,
    result?.analysis,
  ];

  for (const item of candidates) {
    if (item === null || item === undefined) continue;

    if (typeof item === "string") return item;

    if (typeof item === "object") {
      if (typeof item.summary === "string") return item.summary;
      if (typeof item.description === "string") return item.description;

      const language = safeText(item.main_language, "");
      const folders = Array.isArray(item.top_level_folders)
        ? item.top_level_folders.join(", ")
        : "";
      const files = Array.isArray(item.top_level_files)
        ? item.top_level_files.join(", ")
        : "";

      const parts = [
        language ? `Main language: ${language}` : "",
        folders ? `Top-level folders: ${folders}` : "",
        files ? `Top-level files: ${files}` : "",
      ].filter(Boolean);

      if (parts.length > 0) return parts.join(" • ");
    }
  }

  return "Repository analysis completed successfully.";
}

function getLanguages(result) {
  const candidates = [
    result?.analysis?.languages,
    result?.summary?.languages,
    result?.languages,
    result?.analysis?.language_breakdown,
    result?.language_breakdown,
  ];

  for (const item of candidates) {
    if (!item) continue;

    if (Array.isArray(item)) {
      return item.map((lang, index) => {
        if (typeof lang === "string") {
          return { name: lang, value: "Detected", id: `${lang}-${index}` };
        }

        return {
          name:
            safeText(lang?.name, "") ||
            safeText(lang?.language, "") ||
            `Language ${index + 1}`,
          value:
            safeText(lang?.value, "") ||
            safeText(lang?.percentage, "") ||
            safeText(lang?.count, "") ||
            "Detected",
          id: `${safeText(lang?.name, "language")}-${index}`,
        };
      });
    }

    if (typeof item === "object") {
      return Object.entries(item).map(([key, value], index) => ({
        name: key,
        value: safeText(value, "Detected"),
        id: `${key}-${index}`,
      }));
    }
  }

  return [];
}

function getModules(result) {
  const candidates = [
    result?.ai_summary?.core_modules,
    result?.core_modules,
    result?.modules,
    result?.analysis?.modules,
    result?.summary?.modules,
  ];

  for (const item of candidates) {
    if (!Array.isArray(item) || item.length === 0) continue;

    return item.map((module, index) => {
      if (typeof module === "string") {
        return {
          id: `${module}-${index}`,
          name: module,
          description: "Module detected from repository analysis.",
        };
      }

      return {
        id: `${safeText(module?.name, "module")}-${index}`,
        name:
          safeText(module?.name, "") ||
          safeText(module?.module, "") ||
          `Module ${index + 1}`,
        description:
          safeText(module?.role, "") ||
          safeText(module?.description, "") ||
          safeText(module?.summary, "") ||
          "Module detected from repository analysis.",
      };
    });
  }

  return [];
}

function formatLanguageLabel(label) {
  if (!label) return "Unknown";

  return String(label)
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function Page() {
  const backendUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
  setMounted(true);
}, []);
  const [diagramLoading, setDiagramLoading] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);

  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [diagram, setDiagram] = useState(null);
  const [architectureIntel, setArchitectureIntel] = useState(null);
  const [repoTree, setRepoTree] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const [activeSection, setActiveSection] = useState("home");

  const [recentRepos, setRecentRepos] = useState([]);
  const [pinnedRepos, setPinnedRepos] = useState([]);
  const [repoMeta, setRepoMeta] = useState({});

  useEffect(() => {
    try {
      const savedRepos = localStorage.getItem("recentRepos");
      const savedPinnedRepos = localStorage.getItem("pinnedRepos");
      const savedRepoMeta = localStorage.getItem("repoMeta");

      if (savedRepos) {
        setRecentRepos(JSON.parse(savedRepos));
      }

      if (savedPinnedRepos) {
        setPinnedRepos(JSON.parse(savedPinnedRepos));
      }

      if (savedRepoMeta) {
        setRepoMeta(JSON.parse(savedRepoMeta));
      }
    } catch (err) {
      console.error("Failed to load repository history:", err);
    }
  }, []);

  const saveRecentRepo = (url) => {
    if (!url) return;

    setRecentRepos((prev) => {
      const updated = [url, ...prev.filter((item) => item !== url)].slice(0, 8);
      localStorage.setItem("recentRepos", JSON.stringify(updated));
      return updated;
    });
  };

  const saveRepoMeta = (url, analyzeData) => {
    if (!url || !analyzeData) return;

    const nextMeta = {
      ...repoMeta,
      [url]: {
        mainLanguage: getMainLanguage(analyzeData),
        architectureStyle:
          analyzeData?.ai_summary?.architecture_style ||
          analyzeData?.summary?.architecture_style ||
          "General",
        lastAnalyzedAt: new Date().toISOString(),
      },
    };

    setRepoMeta(nextMeta);
    localStorage.setItem("repoMeta", JSON.stringify(nextMeta));
  };

  const togglePinRepo = (url) => {
    if (!url) return;

    setPinnedRepos((prev) => {
      const exists = prev.includes(url);
      const updated = exists ? prev.filter((item) => item !== url) : [url, ...prev];
      localStorage.setItem("pinnedRepos", JSON.stringify(updated));
      return updated;
    });
  };

  const clearRecentRepos = () => {
    setRecentRepos([]);
    localStorage.removeItem("recentRepos");
  };

  const fetchRepoTree = async (targetRepoUrl) => {
    try {
      const res = await fetch(`${backendUrl}/repo-tree`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repo_url: targetRepoUrl,
        }),
      });

      if (!res.ok) {
        setRepoTree(null);
        return;
      }

      const data = await res.json();
      setRepoTree(data?.tree || null);
    } catch (err) {
      console.error("Repo tree fetch failed:", err);
      setRepoTree(null);
    }
  };

  const fetchArchitectureIntel = async (targetRepoUrl) => {
    try {
      const res = await fetch(`${backendUrl}/architecture-intel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repo_url: targetRepoUrl,
        }),
      });

      if (!res.ok) {
        setArchitectureIntel(null);
        return;
      }

      const data = await res.json();
      setArchitectureIntel(data);
    } catch (err) {
      console.error("Architecture intel fetch failed:", err);
      setArchitectureIntel(null);
    }
  };

  const explainFileFromTree = async (filePath) => {
    if (!filePath || !repoUrl) return;

    setSelectedFile({
      file_path: filePath,
      content: "",
      explanation: "",
    });
    setFileLoading(true);

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

  const analyzeRepo = async (overrideUrl = null) => {
    const targetRepoUrl =
      typeof overrideUrl === "string" ? overrideUrl : repoUrl;

    if (typeof targetRepoUrl !== "string" || !targetRepoUrl.trim()) {
      setError("Please enter a GitHub repository URL.");
      return;
    }

    setLoading(true);
    setDiagramLoading(true);
    setError("");
    setResult(null);
    setDiagram(null);
    setArchitectureIntel(null);
    setRepoTree(null);
    setSelectedFile(null);

    try {
      const analyzeRes = await fetch(`${backendUrl}/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repo_url: targetRepoUrl,
        }),
      });

      if (!analyzeRes.ok) {
        const errData = await analyzeRes.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to analyze repository.");
      }

      const analyzeData = await analyzeRes.json();

      saveRecentRepo(targetRepoUrl);
      saveRepoMeta(targetRepoUrl, analyzeData);
      setRepoUrl(targetRepoUrl);
      setResult(analyzeData);
      setActiveSection("dashboard");

      fetchRepoTree(targetRepoUrl);
      fetchArchitectureIntel(targetRepoUrl);

      try {
        const diagramRes = await fetch(`${backendUrl}/diagram`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            repo_url: targetRepoUrl,
          }),
        });

        if (diagramRes.ok) {
          const diagramData = await diagramRes.json();
          setDiagram(diagramData);
        } else {
          setDiagram(null);
        }
      } catch (diagramErr) {
        console.error("Diagram fetch failed:", diagramErr);
        setDiagram(null);
      }
    } catch (err) {
      setError(err.message || "Something went wrong while analyzing.");
      setActiveSection("home");
    } finally {
      setLoading(false);
      setDiagramLoading(false);
    }
  };

  const repoName = useMemo(() => getRepoName(result), [result]);
  const mainLanguage = useMemo(() => getMainLanguage(result), [result]);
  const totalFiles = useMemo(() => getTotalFiles(result), [result]);
  const summaryText = useMemo(() => getSummary(result), [result]);
  const languages = useMemo(() => getLanguages(result), [result]);
  const modules = useMemo(() => getModules(result), [result]);

  const hasAnalysis = !!result;

  const homeFeatureCards = [
    {
      title: "Code Intelligence",
      description:
        "Inspect summaries, language signals, file trees, and module-level understanding in one workspace.",
      icon: SearchCode,
    },
    {
      title: "Architecture Mapping",
      description:
        "Generate structured architecture graphs from repository structure and key modules.",
      icon: Network,
    },
    {
      title: "AI Repository Chat",
      description:
        "Ask grounded questions about the codebase, flow, files, and implementation details.",
      icon: MessageSquareText,
    },
  ];

  const stats = useMemo(() => {
    if (!result) return [];

    return [
      {
        title: "Repository",
        value: repoName,
        icon: FolderGit2,
      },
      {
        title: "Main Language",
        value: mainLanguage,
        icon: Braces,
      },
      {
        title: "Total Files",
        value: totalFiles,
        icon: FileCode2,
      },
      {
        title: "Core Modules",
        value: modules.length || "--",
        icon: Layers3,
      },
    ];
  }, [result, repoName, mainLanguage, totalFiles, modules]);

  const rawJson = useMemo(() => {
    if (!result) return "No analysis data available.";
    return JSON.stringify(result, null, 2);
  }, [result]);

  const handleSectionChange = (section) => {
    if (!hasAnalysis && section !== "home") return;
    setActiveSection(section);
  };

  const handleRecentRepoSelect = (url) => {
    setRepoUrl(url);
    analyzeRepo(url);
  };

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <div className="flex min-h-screen">
        <aside className="w-[290px] shrink-0 border-r border-white/10 bg-[linear-gradient(180deg,#06101f_0%,#040914_100%)]">
          <Sidebar
            activeSection={activeSection}
            setActiveSection={handleSectionChange}
            recentRepos={recentRepos.filter((repo) => !pinnedRepos.includes(repo))}
            pinnedRepos={pinnedRepos}
            repoMeta={repoMeta}
            onSelectRecentRepo={handleRecentRepoSelect}
            onTogglePinRepo={togglePinRepo}
            onClearRecentRepos={clearRecentRepos}
            hasAnalysis={hasAnalysis}
          />
        </aside>

        <main className="flex-1 overflow-hidden">
          <Topbar activeSection={activeSection} />

          <div className="h-[calc(100vh-72px)] overflow-y-auto px-4 py-4 md:px-6">
            {activeSection === "home" && (
              <motion.section
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="flex min-h-full flex-col rounded-[34px] border border-white/10 bg-[linear-gradient(135deg,rgba(17,29,53,0.95),rgba(8,12,28,0.98))] px-6 py-7 shadow-[0_0_80px_rgba(0,0,0,0.3)] md:px-8 md:py-9"
              >
                <div className="flex flex-1 flex-col">
                  <div className="max-w-5xl">
                    <h1 className="max-w-4xl text-4xl font-semibold leading-tight md:text-6xl">
                      Real AI Codebase Explorer for{" "}
                      <span className="bg-gradient-to-r from-cyan-300 via-sky-400 to-violet-300 bg-clip-text text-transparent">
                        architecture intelligence
                      </span>
                    </h1>

                    <p className="mt-6 max-w-3xl text-base leading-8 text-white/65 md:text-lg">
                      Analyze GitHub repositories, inspect architecture, explore core
                      modules, and prepare the foundation for AI-powered codebase
                      understanding.
                    </p>
                  </div>

                  <div className="mt-8 rounded-[30px] border border-white/10 bg-white/5 p-4 shadow-[0_20px_80px_rgba(0,0,0,0.25)] backdrop-blur-xl">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#171d2b] px-5 py-4">
                          <Github className="h-5 w-5 text-white/40" />
                          {mounted && (
                            <input
                              type="text"
                              placeholder="https://github.com/username/repository"
                              value={repoUrl}
                              onChange={(e) => setRepoUrl(e.target.value)}
                              className="w-full bg-transparent text-base outline-none placeholder:text-white/30"
                            />
                          )}
                        </div>

                        {recentRepos.length > 0 && (
                          <div className="mt-3 text-sm text-white/45">
                            Recently analyzed:{" "}
                              <span className="text-cyan-300">
                              {recentRepos[0].replace(/\/+$/, "").split("/").pop()}
                            </span>
                          </div>
                        )}
                      </div>
  
                      <button
                        onClick={() => analyzeRepo()}
                        disabled={loading}
                        className="inline-flex min-h-[58px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-7 py-4 text-base font-semibold text-black shadow-[0_0_30px_rgba(34,211,238,0.22)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60 xl:min-w-[260px]"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-5 w-5" />
                            Analyze Repository
                          </>
                        )}
                      </button>
                    </div>

                    {error && (
                      <div className="mt-4 flex items-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                        <AlertCircle className="h-4 w-4" />
                        {error}
                      </div>
                    )}
                  </div>

                  <div className="mt-8 grid flex-1 gap-4 md:grid-cols-3">
                    {homeFeatureCards.map((card) => {
                      const Icon = card.icon;

                      return (
                        <div
                          key={card.title}
                          className="flex h-full min-h-[220px] flex-col justify-between rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] p-5 shadow-[0_12px_30px_rgba(0,0,0,0.18)] transition hover:border-cyan-400/20 hover:bg-cyan-400/5"
                        >
                          <div>
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
                              <Icon className="h-5 w-5" />
                            </div>

                            <h3 className="mt-4 text-lg font-semibold text-white">
                              {card.title}
                            </h3>

                            <p className="mt-3 text-sm leading-7 text-white/60">
                              {card.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.section>
            )}

            {hasAnalysis && activeSection !== "home" && (
              <motion.section
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,16,34,0.96),rgba(5,9,22,0.98))] p-5 md:p-6"
              >
                {activeSection === "dashboard" && (
                  <div className="space-y-6">
                    <StatsCards stats={stats} />

                    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                      <div className="rounded-[28px] border border-white/10 bg-[#050b18] p-6">
                        <h2 className="text-2xl font-semibold text-white">Overview</h2>
                        <p className="mt-4 text-sm leading-7 text-white/65 md:text-base">
                          {summaryText}
                        </p>

                        {result?.summary?.top_level_folders?.length > 0 && (
                          <div className="mt-6">
                            <h3 className="mb-4 text-lg font-semibold text-white">
                              Top-Level Folders
                            </h3>
                            <div className="flex flex-wrap gap-3">
                              {result.summary.top_level_folders.map((folder, index) => (
                                <div
                                  key={`${folder}-${index}`}
                                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75"
                                >
                                  {folder}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {result?.summary?.top_level_files?.length > 0 && (
                          <div className="mt-6">
                            <h3 className="mb-4 text-lg font-semibold text-white">
                              Top-Level Files
                            </h3>
                            <div className="grid gap-3 md:grid-cols-2">
                              {result.summary.top_level_files.map((file, index) => (
                                <div
                                  key={`${file}-${index}`}
                                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70"
                                >
                                  {file}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="rounded-[28px] border border-white/10 bg-[#050b18] p-6">
                        <h2 className="text-2xl font-semibold text-white">
                          Core Modules
                        </h2>

                        <div className="mt-4 space-y-3">
                          {modules.length > 0 ? (
                            modules.map((module) => (
                              <div
                                key={module.id}
                                className="rounded-xl border border-white/10 bg-white/5 p-4"
                              >
                                <div className="text-sm font-semibold text-cyan-300">
                                  {module.name}
                                </div>
                                <div className="mt-2 text-sm leading-6 text-white/60">
                                  {module.description}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-sm text-white/45">
                              No module data available.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === "architecture" && (
                  <div className="space-y-6">
                    <div className="rounded-[28px] border border-white/10 bg-[#050b18] p-6">
                      <h2 className="text-2xl font-semibold text-white">
                        Architecture Graph
                      </h2>

                      <div className="mt-6 relative z-0 h-[720px] w-full overflow-hidden rounded-[24px] border border-white/10 bg-[#020817]">
                        {diagramLoading ? (
                          <div className="flex h-full items-center justify-center text-white/60">
                            <div className="flex items-center gap-3">
                              <Loader2 className="h-5 w-5 animate-spin" />
                              Loading architecture diagram...
                            </div>
                          </div>
                        ) : diagram ? (
                          <ArchitectureGraph diagram={diagram} />
                        ) : (
                          <div className="flex h-full items-center justify-center text-white/50">
                            Diagram data is not available.
                          </div>
                        )}
                      </div>
                    </div>

                    <ArchitectureIntelPanel intel={architectureIntel} />
                  </div>
                )}

                {activeSection === "languages" && (
                  <div className="rounded-[28px] border border-white/10 bg-[#050b18] p-6">
                    <h2 className="text-2xl font-semibold text-white">Languages</h2>

                    <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {languages.length > 0 ? (
                        languages.map((lang) => (
                          <div
                            key={lang.id}
                            className="rounded-2xl border border-white/10 bg-white/5 p-4"
                          >
                            <div className="text-sm font-semibold text-cyan-300">
                              {formatLanguageLabel(lang.name)}
                            </div>
                            <div className="mt-2 text-sm text-white/60">
                              {lang.value}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-white/45">
                          No language data available.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeSection === "summary" && <RepoSummary data={result} />}

                {activeSection === "repositories" && (
                  <div className="space-y-6">
                    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                      <RepoFileTree
                        tree={repoTree}
                        onFileClick={explainFileFromTree}
                      />

                      <div className="rounded-[28px] border border-white/10 bg-[#050b18] p-6">
                        <h2 className="text-2xl font-semibold text-white">
                          Raw Analysis Output
                        </h2>
                        <pre className="mt-4 max-h-[620px] overflow-auto rounded-2xl border border-white/10 bg-[#07101f] p-4 text-xs text-white/70">
                          {rawJson}
                        </pre>
                      </div>
                    </div>

                    <FileExplainer
                      selectedFile={selectedFile}
                      onClose={() => setSelectedFile(null)}
                      loading={fileLoading}
                    />
                  </div>
                )}

                {activeSection === "ai-explorer" && (
                  <RepoChat repoUrl={repoUrl} repoName={repoName} />
                )}
              </motion.section>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}