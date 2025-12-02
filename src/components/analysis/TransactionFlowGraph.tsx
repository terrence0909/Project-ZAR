import { useState } from "react";
import { ZoomIn, ZoomOut, Maximize2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Wallet {
  address: string;
  blockchain: string;
  risk_score: number;
  declared: boolean;
}

interface TransactionFlowGraphProps {
  wallets: Wallet[];
}

const TransactionFlowGraph = ({ wallets }: TransactionFlowGraphProps) => {
  const [showExchanges, setShowExchanges] = useState(true);
  const [showMixers, setShowMixers] = useState(true);
  const [zoom, setZoom] = useState(1);

  const handleExport = () => {
    toast.success("Graph exported as PNG");
  };

  // Simplified visual representation
  const getRiskColor = (score: number) => {
    if (score <= 30) return "#2d5a3d";
    if (score <= 70) return "#b8860b";
    return "#c85a3a";
  };

  return (
    <div className="glass-card p-6 rounded-xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Transaction Flow Visualization</h2>
        
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setZoom(Math.min(2, zoom + 0.1))}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setZoom(1)}
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleExport}
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <Button
          size="sm"
          variant={showExchanges ? "default" : "outline"}
          onClick={() => setShowExchanges(!showExchanges)}
        >
          Show Exchanges
        </Button>
        <Button
          size="sm"
          variant={showMixers ? "default" : "outline"}
          onClick={() => setShowMixers(!showMixers)}
        >
          Show Mixers
        </Button>
      </div>

      {/* Simplified Network Visualization */}
      <div className="relative bg-muted/20 rounded-lg p-8 min-h-[500px] overflow-auto">
        <div 
          className="relative w-full h-full flex items-center justify-center"
          style={{ transform: `scale(${zoom})`, transition: "transform 0.2s" }}
        >
          <svg width="100%" height="500" viewBox="0 0 800 500" className="max-w-full">
            {/* Central Customer Node */}
            <g>
              <circle cx="400" cy="250" r="40" fill="#2d5a3d" opacity="0.8" />
              <text x="400" y="255" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
                Customer
              </text>
              <text x="400" y="320" textAnchor="middle" fill="#f5f1ed" fontSize="10">
                Primary Wallet
              </text>
            </g>

            {/* Declared Wallet */}
            <g>
              <line x1="400" y1="250" x2="250" y2="150" stroke="#2d5a3d" strokeWidth="2" opacity="0.6" />
              <circle cx="250" cy="150" r="30" fill="#2d5a3d" opacity="0.6" stroke="#f5f1ed" strokeWidth="2" />
              <text x="250" y="155" textAnchor="middle" fill="white" fontSize="10">
                Declared
              </text>
            </g>

            {/* Undeclared Wallets */}
            {wallets.slice(1, 4).map((wallet, idx) => {
              const angle = (idx * 90) + 45;
              const radius = 150;
              const x = 400 + radius * Math.cos((angle * Math.PI) / 180);
              const y = 250 + radius * Math.sin((angle * Math.PI) / 180);
              const color = getRiskColor(wallet.risk_score);

              return (
                <g key={idx}>
                  <line x1="400" y1="250" x2={x} y2={y} stroke={color} strokeWidth="2" opacity="0.6" strokeDasharray="5,5" />
                  <circle cx={x} cy={y} r="25" fill={color} opacity="0.7" stroke="#f5f1ed" strokeWidth="1" strokeDasharray="3,3" />
                  <text x={x} y={y + 5} textAnchor="middle" fill="white" fontSize="9">
                    Risk {wallet.risk_score}
                  </text>
                </g>
              );
            })}

            {/* Exchange Node */}
            {showExchanges && (
              <g>
                <line x1="400" y1="250" x2="650" y2="250" stroke="#888" strokeWidth="1.5" opacity="0.4" />
                <circle cx="650" cy="250" r="20" fill="#555" opacity="0.6" />
                <text x="650" y="255" textAnchor="middle" fill="white" fontSize="9">
                  Exchange
                </text>
              </g>
            )}

            {/* Mixer Node */}
            {showMixers && (
              <g>
                <line x1="400" y1="250" x2="550" y2="400" stroke="#c85a3a" strokeWidth="2" opacity="0.7" />
                <circle cx="550" cy="400" r="25" fill="#c85a3a" opacity="0.7" />
                <text x="550" y="405" textAnchor="middle" fill="white" fontSize="9">
                  Mixer
                </text>
              </g>
            )}
          </svg>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 p-4 bg-muted/20 rounded-lg">
        <h3 className="text-sm font-semibold mb-3">Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-success border-2 border-foreground"></div>
            <span>Declared Wallets</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-success border border-foreground border-dashed"></div>
            <span>Undeclared Wallets</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-danger"></div>
            <span>High Risk Entities</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-muted"></div>
            <span>Exchanges</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionFlowGraph;
