import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { KPICards } from "@/components/dashboard/KPICards";
import { RiskDistributionChart } from "@/components/dashboard/RiskDistributionChart";
import { LiveMarketPrices } from "@/components/dashboard/LiveMarketPrices";
import { RecentAlertsTable } from "@/components/dashboard/RecentAlertsTable";
import { 
  RefreshCw, 
  FileDown, 
  User, 
  AlertCircle, 
  FileText, 
  Users, 
  Shield, 
  ClipboardList, 
  Settings, 
  LogOut,
  Home,
  BarChart3,
  ArrowLeft,
  Bell,
  MoreVertical,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Your APIs
const CUSTOMERS_API_ENDPOINT = `${import.meta.env.VITE_API_BASE_URL}/customers`;
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  // Fetch all dashboard data on mount
  useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Close sidebar when clicking outside or navigating
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [sidebarOpen]);

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

  const handleSidebarNavigation = (path: string) => {
    setSidebarOpen(false);
    navigate(path);
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar - Always visible */}
      <div className="hidden md:block">
        <DashboardSidebar 
          lastUpdated={getTimeAgo()} 
          onNavigation={handleSidebarNavigation}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      <div className={`md:hidden ${sidebarOpen ? 'fixed inset-0 z-50' : 'hidden'}`}>
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
        
        {/* Sidebar Panel */}
        <div className="fixed inset-y-0 left-0 z-50 w-full max-w-xs bg-background shadow-xl transition-transform duration-300 ease-in-out">
          <div className="h-full overflow-y-auto">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-primary" />
                </div>
                <h2 className="text-lg font-semibold">Menu</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Sidebar Content */}
            <div className="p-4">
              <DashboardSidebar 
                lastUpdated={getTimeAgo()} 
                onNavigation={handleSidebarNavigation}
                mobile={true}
              />
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 w-full md:ml-[280px] transition-all">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b">
          <div className="px-4 py-3 md:px-6 md:py-4">
            <div className="flex items-center justify-between gap-4">
              {/* Logo/Title - Left */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Mobile Menu Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(true)}
                  className="h-9 w-9 md:hidden"
                >
                  <Menu className="w-5 h-5" />
                </Button>

                {/* Desktop Icon and Title */}
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                  <h1 className="text-base md:text-2xl font-bold">Dashboard</h1>
                </div>
              </div>
              
              {/* Status Text - Center (Desktop only) */}
              <div className="hidden md:flex flex-1 items-center justify-center text-sm text-muted-foreground">
                <span>Updated: {getTimeAgo()}</span>
              </div>

              {/* Action Buttons - Right */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Mobile More Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="h-9 w-9 md:hidden"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleRefresh} disabled={isRefreshing}>
                      <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                      {isRefreshing ? "Refreshing..." : "Refresh"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExport} disabled={!dashboardStats || isLoading}>
                      <FileDown className="mr-2 h-4 w-4" />
                      Export
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/reports')}>
                      <FileText className="mr-2 h-4 w-4" />
                      Reports
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Admin</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => navigate('/customers')}>
                      <Users className="mr-2 h-4 w-4" />
                      User Management
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/roles-permissions')}>
                      <Shield className="mr-2 h-4 w-4" />
                      Roles & Permissions
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/audit-log')}>
                      <ClipboardList className="mr-2 h-4 w-4" />
                      Audit Log
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/settings')}>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => toast.info("Logout functionality coming soon")} className="text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Desktop Buttons */}
                <div className="hidden md:flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="h-9 gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                    {isRefreshing ? "Refreshing..." : "Refresh"}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleExport}
                    disabled={!dashboardStats || isLoading}
                    className="h-9 gap-2"
                  >
                    <FileDown className="h-4 w-4" />
                    Export
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/reports')}
                    className="h-9 gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Reports
                  </Button>
                  
                  {/* Desktop Admin Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-9 gap-2"
                      >
                        <User className="h-4 w-4" />
                        Admin
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Admin Panel</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('/customers')}>
                        <Users className="mr-2 h-4 w-4" />
                        User Management
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/roles-permissions')}>
                        <Shield className="mr-2 h-4 w-4" />
                        Roles & Permissions
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/audit-log')}>
                        <ClipboardList className="mr-2 h-4 w-4" />
                        Audit Log
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('/settings')}>
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toast.info("Logout functionality coming soon")} className="text-destructive">
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {/* Mobile Status - Below main header */}
            <div className="md:hidden mt-2 text-xs text-muted-foreground">
              <div>Last updated: {getTimeAgo()}</div>
              {dashboardStats && (
                <div>{dashboardStats.totalCustomers} customers • {dashboardStats.totalWallets} wallets</div>
              )}
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          
          {/* Error Banner */}
          {hasError && (
            <div className="mb-4 md:mb-6">
              <div className="flex items-start gap-2 p-3 md:p-4 rounded-lg bg-destructive/10 border border-destructive/20">
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
            <div className="flex items-center justify-center py-12 md:py-16">
              <div className="text-center space-y-4">
                <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                <div>
                  <p className="text-muted-foreground">Loading dashboard data...</p>
                  <div className="flex gap-4 justify-center text-xs text-muted-foreground mt-2">
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
            </div>
          ) : (
            <div className="space-y-6 md:space-y-8">
              <KPICards stats={dashboardStats} loading={isLoading} />
              
              {/* Charts Section */}
              <div className="space-y-6 md:space-y-0 md:grid md:grid-cols-2 md:gap-6">
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
              
              {/* Recent Alerts */}
              <RecentAlertsTable alerts={dashboardStats?.recentAlerts} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;