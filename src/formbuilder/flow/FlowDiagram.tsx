// @ts-nocheck
import React, { useEffect, useMemo, useCallback } from 'react';
import styled from 'styled-components';
import type { FlowDefinition } from 'flow';
import ReactFlow, {
  useNodesState,
  useEdgesState,
  addEdge,
  MiniMap,
  Controls,
  Background,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type NodeChange,
  type EdgeChange,
  type Connection,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { DecisionNode } from './custom-nodes/DecisionNode';
import { ProcessingNode } from './custom-nodes/ProcessingNode';
import { VariableNode } from './custom-nodes/VariableNode';
import { LoopNode } from './custom-nodes/LoopNode';

// Alias to avoid collision with global DOM Node/Edge
type FlowNode = Node;
type FlowEdge = Edge;

const DiagramWrapper = styled.div`
  height: 100%;
`;

const nodeTypes = {
  decision: DecisionNode,
  process: ProcessingNode,
  variable: VariableNode,
  loop: LoopNode,
};

function mapType(type?: string): keyof typeof nodeTypes | 'default' {
  switch ((type || '').toLowerCase()) {
    case 'decision':
    case 'condicao':
    case 'condition':
      return 'decision';
    case 'process':
    case 'action':
    case 'acao':
      return 'process';
    case 'variable':
    case 'variavel':
      return 'variable';
    case 'loop':
      return 'loop';
    default:
      return 'default';
  }
}

export const FlowDiagram: React.FC<{
  flow: FlowDefinition;
  onChange?: (next: FlowDefinition) => void;
}> = ({ flow, onChange }) => {
  const initialNodes = useMemo<FlowNode[]>(() => {
    return (flow.steps || []).map((s) => ({
      id: s.id,
      type: mapType(s.type) as any,
      position: { x: s.x || 0, y: s.y || 0 },
      data: { label: s.label || s.type || s.id },
    }));
  }, [flow.steps]);

  const initialEdges = useMemo<FlowEdge[]>(() => {
    return (flow.connections || []).map((c) => ({
      id: c.id,
      source: c.fromStepId,
      target: c.toStepId,
      label: c.condition || undefined,
    }));
  }, [flow.connections]);

  const [nodes, setNodes, onNodesChangeHook] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChangeHook] = useEdgesState(initialEdges);

  // sincroniza quando fluxo externo mudar
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);
  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  const propagate = useCallback(
    (nextNodes: FlowNode[], nextEdges: FlowEdge[]) => {
      if (!onChange) return;
      const steps = (flow.steps || []).map((s) => {
        const n = nextNodes.find((nn) => nn.id === s.id);
        return {
          ...s,
          x: n?.position.x ?? s.x ?? 0,
          y: n?.position.y ?? s.y ?? 0,
        };
      });
      const connections = nextEdges.map((e) => ({
        id: e.id,
        fromStepId: e.source!,
        toStepId: e.target!,
        // mantém condição se já existir
        ...(flow.connections?.find((c) => c.id === e.id) ?? {}),
      }));
      onChange({ ...flow, steps, connections });
    },
    [flow, onChange]
  );

  const onNodesChange: OnNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChangeHook(changes);
      // após aplicar mudanças, propaga
      setNodes((curr: FlowNode[]) => {
        const next = curr.slice();
        propagate(next, edges);
        return next;
      });
    },
    [edges, onNodesChangeHook, propagate, setNodes]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChangeHook(changes);
      setEdges((curr: FlowEdge[]) => {
        const next = curr.slice();
        propagate(nodes, next);
        return next;
      });
    },
    [nodes, onEdgesChangeHook, propagate, setEdges]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds: FlowEdge[]) => {
        const added = addEdge({ ...connection, id: `${connection.source}-${connection.target}-${Date.now()}` }, eds);
        propagate(nodes, added);
        return added;
      });
    },
    [nodes, propagate, setEdges]
  );

  return (
    <DiagramWrapper>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <MiniMap />
        <Controls />
        <Background />
      </ReactFlow>
    </DiagramWrapper>
  );
};
