import { useState, useCallback, useMemo } from 'react';
import { 
  ReactFlow, 
  Controls, 
  Background, 
  MiniMap,
  Node, 
  Edge,
  Handle,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { WorkspaceItem, IdeaSnapshot } from '../types';
import { GitBranch, Clock, User, Zap, Play, RotateCcw } from 'lucide-react';

interface IdeaVersionTreeProps {
  item: WorkspaceItem;
  onRestore: (snapshotId: string) => void;
  onPivot: (prompt: string) => void;
  onCreateSnapshot: (label: string) => void;
  isSyncing?: boolean;
}

// Custom Node Component
const SnapshotNode = ({ data }: { data: any }) => {
  const isActive = data.isActive;
  const isAI = data.createdBy === 'ai';
  
  return (
    <div className={`px-4 py-3 shadow-lg rounded-xl border-2 transition-all w-[260px] ${
      isActive 
        ? 'bg-surface-container border-primary shadow-primary/20' 
        : 'bg-surface-container-low border-outline-variant hover:border-outline'
    }`}>
      <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-outline-variant" />
      
      <div className="flex items-center gap-2 mb-2">
        {isAI ? (
          <div className="w-6 h-6 rounded bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-purple-400" />
          </div>
        ) : (
          <div className="w-6 h-6 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-blue-400" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-on-surface truncate">{data.label}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <Clock className="w-2.5 h-2.5 text-text-muted" />
            <p className="text-[9px] font-mono text-text-muted">{new Date(data.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <div className="text-[10px] text-text-muted line-clamp-2 mt-2 bg-surface-container-lowest p-2 rounded border border-outline-variant/30">
        <span className="font-bold text-on-surface/80">Title:</span> {data.snapshotData?.title || 'Unknown'}
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={() => data.onRestore(data.id)}
          disabled={isActive || data.isSyncing}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-[10px] font-mono font-bold uppercase transition-colors ${
            isActive
              ? 'bg-primary/10 text-primary cursor-default'
              : 'bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant cursor-pointer disabled:opacity-50'
          }`}
        >
          {isActive ? 'Active' : (
            <>
              <RotateCcw className="w-3 h-3" /> Restore
            </>
          )}
        </button>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-outline-variant" />
    </div>
  );
};

const nodeTypes = {
  snapshotNode: SnapshotNode,
};

export function IdeaVersionTree({ item, onRestore, onPivot, onCreateSnapshot, isSyncing }: IdeaVersionTreeProps) {
  const [pivotPrompt, setPivotPrompt] = useState("");
  const [snapshotLabel, setSnapshotLabel] = useState("");
  const [isPivoting, setIsPivoting] = useState(false);

  const snapshots = item.snapshots || [];
  
  // Basic tree layout algorithm
  const { nodes, edges } = useMemo(() => {
    const ns: Node[] = [];
    const es: Edge[] = [];
    
    if (snapshots.length === 0) return { nodes: ns, edges: es };

    // Build adjacency list for tree
    const childrenMap = new Map<string | null, IdeaSnapshot[]>();
    snapshots.forEach(s => {
      const pId = s.parentSnapshotId;
      if (!childrenMap.has(pId)) childrenMap.set(pId, []);
      childrenMap.get(pId)!.push(s);
    });

    const NODE_WIDTH = 300;
    const NODE_HEIGHT = 200;

    // Recursive layout
    const layout = (nodeId: string | null, depth: number, offsetX: number): number => {
      const children = childrenMap.get(nodeId) || [];
      if (children.length === 0) return offsetX;
      
      let currentX = offsetX;
      children.forEach((child, index) => {
        const subtreeWidth = layout(child.id, depth + 1, currentX);
        const myX = currentX + (subtreeWidth - currentX) / 2;
        
        ns.push({
          id: child.id,
          type: 'snapshotNode',
          position: { x: myX, y: depth * NODE_HEIGHT },
          data: {
            id: child.id,
            label: child.label,
            createdAt: child.createdAt,
            createdBy: child.createdBy,
            snapshotData: child.data,
            isActive: item.activeSnapshotId === child.id,
            onRestore,
            isSyncing
          }
        });

        if (child.parentSnapshotId) {
          es.push({
            id: `e-${child.parentSnapshotId}-${child.id}`,
            source: child.parentSnapshotId,
            target: child.id,
            type: 'smoothstep',
            animated: item.activeSnapshotId === child.id,
            style: { stroke: item.activeSnapshotId === child.id ? 'var(--color-primary)' : 'var(--color-outline)' }
          });
        }

        currentX = subtreeWidth + NODE_WIDTH;
      });
      
      return currentX - NODE_WIDTH;
    };

    // Find root nodes (usually just one: parentSnapshotId === null)
    layout(null, 0, 0);

    return { nodes: ns, edges: es };
  }, [snapshots, item.activeSnapshotId, onRestore, isSyncing]);

  const handlePivot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pivotPrompt.trim() || isPivoting) return;
    setIsPivoting(true);
    await onPivot(pivotPrompt);
    setPivotPrompt("");
    setIsPivoting(false);
  };

  const handleSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!snapshotLabel.trim()) return;
    onCreateSnapshot(snapshotLabel);
    setSnapshotLabel("");
  };

  return (
    <div className="flex flex-col h-[700px] border border-outline-variant rounded-xl overflow-hidden bg-surface-container-lowest">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row gap-4 p-4 border-b border-outline-variant bg-surface-container-low items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-primary" />
          <div>
            <h3 className="text-sm font-bold text-on-surface">Version History</h3>
            <p className="text-[10px] font-mono text-text-muted">Branch and pivot your ideas</p>
          </div>
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
          <form onSubmit={handleSnapshot} className="flex flex-1 md:flex-initial gap-2">
            <input 
              type="text" 
              placeholder="Snapshot label..."
              value={snapshotLabel}
              onChange={e => setSnapshotLabel(e.target.value)}
              className="bg-surface-container text-xs px-3 py-1.5 rounded outline-none border border-outline-variant focus:border-primary/50 w-full md:w-40"
            />
            <button 
              type="submit"
              disabled={!snapshotLabel.trim() || isSyncing}
              className="px-3 py-1.5 bg-surface-container hover:bg-surface-container-high border border-outline-variant rounded text-xs font-mono cursor-pointer disabled:opacity-50"
            >
              Save
            </button>
          </form>

          <form onSubmit={handlePivot} className="flex flex-1 md:flex-initial gap-2">
            <input 
              type="text" 
              placeholder="AI Pivot (e.g. Make it B2B)..."
              value={pivotPrompt}
              onChange={e => setPivotPrompt(e.target.value)}
              className="bg-purple-500/5 text-xs px-3 py-1.5 rounded outline-none border border-purple-500/20 focus:border-purple-500/50 w-full md:w-56 text-on-surface"
            />
            <button 
              type="submit"
              disabled={!pivotPrompt.trim() || isPivoting || isSyncing}
              className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 rounded text-xs font-mono font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50 transition-colors"
            >
              {isPivoting ? <span className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" /> : <Zap className="w-3 h-3" />}
              PIVOT
            </button>
          </form>
        </div>
      </div>

      {/* React Flow Canvas */}
      <div className="flex-1 w-full h-full">
        {snapshots.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <GitBranch className="w-12 h-12 text-text-muted opacity-20 mb-4" />
            <p className="text-on-surface font-bold">No versions yet</p>
            <p className="text-text-muted text-xs max-w-sm mt-2">
              Create a manual snapshot to save your current state, or use AI Pivot to branch off into a new direction.
            </p>
          </div>
        ) : (
          <ReactFlow 
            nodes={nodes} 
            edges={edges} 
            nodeTypes={nodeTypes}
            fitView
            className="bg-surface-container-lowest"
          >
            <Background color="var(--color-outline-variant)" gap={16} />
            <Controls className="!bg-surface-container !border-outline-variant !fill-on-surface" />
          </ReactFlow>
        )}
      </div>
    </div>
  );
}
