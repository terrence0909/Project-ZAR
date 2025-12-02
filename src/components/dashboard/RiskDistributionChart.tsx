import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, AlertCircle, AlertTriangle } from "lucide-react";

interface RiskDistributionChartProps {
  riskDistribution?: {
    low: number;
    medium: number;
    high: number;
  };
  totalCustomers?: number;
  totalWallets?: number;
}

export function RiskDistributionChart({ 
  riskDistribution = { low: 0, medium: 0, high: 0 },
  totalCustomers = 0,
  totalWallets = 0
}: RiskDistributionChartProps) {
  
  // Calculate percentages
  const calculatePercentage = (count: number) => {
    const total = riskDistribution.low + riskDistribution.medium + riskDistribution.high;
    return total > 0 ? Math.round((count / total) * 100) : 0;
  };

  const chartData = [
    { 
      label: "Low Risk (0-30)", 
      count: riskDistribution.low, 
      percentage: calculatePercentage(riskDistribution.low), 
      color: "bg-success",
      icon: <Shield className="w-4 h-4 text-success" />
    },
    { 
      label: "Medium Risk (31-70)", 
      count: riskDistribution.medium, 
      percentage: calculatePercentage(riskDistribution.medium), 
      color: "bg-warning",
      icon: <AlertCircle className="w-4 h-4 text-warning" />
    },
    { 
      label: "High Risk (71-100)", 
      count: riskDistribution.high, 
      percentage: calculatePercentage(riskDistribution.high), 
      color: "bg-destructive",
      icon: <AlertTriangle className="w-4 h-4 text-destructive" />
    }
  ];

  // If no data, show loading skeleton
  if (totalCustomers === 0 && riskDistribution.low === 0 && riskDistribution.medium === 0 && riskDistribution.high === 0) {
    return (
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="text-xl">Customer Risk Distribution</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {[...Array(3)].map((_, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-4 bg-muted rounded w-1/3"></div>
                <div className="h-4 bg-muted rounded w-1/4"></div>
              </div>
              <div className="h-3 bg-muted rounded-full"></div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-border/50">
      <CardHeader>
        <CardTitle className="text-xl">Customer Risk Distribution</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {chartData.map((risk, idx) => (
          <div key={risk.label} className="space-y-2 animate-fade-in" style={{ animationDelay: `${idx * 0.1}s` }}>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {risk.icon}
                <span className="font-medium">{risk.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground">{risk.percentage}%</span>
                <span className="font-bold min-w-[60px] text-right">{risk.count}</span>
              </div>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full ${risk.color} transition-all duration-1000 ease-out rounded-full`}
                style={{ 
                  width: `${risk.percentage}%`,
                  animationDelay: `${idx * 0.2}s`
                }}
              />
            </div>
          </div>
        ))}
        
        <div className="pt-4 border-t border-border/50">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Customers</span>
            <span className="font-bold">{totalCustomers}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-muted-foreground">Total Wallets Analyzed</span>
            <span className="font-bold">{riskDistribution.low + riskDistribution.medium + riskDistribution.high}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}