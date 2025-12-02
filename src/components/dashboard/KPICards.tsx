import { TrendingUp, TrendingDown, Users, AlertTriangle, DollarSign, PieChart, Shield, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface KPICardProps {
  title: string;
  value: string;
  change: string;
  changeType: "up" | "down";
  subtitle: string;
  icon: React.ReactNode;
}

function KPICard({ title, value, change, changeType, subtitle, icon }: KPICardProps) {
  const isPositive = changeType === "up";
  
  return (
    <Card className="glass-card border-border/50 hover-lift">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold">{value}</h3>
              <div className={`flex items-center gap-1 text-sm ${isPositive ? "text-success" : "text-destructive"}`}>
                {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span className="font-medium">{change}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface KPICardsProps {
  stats?: {
    totalCustomers: number;
    highRiskCustomers: number;
    mediumRiskCustomers: number;
    lowRiskCustomers: number;
    totalWallets: number;
    undeclaredWallets: number;
    averageRiskScore: number;
  };
  loading?: boolean;
}

export function KPICards({ stats, loading = false }: KPICardsProps) {
  // Format numbers
  const formatNumber = (num: number) => new Intl.NumberFormat('en-ZA').format(num);
  
  // Calculate percentages
  const highRiskPercentage = stats && stats.totalCustomers > 0 ? 
    Math.round((stats.highRiskCustomers / stats.totalCustomers) * 100) : 0;
  
  const mediumRiskPercentage = stats && stats.totalCustomers > 0 ? 
    Math.round((stats.mediumRiskCustomers / stats.totalCustomers) * 100) : 0;
  
  const undeclaredPercentage = stats && stats.totalWallets > 0 ? 
    Math.round((stats.undeclaredWallets / stats.totalWallets) * 100) : 0;

  const kpis = [
    {
      title: "TOTAL CUSTOMERS",
      value: stats ? formatNumber(stats.totalCustomers) : "0",
      change: "+0%",
      changeType: "up" as const,
      subtitle: "From XML imports",
      icon: <Users className="w-6 h-6 text-primary" />
    },
    {
      title: "HIGH-RISK CUSTOMERS",
      value: stats ? formatNumber(stats.highRiskCustomers) : "0",
      change: `${highRiskPercentage}%`,
      changeType: stats && stats.highRiskCustomers > 0 ? "up" as const : "down" as const,
      subtitle: `${highRiskPercentage}% of total`,
      icon: <AlertTriangle className="w-6 h-6 text-destructive" />
    },
    {
      title: "MEDIUM RISK",
      value: stats ? formatNumber(stats.mediumRiskCustomers) : "0",
      change: `${mediumRiskPercentage}%`,
      changeType: stats && stats.mediumRiskCustomers > 0 ? "up" as const : "down" as const,
      subtitle: `${mediumRiskPercentage}% of total`,
      icon: <Shield className="w-6 h-6 text-warning" />
    },
    {
      title: "AVG. RISK SCORE",
      value: stats ? `${Math.round(stats.averageRiskScore)}` : "0",
      change: "0%",
      changeType: stats && stats.averageRiskScore < 50 ? "down" as const : "up" as const,
      subtitle: "Lower is better",
      icon: <PieChart className="w-6 h-6 text-accent" />
    },
    {
      title: "TOTAL WALLETS",
      value: stats ? formatNumber(stats.totalWallets) : "0",
      change: "+0%",
      changeType: "up" as const,
      subtitle: "Across all customers",
      icon: <Wallet className="w-6 h-6 text-primary" />
    },
    {
      title: "UNDECLARED WALLETS",
      value: stats ? formatNumber(stats.undeclaredWallets) : "0",
      change: `${undeclaredPercentage}%`,
      changeType: stats && stats.undeclaredWallets > 0 ? "up" as const : "down" as const,
      subtitle: `${undeclaredPercentage}% of total`,
      icon: <AlertTriangle className="w-6 h-6 text-destructive" />
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        {[...Array(6)].map((_, idx) => (
          <div key={idx} className="animate-pulse">
            <Card className="glass-card border-border/50">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                    <div className="h-8 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-full"></div>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-muted"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
      {kpis.map((kpi, idx) => (
        <div key={kpi.title} className="animate-scale-in" style={{ animationDelay: `${idx * 0.1}s` }}>
          <KPICard {...kpi} />
        </div>
      ))}
    </div>
  );
}