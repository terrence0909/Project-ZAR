import { AlertTriangle, ShieldAlert, ShieldCheck, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RiskFlag {
  title: string;
  description: string;
  severity: "low" | "medium" | "high";
  evidence: string;
  timestamp: string;
}

interface RiskFlagsProps {
  flags: RiskFlag[];
}

const RiskFlags = ({ flags }: RiskFlagsProps) => {
  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case "high":
        return {
          icon: <ShieldAlert className="w-5 h-5" />,
          color: "danger",
          label: "High Risk"
        };
      case "medium":
        return {
          icon: <AlertTriangle className="w-5 h-5" />,
          color: "warning",
          label: "Medium Risk"
        };
      default:
        return {
          icon: <ShieldCheck className="w-5 h-5" />,
          color: "success",
          label: "Low Risk"
        };
    }
  };

  return (
    <div className="glass-card p-6 rounded-xl">
      <div className="flex items-center gap-2 mb-6">
        <Info className="w-5 h-5 text-muted-foreground" />
        <h2 className="text-2xl font-bold">Risk Flags & Alerts</h2>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {flags.map((flag, idx) => {
          const config = getSeverityConfig(flag.severity);
          
          return (
            <div
              key={idx}
              className={`glass-card p-4 rounded-lg border-${config.color}/30 bg-${config.color}/5 hover-lift`}
            >
              <div className="flex items-start gap-3">
                <div className={`text-${config.color} mt-1`}>
                  {config.icon}
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold">{flag.title}</h3>
                    <Badge 
                      variant="outline" 
                      className={`bg-${config.color}/10 border-${config.color}/30 text-${config.color} text-xs`}
                    >
                      {config.label}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    {flag.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-medium">{flag.evidence}</span>
                    <span>{new Date(flag.timestamp).toLocaleDateString()}</span>
                  </div>
                  
                  <button className="text-xs text-primary hover:underline">
                    View transactions →
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RiskFlags;
