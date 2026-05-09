"use client";

import { useState, useMemo, useCallback } from "react";
import {
  ReactFlow, Controls, Background, useNodesState, useEdgesState,
  type Node, type Edge, MarkerType, type NodeProps, type EdgeProps,
  BaseEdge, getBezierPath, Handle, Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, UserX, Smartphone, Camera, MapPin, FileText, Building2,
  Sparkles, LayoutGrid, GitBranch, Circle, X, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useData } from "@/lib/store";
import type { CorrelationNode, CorrelationEdge } from "@/types";

/* ------------------------------------------------------------------ */
/*  Node style config                                                  */
/* ------------------------------------------------------------------ */
const nodeStyleConfig: Record<string, {
  icon: typeof User;
  color: string;
  bg: string;
  border: string;
  shape: "circle" | "hexagon" | "rounded" | "rect";
}> = {
  victim:   { icon: User,       color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/40",   shape: "circle" },
  suspect:  { icon: UserX,      color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/40",    shape: "hexagon" },
  device:   { icon: Smartphone, color: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/40",  shape: "rounded" },
  cctv:     { icon: Camera,     color: "text-cyan-400",   bg: "bg-cyan-500/10",   border: "border-cyan-500/40",   shape: "rounded" },
  gps:      { icon: MapPin,     color: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/40",  shape: "rounded" },
  evidence: { icon: FileText,   color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/40", shape: "rounded" },
  location: { icon: Building2,  color: "text-gray-400",   bg: "bg-gray-500/10",   border: "border-gray-500/40",   shape: "rect" },
};

/* ------------------------------------------------------------------ */
/*  Custom Node                                                        */
/* ------------------------------------------------------------------ */
function CorrelationGraphNode({ data, type, selected }: NodeProps) {
  const cfg = nodeStyleConfig[type ?? ""] ?? nodeStyleConfig.location;
  const Icon = cfg.icon;

  const shapeClasses = (() => {
    switch (cfg.shape) {
      case "circle":
        return "rounded-full w-16 h-16";
      case "hexagon":
        return "w-16 h-[60px]";
      case "rounded":
        return "rounded-xl min-w-[130px] px-3 py-3";
      default:
        return "rounded-lg min-w-[110px] px-3 py-2";
    }
  })();

  const hexClipPath = "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";

  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} className="!bg-cyan-400 !w-2 !h-2 !border-0" />
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className={cn(
          "flex items-center justify-center border-2 backdrop-blur-md transition-all duration-300 cursor-grab active:cursor-grabbing",
          shapeClasses,
          cfg.bg, cfg.border,
          selected ? "shadow-[0_0_25px_rgba(0,245,255,0.3)] ring-2 ring-cyan-400/50" : "",
        )}
        style={cfg.shape === "hexagon" ? { clipPath: hexClipPath } : undefined}
      >
        <div className={cn(
          "flex flex-col items-center gap-1",
          cfg.shape === "circle" ? "p-0" : "",
        )}>
          <Icon className={cn("w-5 h-5", cfg.color)} />
          <span className={cn(
            "font-semibold text-center leading-tight",
            cfg.shape === "circle" ? "text-[9px]" : "text-[10px]",
            cfg.color,
          )}>
            {data.label as string}
          </span>
        </div>
      </motion.div>
      <Handle type="source" position={Position.Bottom} className="!bg-cyan-400 !w-2 !h-2 !border-0" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Custom Edge                                                        */
/* ------------------------------------------------------------------ */
function CorrelationGraphEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  const edgeData = data as { label?: string; confirmed?: boolean; suspicious?: boolean; confidence?: number } | undefined;
  const isConfirmed = edgeData?.confirmed ?? false;
  const isSuspicious = edgeData?.suspicious ?? false;
  const isAiSuspected = !isConfirmed && !isSuspicious;

  const strokeColor = isSuspicious ? "#EF4444" : isConfirmed ? "#10B981" : "#F59E0B";
  const strokeDash = isAiSuspected ? "6 4" : "none";
  const strokeWidth = selected ? 3 : 2;

  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: strokeColor,
          strokeWidth,
          strokeDasharray: strokeDash,
          filter: selected ? "drop-shadow(0 0 6px rgba(0,245,255,0.4))" : undefined,
        }}
      />
      {/* Edge label at midpoint */}
      {edgeData?.label && (
        <foreignObject
          x={midX - 50}
          y={midY - 14}
          width={100}
          height={28}
          className="overflow-visible"
        >
          <div className="flex items-center justify-center gap-1">
            <span
              className={cn(
                "px-2 py-0.5 rounded text-[9px] font-mono font-bold border whitespace-nowrap backdrop-blur-sm",
                isSuspicious
                  ? "bg-red-500/20 border-red-500/30 text-red-400"
                  : isConfirmed
                  ? "bg-green-500/20 border-green-500/30 text-green-400"
                  : "bg-amber-500/20 border-amber-500/30 text-amber-400",
              )}
            >
              {edgeData.label}
              {isAiSuspected && " ?"}
            </span>
          </div>
        </foreignObject>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Suspected Link Card                                                */
/* ------------------------------------------------------------------ */
function SuspectLinkCard({
  edge,
  onAccept,
  onDismiss,
}: {
  edge: Edge;
  onAccept: () => void;
  onDismiss: () => void;
}) {
  const d = edge.data as { label?: string; confidence?: number } | undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50 }}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md transition-all",
        edge.data && (edge.data as Record<string, unknown>).suspicious
          ? "bg-red-500/10 border-red-500/30"
          : "bg-amber-500/10 border-amber-500/30",
      )}
    >
      <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-200 truncate">
          {edge.source} → {edge.target}
        </p>
        <p className="text-[10px] text-gray-400 font-mono mt-0.5">
          {d?.label ?? "Unknown"} &middot; {d?.confidence ?? 0}% confidence
        </p>
      </div>
      <div className="flex gap-1 shrink-0">
        <button
          onClick={onAccept}
          className="p-1.5 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 transition-all"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onDismiss}
          className="p-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function CorrelationPage() {
  const { correlationNodes, correlationEdges, addCorrelationEdge, deleteCorrelationEdge, updateCorrelationEdge, dispatch } = useData();

  /* ----- convert store data to ReactFlow format ----- */
  const initialNodes: Node[] = useMemo(() => correlationNodes.map((n: CorrelationNode, i) => ({
    id: n.id,
    type: "correlationNode",
    position: {
      x: 100 + Math.sin((i / correlationNodes.length) * Math.PI * 2) * 250,
      y: 100 + Math.cos((i / correlationNodes.length) * Math.PI * 2) * 200,
    },
    data: { label: n.label, ...n.data },
  })), [correlationNodes]);

  const initialEdges: Edge[] = useMemo(() => correlationEdges.map((e: CorrelationEdge) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    type: "correlationEdge",
    data: {
      label: e.label,
      confirmed: e.confirmed,
      suspicious: e.suspicious,
      confidence: e.confidence,
    },
    markerEnd: e.confirmed
      ? { type: MarkerType.ArrowClosed, color: "#10B981" }
      : { type: MarkerType.ArrowClosed, color: e.suspicious ? "#EF4444" : "#F59E0B" },
    style: e.suspicious
      ? { stroke: "#EF4444" }
      : e.confirmed
      ? { stroke: "#10B981" }
      : { stroke: "#F59E0B", strokeDasharray: "6 4" },
  })), [correlationEdges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [layout, setLayout] = useState<"force" | "hierarchical" | "circular">("circular");
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);

  const nodeTypes = useMemo(() => ({ correlationNode: CorrelationGraphNode }), []);
  const edgeTypes = useMemo(() => ({ correlationEdge: CorrelationGraphEdge }), []);

  /* ----- suspected links (AI-suggested or suspicious) ----- */
  const suspectEdges = useMemo(
    () => edges.filter((e) => {
      const d = e.data as { suspicious?: boolean; confirmed?: boolean } | undefined;
      return d && (!d.confirmed || d.suspicious);
    }),
    [edges],
  );

  /* ----- layout switching ----- */
  const applyLayout = useCallback((type: typeof layout) => {
    setLayout(type);
    const centerX = 400;
    const centerY = 300;
    const count = nodes.length;

    setNodes((nds) =>
      nds.map((n, i) => {
        let x: number, y: number;
        switch (type) {
          case "circular": {
            const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
            const radius = Math.min(250, 180 + count * 8);
            x = centerX + Math.cos(angle) * radius;
            y = centerY + Math.sin(angle) * radius;
            break;
          }
          case "hierarchical": {
            const col = i % 3;
            const row = Math.floor(i / 3);
            x = 100 + col * 220;
            y = 80 + row * 150;
            break;
          }
          default: {
            const angle = Math.random() * Math.PI * 2;
            const radius = 120 + Math.random() * 200;
            x = centerX + Math.cos(angle) * radius;
            y = centerY + Math.sin(angle) * radius;
          }
        }
        return { ...n, position: { x, y } };
      }),
    );
  }, [nodes.length, setNodes]);

  /* ----- AI Suggest Links ----- */
  const handleAiSuggest = useCallback(() => {
    setShowAiSuggestions(true);
    const edgeId1 = `ai-suggested-${Date.now()}`;
    const aiEdge: Edge = {
      id: edgeId1,
      source: "S-001",
      target: "V-001",
      type: "correlationEdge",
      data: { label: "AI-suspected contact", confirmed: false, suspicious: true, confidence: 67 },
      style: { stroke: "#EF4444" },
      markerEnd: { type: MarkerType.ArrowClosed, color: "#EF4444" },
      animated: true,
    };
    setEdges((eds) => [...eds, aiEdge]);
    dispatch({ type: "ADD_CORRELATION_EDGE", payload: { id: edgeId1, source: "S-001", target: "V-001", label: "AI-suspected contact", confirmed: false, suspicious: true, confidence: 67 } });

    const edgeId2 = `ai-suggested-${Date.now() + 1}`;
    const aiEdge2: Edge = {
      id: edgeId2,
      source: "D-001",
      target: "D-002",
      type: "correlationEdge",
      data: { label: "Possible connection", confirmed: false, suspicious: false, confidence: 54 },
      style: { stroke: "#F59E0B", strokeDasharray: "6 4" },
      markerEnd: { type: MarkerType.ArrowClosed, color: "#F59E0B" },
      animated: true,
    };
    setEdges((eds) => [...eds, aiEdge2]);
    dispatch({ type: "ADD_CORRELATION_EDGE", payload: { id: edgeId2, source: "D-001", target: "D-002", label: "Possible connection", confirmed: false, suspicious: false, confidence: 54 } });
  }, [setEdges, dispatch]);

  const handleAcceptEdge = useCallback((edgeId: string) => {
    setEdges((eds) =>
      eds.map((e) =>
        e.id === edgeId
          ? { ...e, data: { ...(e.data as object), confirmed: true, suspicious: false }, style: { stroke: "#10B981" }, markerEnd: { type: MarkerType.ArrowClosed, color: "#10B981" }, animated: false }
          : e,
      ),
    );
    updateCorrelationEdge(edgeId, { confirmed: true, suspicious: false });
  }, [setEdges, updateCorrelationEdge]);

  const handleDismissEdge = useCallback((edgeId: string) => {
    setEdges((eds) => eds.filter((e) => e.id !== edgeId));
    deleteCorrelationEdge(edgeId);
  }, [setEdges, deleteCorrelationEdge]);

  return (
    <div className="relative h-[calc(100vh-100px)] animate-grid-bg -m-6">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        minZoom={0.3}
        maxZoom={2}
        defaultEdgeOptions={{
          type: "correlationEdge",
          style: { strokeWidth: 2 },
        }}
      >
        <Background color="rgba(0,245,255,0.06)" gap={30} />
        <Controls className="!bg-[#0B1020]/90 !border !border-cyan-500/20 !rounded-xl !backdrop-blur-md [&_button]:!text-gray-400 [&_button]:!border-none [&_button]:!bg-transparent" />
      </ReactFlow>

      {/* Floating Controls — Top Right */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass p-2 space-y-1.5 min-w-[140px]"
        >
          <button
            onClick={handleAiSuggest}
            disabled={showAiSuggestions}
            className={cn(
              "flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium border transition-all",
              showAiSuggestions
                ? "bg-green-500/20 border-green-500/30 text-green-400"
                : "bg-amber-500/20 border-amber-500/30 text-amber-400 hover:bg-amber-500/30",
            )}
          >
            <Sparkles className="w-3.5 h-3.5" />
            {showAiSuggestions ? "Suggested!" : "AI Suggest Links"}
          </button>

          <div className="border-t border-white/10 pt-1.5 space-y-1">
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider px-1">Layout</p>
            {(["force", "hierarchical", "circular"] as const).map((l) => (
              <button
                key={l}
                onClick={() => applyLayout(l)}
                className={cn(
                  "flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  layout === l
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                    : "text-gray-500 hover:text-gray-300",
                )}
              >
                {l === "force" ? <Circle className="w-3 h-3" /> :
                 l === "hierarchical" ? <GitBranch className="w-3 h-3" /> :
                 <LayoutGrid className="w-3 h-3" />}
                {l.charAt(0).toUpperCase() + l.slice(1)}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="glass p-3 space-y-1.5 min-w-[140px]"
        >
          <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Legend</p>
          <div className="space-y-1">
            {[
              { label: "Confirmed", color: "bg-green-500", dash: false },
              { label: "AI-suspected", color: "bg-amber-500", dash: true },
              { label: "Suspicious", color: "bg-red-500", dash: false },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-[10px] text-gray-400">
                <div className={cn(
                  "w-4 h-0.5 rounded-full",
                  item.color,
                  item.dash && "bg-dashed",
                )}
                  style={item.dash ? { backgroundImage: "linear-gradient(90deg, transparent 50%, #F59E0B 50%)", backgroundSize: "6px 100%" } : undefined}
                />
                {item.label}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom Panel — Suspected Links */}
      <AnimatePresence>
        {suspectEdges.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="absolute bottom-4 left-4 right-4 z-10 glass p-4 max-h-[180px] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-amber-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                AI-Suspected Links ({suspectEdges.length})
              </h3>
              <button
                onClick={() => setEdges((eds) => eds.filter((e) => {
                  const d = e.data as { confirmed?: boolean } | undefined;
                  return d?.confirmed;
                }))}
                className="text-xs text-gray-500 hover:text-gray-300"
              >
                Dismiss All
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {suspectEdges.map((edge) => (
                <div key={edge.id} className="min-w-[240px] shrink-0">
                  <SuspectLinkCard
                    edge={edge}
                    onAccept={() => handleAcceptEdge(edge.id)}
                    onDismiss={() => handleDismissEdge(edge.id)}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
