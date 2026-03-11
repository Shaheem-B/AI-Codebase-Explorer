"use client";

import { ChevronRight, ChevronDown, Folder, FileCode2 } from "lucide-react";
import { useState } from "react";

function TreeNode({ node, onFileClick, level = 0 }) {
  const [open, setOpen] = useState(level < 1);

  const isDirectory = node.type === "directory";

  return (
    <div>
      <div
        className={`flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm transition hover:bg-white/5 ${
          isDirectory ? "text-white/75" : "text-white/65"
        }`}
        style={{ paddingLeft: `${12 + level * 16}px` }}
        onClick={() => {
          if (isDirectory) {
            setOpen(!open);
          } else {
            onFileClick?.(node.path);
          }
        }}
      >
        {isDirectory ? (
          open ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-white/40" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-white/40" />
          )
        ) : (
          <div className="w-4" />
        )}

        {isDirectory ? (
          <Folder className="h-4 w-4 shrink-0 text-cyan-300" />
        ) : (
          <FileCode2 className="h-4 w-4 shrink-0 text-purple-300" />
        )}

        <span className="truncate">{node.name}</span>
      </div>

      {isDirectory && open && Array.isArray(node.children) && node.children.length > 0 && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              onFileClick={onFileClick}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function RepoFileTree({ tree = [], onFileClick }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-[#050b18] p-5">
      <h2 className="text-2xl font-semibold text-white">Repository File Tree</h2>
      <p className="mt-2 text-sm text-white/55">
        Browse repository files and click any file to inspect and explain it with AI.
      </p>

      <div className="mt-5 max-h-[620px] overflow-y-auto rounded-2xl border border-white/10 bg-[#07101f] p-3">
        {tree.length > 0 ? (
          tree.map((node) => (
            <TreeNode key={node.path} node={node} onFileClick={onFileClick} />
          ))
        ) : (
          <div className="px-3 py-4 text-sm text-white/45">
            No repository tree available yet.
          </div>
        )}
      </div>
    </div>
  );
}