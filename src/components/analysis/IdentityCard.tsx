import { FileText, Download, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface IdentityCardProps {
  data: {
    name: string;
    sa_id: string;
    vasp: string;
    declared_wallets: any[];
    undeclared_wallets: any[];
  };
}

const IdentityCard = ({ data }: IdentityCardProps) => {
  const handleGenerateReport = () => {
    toast.success("Generating compliance report...");
  };

  const handleExport = () => {
    toast.success("Exporting data...");
  };

  const handleAddToWatchlist = () => {
    toast.success("Added to watchlist");
  };

  return (
    <div className="glass-card p-6 rounded-xl">
      <div className="grid lg:grid-cols-[1fr_auto] gap-6">
        {/* Left: Identity Info */}
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold mb-1">{data.name}</h2>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="mono text-muted-foreground">SA ID: {data.sa_id}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">VASP: {data.vasp}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-success/10 border-success/30 text-success">
              {data.declared_wallets.length} wallet{data.declared_wallets.length !== 1 ? 's' : ''} declared
            </Badge>
            <Badge variant="outline" className="bg-warning/10 border-warning/30 text-warning">
              {data.undeclared_wallets.length} undeclared found
            </Badge>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex flex-col gap-3">
          <Button 
            onClick={handleGenerateReport}
            className="bg-primary hover:bg-primary/90"
          >
            <FileText className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
          <Button 
            onClick={handleExport}
            variant="outline"
            className="hover:bg-muted/50"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
          <Button 
            onClick={handleAddToWatchlist}
            variant="outline"
            className="hover:bg-muted/50"
          >
            <Mail className="w-4 h-4 mr-2" />
            Add to Watchlist
          </Button>
        </div>
      </div>
    </div>
  );
};

export default IdentityCard;
