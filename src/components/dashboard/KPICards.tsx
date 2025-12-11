import { TrendingUp, TrendingDown, Users, AlertTriangle, DollarSign, PieChart, Shield, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface KPICardProps {
  title: string;
  value: string;
  change: string;
  changeType: "up" | "down" | "neutral";
  trend?: number; // Optional: percentage trend from previous period
  subtitle: string;
  icon: React.ReactNode;
  isRiskMetric?: boolean; // True if lower is better (risk scores, high-risk count, etc)
}

function KPICard({ title, value, change, changeType, trend, subtitle, icon, isRiskMetric = false }: KPICardProps) {
  const isPositive = changeType === "up";
  
  // Determine trend direction and color based on whether it's a risk metric
  const getTrendColor = () => {
    if (trend === undefined || trend === 0) return "text-muted-foreground";
    
    if (isRiskMetric) {
      // For risk metrics: green if trend is down (good), red if trend is up (bad)
      return trend > 0 ? "text-destructive" : "text-success";
    } else {
      // For normal metrics: green if trend is up, red if trend is down
      return trend > 0 ? "text-success" : "text-destructive";
    }
  };

  const getTrendIcon = () => {
    if (trend === undefined || trend === 0) return null;
    
    if (isRiskMetric) {
      // For risk metrics: up arrow is bad, down arrow is good
      return trend > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />;
    } else {
      // For normal metrics: up arrow is good, down arrow is bad
      return trend > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />;
    }
  };
  
  return (
    <Card className="glass-card border-border/50 hover-lift transition-all duration-300">
      <CardContent className="p-4 md:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2 flex-1 min-w-0">
            <p className="text-xs md:text-sm text-muted-foreground font-medium uppercase tracking-wider">{title}</p>
            <div className="flex items-baseline gap-1 md:gap-2 flex-wrap">
              <h3 className="text-2xl md:text-3xl font-bold tabular-nums">{value}</h3>
              {trend !== undefined && trend !== 0 && (
                <div className={`flex items-center gap-1 text-xs md:text-sm font-semibold whitespace-nowrap ${getTrendColor()}`}>
                  {getTrendIcon()}
                  <span>{trend > 0 ? "+" : ""}{trend}%</span>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-1">{subtitle}</p>
          </div>
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
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
    totalCustomersTrend?: number;
    highRiskCustomers: number;
    highRiskTrend?: number;
    mediumRiskCustomers: number;
    mediumRiskTrend?: number;
    lowRiskCustomers: number;
    lowRiskTrend?: number;
    totalWallets: number;
    totalWalletsTrend?: number;
    undeclaredWallets: number;
    undeclaredWalletsTrend?: number;
    averageRiskScore: number;
    averageRiskScoreTrend?: number;
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
  
  const lowRiskPercentage = stats && stats.totalCustomers > 0 ? 
    Math.round((stats.lowRiskCustomers / stats.totalCustomers) * 100) : 0;

  const undeclaredPercentage = stats && stats.totalWallets > 0 ? 
    Math.round((stats.undeclaredWallets / stats.totalWallets) * 100) : 0;

  const kpis = [
    {
      title: "Total Customers",
      value: stats ? formatNumber(stats.totalCustomers) : "0",
      change: stats?.totalCustomersTrend ? `${stats.totalCustomersTrend > 0 ? "+" : ""}${stats.totalCustomersTrend}%` : "0%",
      changeType: "up" as const,
      trend: stats?.totalCustomersTrend,
      subtitle: "From XML imports",
      icon: <Users className="w-5 h-5 md:w-6 md:h-6 text-primary" />,
      isRiskMetric: false
    },
    {
      title: "High-Risk Customers",
      value: stats ? formatNumber(stats.highRiskCustomers) : "0",
      change: `${highRiskPercentage}%`,
      changeType: stats && stats.highRiskCustomers > 0 ? "up" as const : "down" as const,
      trend: stats?.highRiskTrend,
      subtitle: `${highRiskPercentage}% of total`,
      icon: <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-destructive" />,
      isRiskMetric: true // Lower is better
    },
    {
      title: "Medium Risk",
      value: stats ? formatNumber(stats.mediumRiskCustomers) : "0",
      change: `${mediumRiskPercentage}%`,
      changeType: stats && stats.mediumRiskCustomers > 0 ? "up" as const : "down" as const,
      trend: stats?.mediumRiskTrend,
      subtitle: `${mediumRiskPercentage}% of total`,
      icon: <Shield className="w-5 h-5 md:w-6 md:h-6 text-yellow-600 dark:text-yellow-500" />,
      isRiskMetric: true // Lower is better
    },
    {
      title: "Avg. Risk Score",
      value: stats ? `${Math.round(stats.averageRiskScore)}` : "0",
      change: "0%",
      changeType: stats && stats.averageRiskScore < 50 ? "down" as const : "up" as const,
      trend: stats?.averageRiskScoreTrend,
      subtitle: "Lower is better (0-100)",
      icon: <PieChart className="w-5 h-5 md:w-6 md:h-6 text-blue-600 dark:text-blue-400" />,
      isRiskMetric: true // Lower is better
    },
    {
      title: "Total Wallets",
      value: stats ? formatNumber(stats.totalWallets) : "0",
      change: stats?.totalWalletsTrend ? `${stats.totalWalletsTrend > 0 ? "+" : ""}${stats.totalWalletsTrend}%` : "0%",
      changeType: "up" as const,
      trend: stats?.totalWalletsTrend,
      subtitle: "Across all customers",
      icon: <Wallet className="w-5 h-5 md:w-6 md:h-6 text-primary" />,
      isRiskMetric: false
    },
    {
      title: "Undeclared Wallets",
      value: stats ? formatNumber(stats.undeclaredWallets) : "0",
      change: `${undeclaredPercentage}%`,
      changeType: stats && stats.undeclaredWallets > 0 ? "up" as const : "down" as const,
      trend: stats?.undeclaredWalletsTrend,
      subtitle: `${undeclaredPercentage}% of total`,
      icon: <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-destructive" />,
      isRiskMetric: true // Lower is better
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4 lg:gap-6">
        {[...Array(6)].map((_, idx) => (
          <div key={idx} className="animate-pulse">
            <Card className="glass-card border-border/50">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2 flex-1">
                    <div className="h-3 md:h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-6 md:h-8 bg-muted rounded w-full"></div>
                    <div className="h-2 md:h-3 bg-muted rounded w-full"></div>
                  </div>
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-muted flex-shrink-0"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4 lg:gap-6">
      {kpis.map((kpi, idx) => (
        <div 
          key={kpi.title} 
          className="animate-scale-in" 
          style={{ 
            animationDelay: `${idx * 0.08}s`,
            animationFillMode: 'both'
          }}
        >
          <KPICard {...kpi} />
        </div>
      ))}
    </div>
  );
}