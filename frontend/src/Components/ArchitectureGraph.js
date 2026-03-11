"use client";

import { useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MarkerType,
} from "reactflow";
import dagre from "dagre";
import "reactflow/dist/style.css";

const NODE_WIDTH = 240;
const NODE_HEIGHT = 64;

function shorten(text, max = 34) {
  if (!text) return "";
  if (text.length <= max) return text;
  return "..." + text.slice(-(max - 3));
}

function createLayout(nodes, edges, direction = "TB") {
  const dagreGraph = new dagre.graphlib.Graph();

  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: direction,
    ranksep: 100,
    nodesep: 55,
    marginx: 30,
    marginy: 30,
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const position = dagreGraph.node(node.id);

    return {
      ...node,
      position: {
        x: position.x - NODE_WIDTH / 2,
        y: position.y - NODE_HEIGHT / 2,
      },
      sourcePosition: "bottom",
      targetPosition: "top",
    };
  });

  return {
    nodes: layoutedNodes,
    edges,
  };
}

function baseNodeStyle(color) {
  return {
    background: "#0f172a",
    color: "#ffffff",
    border: `1px solid ${color}`,
    borderRadius: "16px",
    width: NODE_WIDTH,
    minHeight: NODE_HEIGHT,
    fontSize: "13px",
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "10px 14px",
    boxShadow: "0 10px 28px rgba(0,0,0,0.25)",
  };
}

function groupNodeStyle() {
  return {
    background: "#111827",
    color: "#67e8f9",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "16px",
    width: NODE_WIDTH,
    minHeight: NODE_HEIGHT,
    fontSize: "14px",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "10px 14px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.22)",
  };
}

function childNodeStyle() {
  return {
    background: "#1e293b",
    color: "#ffffff",
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: "14px",
    width: NODE_WIDTH,
    minHeight: NODE_HEIGHT,
    fontSize: "12px",
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "10px 14px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
  };
}

function edgeStyle(color, width = 1.15, dashed = false) {
  return {
    stroke: color,
    strokeWidth: width,
    strokeDasharray: dashed ? "5 5" : "0",
  };
}

function buildGraph(diagram) {
  const nodes = [];
  const edges = [];

  const repoName =
    diagram?.repository ||
    diagram?.repo_name ||
    "Repository";

  const keyFiles = diagram?.key_files || {};

  nodes.push({
    id: "input",
    data: { label: "User / Input" },
    style: baseNodeStyle("#a78bfa"),
    position: { x: 0, y: 0 },
  });

  nodes.push({
    id: "repo",
    data: { label: `Repository: ${repoName}` },
    style: baseNodeStyle("#22d3ee"),
    position: { x: 0, y: 0 },
  });

  nodes.push({
    id: "output",
    data: { label: "Output / Response" },
    style: baseNodeStyle("#10b981"),
    position: { x: 0, y: 0 },
  });

  edges.push({
    id: "input-repo",
    source: "input",
    target: "repo",
    type: "smoothstep",
    markerEnd: { type: MarkerType.ArrowClosed },
    style: edgeStyle("#94a3b8", 1.2, true),
  });

  const groups = [
    { key: "entrypoints", title: "Entrypoints" },
    { key: "routes", title: "Routes" },
    { key: "services", title: "Services" },
    { key: "tools", title: "Tools" },
    { key: "models", title: "Models" },
    { key: "configs", title: "Configs" },
    { key: "prompts", title: "Prompts" },
    { key: "utils", title: "Utils" },
  ];

  const groupIds = {};
  const firstChildIds = {};

  groups.forEach((group) => {
    const items = (keyFiles[group.key] || []).slice(0, 3);

    if (items.length === 0) return;

    const groupId = `group-${group.key}`;
    groupIds[group.key] = groupId;

    nodes.push({
      id: groupId,
      data: { label: group.title },
      style: groupNodeStyle(),
      position: { x: 0, y: 0 },
    });

    edges.push({
      id: `repo-${group.key}`,
      source: "repo",
      target: groupId,
      type: "smoothstep",
      markerEnd: { type: MarkerType.ArrowClosed },
      style: edgeStyle("#64748b"),
    });

    items.forEach((item, index) => {
      const childId = `${group.key}-${index}`;

      if (index === 0) {
        firstChildIds[group.key] = childId;
      }

      nodes.push({
        id: childId,
        data: { label: shorten(item) },
        style: childNodeStyle(),
        position: { x: 0, y: 0 },
      });

      edges.push({
        id: `${groupId}-${childId}`,
        source: groupId,
        target: childId,
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed },
        style: edgeStyle("#475569", 1.2),
      });
    });
  });

  if (firstChildIds.entrypoints && groupIds.routes) {
    edges.push({
      id: "entry-routes",
      source: firstChildIds.entrypoints,
      target: groupIds.routes,
      type: "smoothstep",
      markerEnd: { type: MarkerType.ArrowClosed },
      style: edgeStyle("#7dd3fc", 1.25),
    });
  }

  if (groupIds.routes && groupIds.services) {
    edges.push({
      id: "routes-services",
      source: groupIds.routes,
      target: groupIds.services,
      type: "smoothstep",
      markerEnd: { type: MarkerType.ArrowClosed },
      style: edgeStyle("#60a5fa", 1.25),
    });
  }

  if (groupIds.services && groupIds.models) {
    edges.push({
      id: "services-models",
      source: groupIds.services,
      target: groupIds.models,
      type: "smoothstep",
      markerEnd: { type: MarkerType.ArrowClosed },
      style: edgeStyle("#818cf8", 1.25),
    });
  }

  if (groupIds.services && groupIds.utils) {
    edges.push({
      id: "services-utils",
      source: groupIds.services,
      target: groupIds.utils,
      type: "smoothstep",
      markerEnd: { type: MarkerType.ArrowClosed },
      style: edgeStyle("#c084fc", 1.25),
    });
  }

  if (groupIds.tools && groupIds.prompts) {
    edges.push({
      id: "tools-prompts",
      source: groupIds.tools,
      target: groupIds.prompts,
      type: "smoothstep",
      markerEnd: { type: MarkerType.ArrowClosed },
      style: edgeStyle("#f472b6", 1.25),
    });
  }

  if (groupIds.tools && groupIds.configs) {
    edges.push({
      id: "tools-configs",
      source: groupIds.tools,
      target: groupIds.configs,
      type: "smoothstep",
      markerEnd: { type: MarkerType.ArrowClosed },
      style: edgeStyle("#f59e0b", 1.25),
    });
  }

  const outputSource =
    groupIds.models ||
    groupIds.services ||
    groupIds.tools ||
    groupIds.entrypoints ||
    "repo";

  edges.push({
    id: "final-output",
    source: outputSource,
    target: "output",
    type: "smoothstep",
    markerEnd: { type: MarkerType.ArrowClosed },
    style: edgeStyle("#10b981", 1.35, true),
  });

  return { nodes, edges };
}

export default function ArchitectureGraph({ diagram }) {
  const graphData = useMemo(() => {
    if (!diagram) return { nodes: [], edges: [] };

    const raw = buildGraph(diagram);
    return createLayout(raw.nodes, raw.edges, "TB");
  }, [diagram]);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={graphData.nodes}
        edges={graphData.edges}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        panOnDrag
        zoomOnScroll
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          type: "smoothstep",
        }}
      >
        <Controls className="!rounded-xl !border !border-white/10 !bg-[#081120] !shadow-none" />
        <Background gap={20} size={1} color="#1e293b" />
      </ReactFlow>
    </div>
  );
}