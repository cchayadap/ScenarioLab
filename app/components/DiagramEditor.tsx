"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  ConnectionMode,
  Controls,
  Handle,
  MarkerType,
  Position,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
} from "reactflow";
import "reactflow/dist/style.css";
import { AnswerDiagram, AnswerDiagramNode } from "@/lib/types";

type NodeKind = AnswerDiagramNode["kind"];

let counter = 0;
function nextId(prefix: string) {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}_${counter}`;
}

function shapeClass(selected: boolean) {
  return `border bg-panel text-[13px] font-mono text-center leading-tight ${
    selected ? "border-stamp" : "border-paperLine"
  }`;
}

function StartNode({ data, selected }: NodeProps<{ label: string }>) {
  return (
    <div className={`${shapeClass(!!selected)} rounded-full px-4 py-2 min-w-[90px]`}>
      <Handle type="target" position={Position.Top} className="!bg-inkFaint" />
      {data.label}
      <Handle type="source" position={Position.Bottom} className="!bg-inkFaint" />
    </div>
  );
}

function ProcessNode({ data, selected }: NodeProps<{ label: string }>) {
  return (
    <div className={`${shapeClass(!!selected)} px-4 py-2 min-w-[110px]`}>
      <Handle type="target" position={Position.Top} className="!bg-inkFaint" />
      {data.label}
      <Handle type="source" position={Position.Bottom} className="!bg-inkFaint" />
    </div>
  );
}

// The node's bounding box is an unrotated square, so Top/Right/Bottom/Left handle positions
// land exactly on the diamond's four visual points (rotating a square 45° turns its corners
// into the box's top/right/bottom/left centers) — one handle pair per point below.
const DECISION_CORNERS = [Position.Top, Position.Right, Position.Bottom, Position.Left];

function DecisionNode({ data, selected }: NodeProps<{ label: string }>) {
  return (
    <div className="relative w-[110px] h-[110px]">
      <div className={`${shapeClass(!!selected)} absolute inset-[6px] rotate-45`} />
      <div className="absolute inset-0 flex items-center justify-center text-center text-[12px] font-mono px-5 leading-tight">
        {data.label}
      </div>
      {DECISION_CORNERS.map((pos) => (
        <Handle key={`t-${pos}`} type="target" position={pos} id={`t-${pos}`} className="!bg-inkFaint" />
      ))}
      {DECISION_CORNERS.map((pos) => (
        <Handle key={`s-${pos}`} type="source" position={pos} id={`s-${pos}`} className="!bg-inkFaint" />
      ))}
    </div>
  );
}

const nodeTypes: NodeTypes = { start: StartNode, process: ProcessNode, decision: DecisionNode };

const DEFAULT_LABEL: Record<NodeKind, string> = {
  start: "Start",
  process: "Step",
  decision: "Decision?",
};

function toFlowNodes(diagram: AnswerDiagram): Node[] {
  return diagram.nodes.map((n) => ({
    id: n.id,
    type: n.kind,
    position: { x: n.x, y: n.y },
    data: { label: n.label },
  }));
}

function toFlowEdges(diagram: AnswerDiagram): Edge[] {
  return diagram.edges.map((e) => ({ id: e.id, source: e.source, target: e.target, label: e.label }));
}

export default function DiagramEditor({
  initialDiagram,
  onChange,
  readOnly = false,
}: {
  initialDiagram?: AnswerDiagram;
  onChange?: (diagram: AnswerDiagram) => void;
  readOnly?: boolean;
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState(
    initialDiagram ? toFlowNodes(initialDiagram) : []
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    initialDiagram ? toFlowEdges(initialDiagram) : []
  );
  const [selected, setSelected] = useState<{ id: string; kind: "node" | "edge" } | null>(null);

  // One-way sync up to the parent (which just holds the last snapshot for submission) — the
  // canvas itself owns the live editing state, so this never needs to sync back down.
  useEffect(() => {
    if (!onChange) return;
    onChange({
      nodes: nodes.map((n) => ({
        id: n.id,
        kind: (n.type as NodeKind) || "process",
        label: (n.data as { label?: string }).label || "",
        x: n.position.x,
        y: n.position.y,
      })),
      edges: edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: typeof e.label === "string" ? e.label : undefined,
      })),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges]);

  const onConnect = useCallback(
    (connection: Connection) =>
      setEdges((eds) =>
        addEdge(
          { ...connection, id: nextId("e"), markerEnd: { type: MarkerType.ArrowClosed } },
          eds
        )
      ),
    [setEdges]
  );

  const selectedLabel = useMemo(() => {
    if (!selected) return "";
    if (selected.kind === "node") {
      return (nodes.find((n) => n.id === selected.id)?.data as { label?: string })?.label ?? "";
    }
    return (edges.find((e) => e.id === selected.id)?.label as string) ?? "";
  }, [selected, nodes, edges]);

  function updateSelectedLabel(value: string) {
    if (!selected) return;
    if (selected.kind === "node") {
      setNodes((nds) =>
        nds.map((n) => (n.id === selected.id ? { ...n, data: { ...n.data, label: value } } : n))
      );
    } else {
      setEdges((eds) => eds.map((e) => (e.id === selected.id ? { ...e, label: value } : e)));
    }
  }

  function deleteSelected() {
    if (!selected) return;
    if (selected.kind === "node") {
      setNodes((nds) => nds.filter((n) => n.id !== selected.id));
      setEdges((eds) => eds.filter((e) => e.source !== selected.id && e.target !== selected.id));
    } else {
      setEdges((eds) => eds.filter((e) => e.id !== selected.id));
    }
    setSelected(null);
  }

  function addNode(kind: NodeKind) {
    const stagger = nodes.length * 28;
    const id = nextId(kind);
    setNodes((nds) => [
      ...nds,
      {
        id,
        type: kind,
        position: { x: 40 + (stagger % 280), y: 30 + stagger },
        data: { label: DEFAULT_LABEL[kind] },
      },
    ]);
  }

  return (
    <div className="border border-paperLine">
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-2 border-b border-paperLine bg-panel px-3 py-2">
          <button
            onClick={() => addNode("start")}
            className="border border-paperLine px-2.5 py-1 text-xs font-mono hover:border-stamp"
          >
            + start/end
          </button>
          <button
            onClick={() => addNode("process")}
            className="border border-paperLine px-2.5 py-1 text-xs font-mono hover:border-stamp"
          >
            + step
          </button>
          <button
            onClick={() => addNode("decision")}
            className="border border-paperLine px-2.5 py-1 text-xs font-mono hover:border-stamp"
          >
            + decision
          </button>
          <span className="text-[11px] text-inkFaint font-mono hidden sm:inline">
            drag from a node's edge to connect
          </span>
          <div className="flex-1" />
          {selected && (
            <>
              <input
                autoFocus
                value={selectedLabel}
                onChange={(e) => updateSelectedLabel(e.target.value)}
                placeholder="label..."
                className="border border-paperLine bg-paper px-2 py-1 text-xs font-mono outline-none focus:border-stamp w-32"
              />
              <button
                onClick={deleteSelected}
                className="border border-bad text-bad px-2.5 py-1 text-xs font-mono hover:bg-bad hover:text-paper"
              >
                delete
              </button>
            </>
          )}
        </div>
      )}
      <div style={{ height: 320 }} className="bg-paper">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={readOnly ? undefined : onNodesChange}
          onEdgesChange={readOnly ? undefined : onEdgesChange}
          onConnect={readOnly ? undefined : onConnect}
          onNodeClick={readOnly ? undefined : (_, node) => setSelected({ id: node.id, kind: "node" })}
          onEdgeClick={readOnly ? undefined : (_, edge) => setSelected({ id: edge.id, kind: "edge" })}
          onPaneClick={readOnly ? undefined : () => setSelected(null)}
          nodesDraggable={!readOnly}
          nodesConnectable={!readOnly}
          elementsSelectable={!readOnly}
          connectionMode={ConnectionMode.Loose}
          panOnDrag
          zoomOnScroll
          fitView
          defaultEdgeOptions={{
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { stroke: "#5b6472" },
            labelStyle: { fontFamily: "ui-monospace, monospace", fontSize: 11, fill: "#161b22" },
            labelBgStyle: { fill: "#f8f9fb" },
          }}
        >
          <Background gap={16} color="#c3cad4" />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    </div>
  );
}
