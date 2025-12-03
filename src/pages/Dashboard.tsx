import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { KPICards } from "@/components/dashboard/KPICards";
import { RiskDistributionChart } from "@/components/dashboard/RiskDistributionChart";
import { LiveMarketPrices } from "@/components/dashboard/LiveMarketPrices";
import { RecentAlertsTable } from "@/components/dashboard/RecentAlertsTable";
import { RefreshCw, FileDown, User, AlertCircle, Menu, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

// Your APIs
const CUSTOMERS_API_ENDPOINT = 'https://4yhpt4dlwe.execute-api.us-east-1.amazonaws.com/dev/customers';
const LUNO_API_ENDPOINT = 'https://6duobrslvyityfkazhdl2e4cpu0qqacs.lambda-url.us-east-1.on.aws/';

interface DashboardStats {
  totalCustomers: number;
  highRiskCustomers: number;
  mediumRiskCustomers: number;
  lowRiskCustomers: number;
  totalWallets: number;
  undeclaredWallets: number;
  averageRiskScore: number;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
  };
  recentAlerts?: Array<{
    id: string;
    type: string;
    customer: string;
    wallet: string;
    riskScore: number;
    timestamp: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}

interface MarketPrice {
  pair: string;
  pair_display: string;
  last_trade: number;
  bid: number;
  ask: number;
  change: number;
  trend: "up" | "down";
  volume: string;
  timestamp: number;
}

const Dashboard = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([]);
  const [lunoError, setLunoError] = useState<string | null>(null);
  const [customersError, setCustomersError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch all dashboard data on mount
  useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchLunoData = async () => {
    try {
      console.log("📈 Fetching Luno market data...");
      
      const response = await fetch(LUNO_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        throw new Error(`Luno API error: ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ Luno data received:", data);
      
      if (data.market_prices && Array.isArray(data.market_prices)) {
        setMarketPrices(data.market_prices);
      }
      setLunoError(null);
      
    } catch (err) {
      console.error('❌ Luno fetch error:', err);
      setLunoError(err instanceof Error ? err.message : 'Failed to load Luno data');
    }
  };

  const fetchCustomersData = async () => {
    try {
      console.log("📊 Fetching customers data for dashboard...");
      
      const response = await fetch(CUSTOMERS_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: "",
          query_type: "get_customers"
        })
      });

      if (!response.ok) {
        throw new Error(`Customers API error: ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ Customers data received:", data);
      
      // Transform API data to dashboard stats
      const stats = calculateDashboardStats(data);
      setDashboardStats(stats);
      setCustomersError(null);
      
    } catch (err) {
      console.error('❌ Customers fetch error:', err);
      setCustomersError(err instanceof Error ? err.message : 'Failed to load customer data');
    }
  };

  const fetchDashboardData = async () => {
    try {
      setIsRefreshing(true);
      setCustomersError(null);
      setLunoError(null);
      
      // Fetch both data sources in parallel
      await Promise.all([
        fetchCustomersData(),
        fetchLunoData()
      ]);
      
      setLastUpdated(new Date());
      
    } catch (err) {
      console.error('❌ Dashboard fetch error:', err);
      toast.error("Failed to load some dashboard data");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const calculateDashboardStats = (apiData: any): DashboardStats => {
    const customers = apiData.customers || [];
    
    // Calculate risk distribution
    const lowRisk = customers.filter((c: any) => (c.average_risk_score || 0) < 30).length;
    const mediumRisk = customers.filter((c: any) => {
      const score = c.average_risk_score || 0;
      return score >= 30 && score < 70;
    }).length;
    const highRisk = customers.filter((c: any) => (c.average_risk_score || 0) >= 70).length;
    
    // Calculate total wallets
    const totalWallets = customers.reduce((sum: number, c: any) => sum + (c.wallet_count || 0), 0);
    
    // Calculate undeclared wallets
    const undeclaredWallets = customers.reduce((sum: number, c: any) => {
      return sum + (c.wallets?.filter((w: any) => !w.declared).length || 0);
    }, 0);
    
    // Calculate average risk score
    const totalRisk = customers.reduce((sum: number, c: any) => sum + (c.average_risk_score || 0), 0);
    const averageRiskScore = customers.length > 0 ? totalRisk / customers.length : 0;
    
    // Generate alerts from high-risk and undeclared wallets
    const recentAlerts = customers
      .filter((c: any) => (c.average_risk_score || 0) >= 70 || c.wallets?.some((w: any) => !w.declared))
      .slice(0, 5)
      .map((customer: any, index: number) => {
        const hasUndeclared = customer.wallets?.some((w: any) => !w.declared);
        const isHighRisk = (customer.average_risk_score || 0) >= 70;
        
        return {
          id: `alert-${customer.customer_id || index}`,
          type: hasUndeclared ? 'Undeclared Wallet' : 'High Risk Customer',
          customer: `${customer.first_name} ${customer.last_name}`,
          wallet: customer.primary_wallet || (customer.wallets && customer.wallets[0]?.address) || 'N/A',
          riskScore: Math.round(customer.average_risk_score || 0),
          timestamp: new Date(Date.now() - (index * 3600000)).toISOString(),
          severity: isHighRisk ? 'high' as const : hasUndeclared ? 'medium' as const : 'low' as const
        };
      });
    
    return {
      totalCustomers: customers.length,
      highRiskCustomers: highRisk,
      mediumRiskCustomers: mediumRisk,
      lowRiskCustomers: lowRisk,
      totalWallets,
      undeclaredWallets,
      averageRiskScore: Math.round(averageRiskScore),
      riskDistribution: {
        low: lowRisk,
        medium: mediumRisk,
        high: highRisk
      },
      recentAlerts
    };
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    toast.info("Refreshing dashboard data...");
    
    try {
      await fetchDashboardData();
      toast.success("Dashboard refreshed");
    } catch (err) {
      toast.error("Failed to refresh dashboard");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExport = () => {
    try {
      if (!dashboardStats) {
        toast.error("No data to export");
        return;
      }

      const exportData = {
        dashboardStats,
        marketPrices,
        exportedAt: new Date().toISOString(),
        customerCount: dashboardStats.totalCustomers,
        riskDistribution: dashboardStats.riskDistribution
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dashboard-export-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast.success("Dashboard report exported");
    } catch (err) {
      console.error('Export error:', err);
      toast.error("Failed to export report");
    }
  };

  const getTimeAgo = () => {
    const seconds = Math.floor((new Date().getTime() - lastUpdated.getTime()) / 1000);
    if (seconds < 60) return `${seconds} sec ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;
    return `${Math.floor(hours / 24)} day ago`;
  };

  const hasError = customersError || lunoError;

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar lastUpdated={getTimeAgo()} />
      
      <main className="flex-1 md:ml-[280px] transition-all pt-16 md:pt-0">
        {/* Header Bar - Mobile Responsive */}
        <header className="sticky top-0 z-10 glass-card border-b border-border/50 backdrop-blur-md px-4 py-3 md:px-6 md:py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center justify-between md:justify-start gap-3">
              <div className="md:hidden flex items-center gap-2">
                <h1 className="text-xl font-bold">Crypto Risk</h1>
              </div>
              <div className="hidden md:flex items-center gap-4">
                <h1 className="text-2xl font-bold">Crypto Risk Overview</h1>
                <div className="text-xs text-muted-foreground hidden md:block">
                  Last updated: {lastUpdated.toLocaleTimeString('en-ZA', { 
                    hour: '2-digit', 
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between md:justify-end gap-2">
              <div className="text-xs text-muted-foreground md:hidden">
                Updated: {getTimeAgo()}
              </div>
              
              <div className="flex items-center gap-1 md:gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/reports')}
                  className="h-9 w-9 md:h-10 md:w-auto md:gap-2"
                  title="Reports"
                >
                  <FileText className="h-4 w-4" />
                  <span className="hidden md:inline">Reports</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="h-9 w-9 md:h-10 md:w-auto md:gap-2"
                  title="Refresh"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                  <span className="hidden md:inline">
                    {isRefreshing ? "Refreshing..." : "Refresh"}
                  </span>
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleExport}
                  disabled={!dashboardStats || isLoading}
                  className="h-9 w-9 md:h-10 md:w-auto md:gap-2"
                  title="Export"
                >
                  <FileDown className="h-4 w-4" />
                  <span className="hidden md:inline">Export</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-9 w-9 md:h-10 md:w-auto md:gap-2 hidden md:flex"
                  title="Admin"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden md:inline">Admin</span>
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-3 md:p-6 space-y-4 md:space-y-6">
          
          {/* Error Banner - Mobile Responsive */}
          {hasError && (
            <div className="flex flex-col gap-2 p-3 md:p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-destructive">API Connection Issues</div>
                  <div className="text-xs text-destructive/80 mt-1 space-y-0.5">
                    {customersError && <div>• Customers API: {customersError}</div>}
                    {lunoError && <div>• Luno API: {lunoError}</div>}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefresh}
                      className="text-xs h-7"
                    >
                      Retry
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && !dashboardStats ? (
            <div className="flex items-center justify-center py-8 md:py-12">
              <div className="text-center space-y-3">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                <p className="text-muted-foreground">Loading dashboard data...</p>
                <div className="flex gap-4 justify-center text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <span>Customer Data</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-success"></div>
                    <span>Luno Market Data</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <KPICards stats={dashboardStats} loading={isLoading} />
              
              <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-6">
                <RiskDistributionChart 
                  riskDistribution={dashboardStats?.riskDistribution} 
                  totalCustomers={dashboardStats?.totalCustomers}
                />
                <LiveMarketPrices 
                  marketPrices={marketPrices}
                  onRefresh={fetchLunoData}
                  loading={isLoading && marketPrices.length === 0}
                  lastUpdate={lastUpdated}
                  error={lunoError}
                />
              </div>
              
              <RecentAlertsTable alerts={dashboardStats?.recentAlerts} />
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;