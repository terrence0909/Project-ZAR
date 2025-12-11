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
  X,
  TrendingUp,
  TrendingDown
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
const VALR_API_ENDPOINT = `${import.meta.env.VITE_API_BASE_URL}/valr`;

interface DashboardStats {
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
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
  };
  complianceStatus?: 'green' | 'amber' | 'red';
  recentAlerts?: Array<{
    id: string;
    type: string;
    customer: string;
    wallet: string;
    riskScore: number;
    timestamp: string;
    severity: 'low' | 'medium' | 'high';
    description?: string;
    customerId?: string; // Add this line
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

interface ValrBalance {
  currency: string;
  available: string;
  reserved: string;
  total: string;
}

interface DashboardCache {
  stats: DashboardStats;
  timestamp: number;
}

const Dashboard = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [previousStats, setPreviousStats] = useState<DashboardStats | null>(null);
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([]);
  const [valrBalances, setValrBalances] = useState<ValrBalance[]>([]);
  const [lunoError, setLunoError] = useState<string | null>(null);
  const [customersError, setCustomersError] = useState<string | null>(null);
  const [valrError, setValrError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshCountdown, setRefreshCountdown] = useState(60);
  const navigate = useNavigate();

  // Countdown timer for next refresh
  useEffect(() => {
    const countdownInterval = setInterval(() => {
      setRefreshCountdown(prev => {
        if (prev <= 1) {
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, []);

  // Fetch all dashboard data on mount
  useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh every 60 seconds
    const interval = setInterval(() => {
      setRefreshCountdown(60);
      fetchDashboardData();
    }, 60000);
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

  const fetchValrData = async () => {
    try {
      console.log("💰 Fetching VALR wallet balances...");
      
      const response = await fetch(VALR_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'balances' })
      });

      if (!response.ok) {
        throw new Error(`VALR API error: ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ VALR data received:", data);
      
      if (data.data && Array.isArray(data.data)) {
        setValrBalances(data.data);
      }
      setValrError(null);
      
    } catch (err) {
      console.error('❌ VALR fetch error:', err);
      setValrError(err instanceof Error ? err.message : 'Failed to load VALR data');
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
      
      // Save current stats as previous before updating
      if (dashboardStats) {
        setPreviousStats(dashboardStats);
      }
      
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
      setValrError(null);
      
      // Fetch all data sources in parallel
      await Promise.all([
        fetchCustomersData(),
        fetchLunoData(),
        fetchValrData()
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

  // Calculate trend between previous and current stats
  const calculateTrend = (current: number, previous: number | undefined): number | undefined => {
    if (previous === undefined || previous === 0) return undefined;
    return Math.round(((current - previous) / previous) * 100);
  };

  // Generate compliance alerts based on risk factors - UPDATED WITH customerId
  const generateComplianceAlerts = (customers: any[]): Array<{
    id: string;
    type: string;
    customer: string;
    wallet: string;
    riskScore: number;
    timestamp: string;
    severity: 'low' | 'medium' | 'high';
    description?: string;
    customerId?: string;
  }> => {
    const alerts = [];

    customers.forEach((customer: any, index: number) => {
      const riskScore = customer.average_risk_score || 0;
      const hasUndeclared = customer.wallets?.some((w: any) => !w.declared) || false;
      const walletCount = customer.wallet_count || 0;

      // High-risk customer alert
      if (riskScore >= 70) {
        alerts.push({
          id: `alert-high-risk-${customer.customer_id || index}`,
          type: 'High Risk Customer',
          customer: `${customer.first_name} ${customer.last_name}`,
          wallet: customer.primary_wallet || (customer.wallets?.[0]?.address) || 'N/A',
          riskScore: Math.round(riskScore),
          timestamp: new Date(Date.now() - (index * 3600000)).toISOString(),
          severity: 'high' as const,
          description: `Risk score of ${Math.round(riskScore)} exceeds threshold (70+)`,
          customerId: customer.customer_id // Add customerId
        });
      }

      // Undeclared wallet alert
      if (hasUndeclared) {
        const undeclaredCount = customer.wallets?.filter((w: any) => !w.declared).length || 0;
        alerts.push({
          id: `alert-undeclared-${customer.customer_id || index}`,
          type: 'Undeclared Wallet',
          customer: `${customer.first_name} ${customer.last_name}`,
          wallet: customer.wallets?.find((w: any) => !w.declared)?.address || 'N/A',
          riskScore: Math.round(riskScore),
          timestamp: new Date(Date.now() - ((index + 0.5) * 3600000)).toISOString(),
          severity: 'medium' as const,
          description: `${undeclaredCount} undeclared wallet(s) found`,
          customerId: customer.customer_id // Add customerId
        });
      }

      // Medium-risk escalation alert
      if (riskScore >= 50 && riskScore < 70) {
        alerts.push({
          id: `alert-medium-risk-${customer.customer_id || index}`,
          type: 'Medium Risk Alert',
          customer: `${customer.first_name} ${customer.last_name}`,
          wallet: customer.primary_wallet || (customer.wallets?.[0]?.address) || 'N/A',
          riskScore: Math.round(riskScore),
          timestamp: new Date(Date.now() - ((index + 1) * 3600000)).toISOString(),
          severity: 'medium' as const,
          description: `Risk score at ${Math.round(riskScore)} - monitoring required`,
          customerId: customer.customer_id // Add customerId
        });
      }
    });

    // Sort by severity (high first) and timestamp, return top 10
    return alerts
      .sort((a, b) => {
        const severityOrder = { high: 0, medium: 1, low: 2 };
        const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
        if (severityDiff !== 0) return severityDiff;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      })
      .slice(0, 10);
  };

  // Determine overall compliance status
  const getComplianceStatus = (stats: DashboardStats): 'green' | 'amber' | 'red' => {
    const highRiskPercentage = (stats.highRiskCustomers / stats.totalCustomers) * 100;
    const undeclaredPercentage = (stats.undeclaredWallets / stats.totalWallets) * 100;
    const avgRiskScore = stats.averageRiskScore;

    // Red: High risk or undeclared wallets > 20%
    if (highRiskPercentage > 15 || undeclaredPercentage > 20 || avgRiskScore > 60) {
      return 'red';
    }
    // Amber: Medium risk or some undeclared
    if (highRiskPercentage > 5 || undeclaredPercentage > 5 || avgRiskScore > 40) {
      return 'amber';
    }
    // Green: All good
    return 'green';
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
    
    // Generate improved alerts
    const recentAlerts = generateComplianceAlerts(customers);
    
    const stats: DashboardStats = {
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

    // Add trends if previous stats exist
    if (previousStats) {
      stats.totalCustomersTrend = calculateTrend(customers.length, previousStats.totalCustomers);
      stats.highRiskTrend = calculateTrend(highRisk, previousStats.highRiskCustomers);
      stats.mediumRiskTrend = calculateTrend(mediumRisk, previousStats.mediumRiskCustomers);
      stats.lowRiskTrend = calculateTrend(lowRisk, previousStats.lowRiskCustomers);
      stats.totalWalletsTrend = calculateTrend(totalWallets, previousStats.totalWallets);
      stats.undeclaredWalletsTrend = calculateTrend(undeclaredWallets, previousStats.undeclaredWallets);
      stats.averageRiskScoreTrend = calculateTrend(Math.round(averageRiskScore), previousStats.averageRiskScore);
    }

    // Set compliance status
    stats.complianceStatus = getComplianceStatus(stats);
    
    return stats;
  };

  // Deduplicate and sort VALR balances
  const getProcessedValrBalances = (): ValrBalance[] => {
    const seen = new Set<string>();
    const processed: ValrBalance[] = [];

    // Priority order for currencies (ZAR/USD first, then major cryptos)
    const priorityCurrencies = ['ZAR', 'USD', 'EUR', 'GBP', 'BTC', 'ETH', 'XRP', 'SOL'];

    // Add priority currencies first
    priorityCurrencies.forEach(curr => {
      const balance = valrBalances.find(b => b.currency === curr && !seen.has(b.currency));
      if (balance) {
        processed.push(balance);
        seen.add(balance.currency);
      }
    });

    // Add remaining currencies
    valrBalances.forEach(balance => {
      if (!seen.has(balance.currency)) {
        processed.push(balance);
        seen.add(balance.currency);
      }
    });

    return processed;
  };

  // Get status color for compliance indicator
  const getComplianceStatusColor = (status?: 'green' | 'amber' | 'red') => {
    switch (status) {
      case 'green':
        return 'bg-green-500/10 border-green-500/50 text-green-700 dark:text-green-400';
      case 'amber':
        return 'bg-yellow-500/10 border-yellow-500/50 text-yellow-700 dark:text-yellow-400';
      case 'red':
        return 'bg-red-500/10 border-red-500/50 text-red-700 dark:text-red-400';
      default:
        return 'bg-gray-500/10 border-gray-500/50 text-gray-700 dark:text-gray-400';
    }
  };

  const getComplianceStatusLabel = (status?: 'green' | 'amber' | 'red') => {
    switch (status) {
      case 'green':
        return 'Compliant';
      case 'amber':
        return 'At Risk';
      case 'red':
        return 'Critical';
      default:
        return 'Unknown';
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshCountdown(60);
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
        valrBalances,
        exportedAt: new Date().toISOString(),
        customerCount: dashboardStats.totalCustomers,
        riskDistribution: dashboardStats.riskDistribution,
        complianceStatus: dashboardStats.complianceStatus
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

  const hasError = customersError || lunoError || valrError;
  const processedValrBalances = getProcessedValrBalances();

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
                <span>Updated: {getTimeAgo()} • Next refresh in {refreshCountdown}s</span>
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
            <div className="md:hidden mt-2 text-xs text-muted-foreground space-y-1">
              <div className="flex items-center justify-between">
                <span>Last updated: {getTimeAgo()}</span>
                <span className="text-primary font-medium">↻ {refreshCountdown}s</span>
              </div>
              {dashboardStats && (
                <div className="text-xs">{dashboardStats.totalCustomers} customers • {dashboardStats.totalWallets} wallets • {processedValrBalances.length} assets</div>
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
                  <div className="text-sm font-medium text-destructive">⚠️ Data Synchronization Issues</div>
                  <div className="text-xs text-destructive/80 mt-1 space-y-0.5">
                    {customersError && <div>• Customer Data: {customersError}</div>}
                    {lunoError && <div>• Market Prices: {lunoError}</div>}
                    {valrError && <div>• Wallet Balances: {valrError}</div>}
                  </div>
                  <p className="text-xs text-destructive/70 mt-2">Some dashboard sections may show cached or incomplete data.</p>
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefresh}
                      className="text-xs h-7"
                    >
                      Retry Now
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
                  <p className="text-muted-foreground font-medium">Loading dashboard data...</p>
                  <div className="flex gap-4 justify-center text-xs text-muted-foreground mt-2 flex-wrap">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                      <span>Customer Data</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                      <span>Market Data</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      <span>Wallets</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 md:space-y-8">
              {/* Compliance Status Banner */}
              {dashboardStats?.complianceStatus && (
                <div className={`rounded-lg border p-4 ${getComplianceStatusColor(dashboardStats.complianceStatus)}`}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-3 h-3 rounded-full bg-current flex-shrink-0"></div>
                      <div>
                        <h3 className="font-semibold text-sm">
                          Compliance Status: <span className="font-bold">{getComplianceStatusLabel(dashboardStats.complianceStatus)}</span>
                        </h3>
                        <p className="text-xs opacity-75 mt-1">
                          {dashboardStats.highRiskCustomers} high-risk • {dashboardStats.undeclaredWallets} undeclared • Risk avg: {dashboardStats.averageRiskScore}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <KPICards stats={dashboardStats} loading={isLoading} />
              
              {/* VALR Balances Card */}
              {processedValrBalances.length > 0 ? (
                <div className="rounded-lg border border-border/50 p-4 md:p-6 bg-card">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Wallet Balances (VALR)</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={fetchValrData}
                      disabled={isRefreshing}
                      className="h-8 gap-1 text-xs"
                      title="Refresh VALR balances"
                    >
                      <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                      <span className="hidden sm:inline">Refresh</span>
                    </Button>
                  </div>
                  {valrError ? (
                    <div className="flex items-start gap-2 p-3 rounded bg-yellow-500/10 border border-yellow-500/20 text-yellow-700 text-sm">
                      <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Failed to load balances</p>
                        <p className="text-xs opacity-80">{valrError}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 overflow-x-auto">
                      {processedValrBalances.slice(0, 8).map((balance) => {
                        const total = parseFloat(balance.total);
                        const available = parseFloat(balance.available);
                        const reserved = parseFloat(balance.reserved);
                        const isLowBalance = total < 0.01 && balance.currency !== 'ZAR';
                        
                        return (
                          <div 
                            key={balance.currency} 
                            className={`rounded p-3 bg-muted/40 border transition-all ${
                              isLowBalance ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-border/30 hover:border-border/60'
                            }`}
                          >
                            <p className="text-xs text-muted-foreground font-semibold mb-2 uppercase tracking-wider">{balance.currency}</p>
                            <div className="space-y-1.5">
                              <div>
                                <p className="text-xs text-muted-foreground">Total</p>
                                <p className="text-sm font-bold">{total.toFixed(4)}</p>
                              </div>
                              <div className="pt-1.5 border-t border-border/20">
                                <p className="text-xs text-muted-foreground">Available</p>
                                <p className="text-xs font-semibold text-green-600 dark:text-green-400">{available.toFixed(4)}</p>
                              </div>
                              {reserved > 0 && (
                                <div>
                                  <p className="text-xs text-muted-foreground">Reserved</p>
                                  <p className="text-xs font-semibold text-orange-600 dark:text-orange-400">{reserved.toFixed(4)}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-3">
                    Showing {Math.min(8, processedValrBalances.length)} of {processedValrBalances.length} balances
                  </div>
                </div>
              ) : (
                !isLoading && (
                  <div className="rounded-lg border border-border/50 p-6 bg-card text-center">
                    <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-muted-foreground">No wallet balances available</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={fetchValrData}
                      className="mt-2 h-7 text-xs"
                    >
                      Try Loading
                    </Button>
                  </div>
                )
              )}
              
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
              
              {/* Recent Alerts - UPDATED TO PASS customerId */}
              <RecentAlertsTable alerts={dashboardStats?.recentAlerts} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;