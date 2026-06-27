'use client';

import { useState, useEffect, useRef } from 'react';

interface GraphNode {
  id: string;
  title: string;
  authors: string;
  year: number;
  citations: number;
  cluster: string;
  x: number;
  y: number;
}

interface GraphEdge {
  source: string;
  target: string;
  weight: number;
}

export default function Home() {
  const [paperId, setPaperId] = useState('');
  const [graph, setGraph] = useState<{ nodes: GraphNode[]; edges: GraphEdge[] } | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (graph && canvasRef.current) {
      drawGraph();
    }
  }, [graph]);

  const drawGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas || !graph) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw edges
    graph.edges.forEach(edge => {
      const source = graph.nodes.find(n => n.id === edge.source);
      const target = graph.nodes.find(n => n.id === edge.target);
      if (source && target) {
        ctx.beginPath();
        ctx.moveTo(source.x * canvas.width, source.y * canvas.height);
        ctx.lineTo(target.x * canvas.width, target.y * canvas.height);
        ctx.strokeStyle = `rgba(100, 200, 100, ${edge.weight})`;
        ctx.lineWidth = edge.weight * 3;
        ctx.stroke();
      }
    });

    // Draw nodes
    graph.nodes.forEach(node => {
      const x = node.x * canvas.width;
      const y = node.y * canvas.height;
      const radius = Math.min(30, 10 + node.citations / 50);

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, '#10b981');
      gradient.addColorStop(1, '#059669');
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.fillStyle = 'white';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(node.title.substring(0, 15), x, y + radius + 12);
    });
  };

  const handleVisualize = async () => {
    if (!paperId) return;
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/visualize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paper_id: paperId, depth: 2 }),
      });
      const data = await res.json();
      if (data.success) setGraph(data.data);
    } catch (error) {
      console.error('Visualization failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!graph || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    const node = graph.nodes.find(n => 
      Math.abs(n.x - x) < 0.05 && Math.abs(n.y - y) < 0.05
    );
    setSelectedNode(node || null);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-900 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="text-5xl">🕸️</span>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              Connected Papers
            </h1>
          </div>
          <p className="text-gray-300 text-lg">Visualize and map research connections</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700 shadow-2xl mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              value={paperId}
              onChange={(e) => setPaperId(e.target.value)}
              placeholder="Enter paper title or DOI..."
              className="flex-1 px-6 py-4 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-violet-500"
            />
            <button
              onClick={handleVisualize}
              disabled={!paperId || loading}
              className="px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 rounded-xl font-semibold transition-all disabled:opacity-50"
            >
              {loading ? 'Visualizing...' : '🕸️ Visualize'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
            <canvas
              ref={canvasRef}
              width={600}
              height={400}
              onClick={handleCanvasClick}
              className="w-full h-96 bg-slate-900 rounded-xl cursor-crosshair"
            />
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
            {selectedNode ? (
              <div>
                <h3 className="text-xl font-bold text-violet-400 mb-4">Selected Paper</h3>
                <h4 className="font-bold mb-2">{selectedNode.title}</h4>
                <p className="text-gray-400 text-sm mb-2">{selectedNode.authors}</p>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 bg-slate-700/30 rounded-lg">
                    <p className="text-gray-400 text-xs">Year</p>
                    <p className="font-bold">{selectedNode.year}</p>
                  </div>
                  <div className="p-3 bg-slate-700/30 rounded-lg">
                    <p className="text-gray-400 text-xs">Citations</p>
                    <p className="font-bold">{selectedNode.citations}</p>
                  </div>
                </div>
                <div className="p-3 bg-violet-900/30 rounded-lg border border-violet-700">
                  <p className="text-sm text-violet-300">Cluster: {selectedNode.cluster}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-4xl mb-4">📊</p>
                <p className="text-gray-400">Click a node to view details</p>
              </div>
            )}
          </div>
        </div>

        {graph && (
          <div className="mt-6 grid grid-cols-4 gap-4">
            <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700 text-center">
              <p className="text-2xl font-bold text-violet-400">{graph.nodes.length}</p>
              <p className="text-gray-400 text-sm">Papers</p>
            </div>
            <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700 text-center">
              <p className="text-2xl font-bold text-purple-400">{graph.edges.length}</p>
              <p className="text-gray-400 text-sm">Connections</p>
            </div>
            <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700 text-center">
              <p className="text-2xl font-bold text-pink-400">{graph.nodes.length > 0 ? Math.round(graph.edges.length / graph.nodes.length) : 0}</p>
              <p className="text-gray-400 text-sm">Avg. Citations</p>
            </div>
            <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700 text-center">
              <p className="text-2xl font-bold text-blue-400">3</p>
              <p className="text-gray-400 text-sm">Clusters</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
