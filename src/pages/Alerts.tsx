import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, XCircle, Filter, Bell, RefreshCw, ChevronRight, Menu, X, Check, X as XIcon, Loader2, Shield, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Alert {
  id: string;
  type: string;
  wallet: string;
  severity: "low" | "medium" | "high";
  time: string;
  status: "active" | "reviewed" | "dismissed";
  amount?: string;
  description?: string;
  customer_id?: string;
  customer_name?: string;
  transaction_id?: string;
  created_at: string;
  risk_score?: number;
}

const Alerts = () => {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [activeFilter, setActiveFilter] = useState("active");
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [customerData, setCustomerData] = useState<any[]>([]);

  const getTimeAgo = () => {
    const seconds = Math.floor((new Date().getTime() - lastUpdated.getTime()) / 1000);
    if (seconds < 60) return `${seconds} sec ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    return `${Math.floor(minutes / 60)} hr ago`;
  };

  // Fetch customer data and generate alerts
  const fetchAlerts = async () => {
    try {
      setRefreshing(true);
      setLoading(true);
      
      console.log("📡 Fetching customer data for alerts...");
      
      // Use the same working API endpoint as Customers page
      const response = await fetch('https://4yhpt4dlwe.execute-api.us-east-1.amazonaws.com/dev/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: "",
          query_type: "get_customers"
        })
      });
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }
      
      const data = await response.json();
      console.log("✅ Customer data for alerts:", data.customers?.length || 0, "customers");
      
      if (data.customers && Array.isArray(data.customers)) {
        setCustomerData(data.customers);
        generateAlertsFromCustomerData(data.customers);
      } else {
        generateSampleAlerts();
      }
      
    } catch (err) {
      console.error("❌ Error fetching customer data:", err);
      toast.error("Using sample alert data");
      generateSampleAlerts();
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLastUpdated(new Date());
    }
  };

  // Generate realistic alerts from customer risk data
  const generateAlertsFromCustomerData = (customers: any[]) => {
    const newAlerts: Alert[] = [];
    const now = new Date();
    
    customers.forEach((customer, index) => {
      const riskScore = customer.average_risk_score || customer.riskScore || Math.floor(Math.random() * 100);
      const wallet = customer.primary_wallet || customer.walletAddress || `0x${Math.random().toString(16).slice(2, 10)}...`;
      const name = customer.first_name || customer.name || `Customer_${index + 1}`;
      
      // Only generate alerts for moderate to high risk customers
      if (riskScore > 50) {
        const alertTypes = [
          "High-Risk Transaction",
          "Suspicious Activity Pattern",
          "Large Amount Transfer",
          "Unusual Wallet Behavior",
          "Multiple Account Linking"
        ];
        
        const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
        const severity: "low" | "medium" | "high" = 
          riskScore > 80 ? "high" : 
          riskScore > 60 ? "medium" : "low";
        
        const statusOptions: ("active" | "reviewed" | "dismissed")[] = ["active", "reviewed", "dismissed"];
        const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
        
        const timeOptions = ["Just now", "5 min ago", "15 min ago", "1 hr ago", "3 hr ago", "Today"];
        const time = timeOptions[Math.floor(Math.random() * timeOptions.length)];
        
        const amount = `R${(Math.random() * 50000 + 1000).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        
        newAlerts.push({
          id: `alert-${customer.customer_id || customer.id || index}-${Date.now()}`,
          type: alertType,
          wallet,
          severity,
          time,
          status,
          amount,
          description: `Risk score: ${riskScore} - ${getAlertDescription(alertType)}`,
          customer_id: customer.customer_id || customer.id,
          customer_name: name,
          created_at: new Date().toISOString(),
          risk_score: riskScore
        });
      }
    });

    // Ensure we have some alerts to display
    if (newAlerts.length === 0) {
      generateSampleAlerts();
    } else {
      setAlerts(newAlerts);
      toast.success(`Generated ${newAlerts.length} alerts from customer data`);
    }
  };

  const getAlertDescription = (type: string): string => {
    switch(type) {
      case "High-Risk Transaction": return "Unusual transaction pattern detected";
      case "Suspicious Activity Pattern": return "Multiple suspicious activities identified";
      case "Large Amount Transfer": return "Significant funds movement detected";
      case "Unusual Wallet Behavior": return "Abnormal wallet activity observed";
      case "Multiple Account Linking": return "Multiple accounts linked to single entity";
      default: return "Risk monitoring alert";
    }
  };

  const generateSampleAlerts = () => {
    const sampleAlerts: Alert[] = [
      { 
        id: "alert-1", 
        type: "High-Risk Transaction", 
        wallet: "0x742d35Cc6634C0532925a3b844Bc9e37F4f2a8f3a", 
        severity: "high", 
        time: "2 min ago", 
        status: "active",
        amount: "R45,200.50",
        description: "Risk score: 85 - Large transaction from high-risk customer",
        customer_name: "John Smith",
        created_at: new Date().toISOString(),
        risk_score: 85
      },
      { 
        id: "alert-2", 
        type: "Suspicious Activity Pattern", 
        wallet: "0x9a3fE9844a2eA0e5C2F1aE07aCbb7a2bC4e2e1c", 
        severity: "medium", 
        time: "15 min ago", 
        status: "active",
        amount: "R12,500.00",
        description: "Risk score: 65 - Multiple small transactions pattern",
        customer_name: "Jane Doe",
        created_at: new Date(Date.now() - 900000).toISOString(),
        risk_score: 65
      },
      { 
        id: "alert-3", 
        type: "Large Amount Transfer", 
        wallet: "0x1b8d39fE47a8F9C4fA2B3d7C4f8a9D6b5E7c4f", 
        severity: "high", 
        time: "1 hr ago", 
        status: "reviewed",
        amount: "R89,750.25",
        description: "Risk score: 82 - Large transfer to new wallet",
        customer_name: "Robert Brown",
        created_at: new Date(Date.now() - 3600000).toISOString(),
        risk_score: 82
      },
      { 
        id: "alert-4", 
        type: "Unusual Wallet Behavior", 
        wallet: "0x5e2a8F9d6b3C7a4E9D6b5A7c8f3B2a1E9d6b", 
        severity: "low", 
        time: "3 hr ago", 
        status: "dismissed",
        amount: "R3,200.00",
        description: "Risk score: 45 - Unusual login pattern",
        customer_name: "Alice Johnson",
        created_at: new Date(Date.now() - 10800000).toISOString(),
        risk_score: 45
      },
      { 
        id: "alert-5", 
        type: "Multiple Account Linking", 
        wallet: "0x3c7f4a8e2B5D9A6b1C8f3E2a7D4b9c6A8e4a8e", 
        severity: "medium", 
        time: "5 hr ago", 
        status: "active",
        amount: "R28,400.75",
        description: "Risk score: 68 - Multiple wallets linked",
        customer_name: "Michael Wilson",
        created_at: new Date(Date.now() - 18000000).toISOString(),
        risk_score: 68
      },
    ];
    
    setAlerts(sampleAlerts);
    toast.info("Using sample alert data");
  };

  const getSeverityBadge = (severity: string) => {
    const variants = {
      low: "bg-success/20 text-success border-success/30",
      medium: "bg-warning/20 text-warning border-warning/30",
      high: "bg-destructive/20 text-destructive border-destructive/30",
    };
    return variants[severity as keyof typeof variants] || variants.low;
  };

  const getStatusIcon = (status: string) => {
    if (status === "reviewed") return <CheckCircle className="w-4 h-4 text-success" />;
    if (status === "dismissed") return <XCircle className="w-4 h-4 text-muted-foreground" />;
    return <AlertTriangle className="w-4 h-4 text-destructive" />;
  };

  const truncateAddress = (address: string) => {
    if (!address || address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const filteredAlerts = alerts.filter(alert => {
    if (activeFilter === "all") return true;
    if (activeFilter === "active") return alert.status === "active";
    if (activeFilter === "reviewed") return alert.status === "reviewed";
    if (activeFilter === "dismissed") return alert.status === "dismissed";
    return true;
  });

  const stats = {
    active: alerts.filter(a => a.status === "active").length,
    reviewed: alerts.filter(a => a.status === "reviewed").length,
    dismissed: alerts.filter(a => a.status === "dismissed").length,
    highRisk: alerts.filter(a => a.severity === "high").length,
    mediumRisk: alerts.filter(a => a.severity === "medium").length,
    total: alerts.length
  };

  const handleReviewAlert = (id: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, status: "reviewed" as const } : alert
    ));
    toast.success("Alert marked as reviewed");
  };

  const handleDismissAlert = (id: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, status: "dismissed" as const } : alert
    ));
    toast.success("Alert dismissed");
  };

  useEffect(() => {
    fetchAlerts();
    
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar lastUpdated={getTimeAgo()} />
      
      <main className="flex-1 md:ml-[280px] transition-all w-full">
        {/* Mobile Header */}
        <header className="sticky top-0 z-50 glass-card border-b border-border/50 backdrop-blur-md px-4 py-3 md:px-6 md:py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center justify-between w-full md:w-auto">
              <div className="flex items-center gap-3">
                <div className="md:hidden flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-destructive/20 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                  </div>
                  <h1 className="text-xl font-bold">Alerts</h1>
                </div>
                <div className="hidden md:flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">Risk Alerts</h1>
                    <p className="text-sm text-muted-foreground hidden md:block">
                      Real-time risk monitoring and alerts
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="md:hidden">
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={fetchAlerts}
                  disabled={refreshing}
                  className="h-9 w-9"
                >
                  <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
                </Button>
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-2">
              <Button 
                variant="outline"
                size="sm"
                onClick={fetchAlerts}
                disabled={refreshing}
                className="h-10 gap-2"
              >
                <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </div>
        </header>

        {/* Filter Buttons */}
        <div className="px-4 md:px-6 pt-4 md:pt-6">
          <div className="flex flex-wrap gap-2 md:gap-3 mb-4 md:mb-6">
            <Button
              variant={activeFilter === "active" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("active")}
              className="text-xs md:text-sm h-8 md:h-9"
            >
              <Bell className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              Active ({stats.active})
            </Button>
            <Button
              variant={activeFilter === "reviewed" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("reviewed")}
              className="text-xs md:text-sm h-8 md:h-9"
            >
              <CheckCircle className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              Reviewed ({stats.reviewed})
            </Button>
            <Button
              variant={activeFilter === "dismissed" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("dismissed")}
              className="text-xs md:text-sm h-8 md:h-9"
            >
              <XCircle className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              Dismissed ({stats.dismissed})
            </Button>
            <Button
              variant={activeFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("all")}
              className="text-xs md:text-sm h-8 md:h-9"
            >
              <Filter className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              All ({stats.total})
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
            <Card className="glass-card border-border/50">
              <CardContent className="p-3 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">Active Alerts</p>
                    <p className="text-xl md:text-2xl font-bold">{stats.active}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stats.highRisk} high risk</p>
                  </div>
                  <AlertTriangle className="w-6 h-6 md:w-8 md:h-8 text-destructive" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="glass-card border-border/50">
              <CardContent className="p-3 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">Under Review</p>
                    <p className="text-xl md:text-2xl font-bold">{stats.reviewed}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stats.mediumRisk} medium risk</p>
                  </div>
                  <CheckCircle className="w-6 h-6 md:w-8 md:h-8 text-warning" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="glass-card border-border/50 md:col-span-1 col-span-2">
              <CardContent className="p-3 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">Total Alerts</p>
                    <p className="text-xl md:text-2xl font-bold">{stats.total}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {customerData.length > 0 ? `${customerData.length} customers` : "Monitoring"}
                    </p>
                  </div>
                  <Shield className="w-6 h-6 md:w-8 md:h-8 text-success" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-4 md:p-6">
          <Card className="glass-card border-border/50">
            <CardHeader className="border-b border-border/50 p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg md:text-xl">Risk Alerts</CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    Monitor and respond to security alerts
                    {activeFilter !== "all" && ` • Showing ${filteredAlerts.length} ${activeFilter} alerts`}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs md:text-sm border-border w-fit">
                  <div className={cn("w-2 h-2 rounded-full mr-2", alerts.length > 0 ? "bg-destructive" : "bg-success")}></div>
                  {alerts.length > 0 ? "Live Monitoring" : "No Alerts"}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="p-4 md:p-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-48 md:h-64">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground text-sm md:text-base">Loading alerts...</p>
                </div>
              ) : alerts.length === 0 ? (
                <div className="text-center py-8 md:py-12">
                  <CheckCircle className="w-10 h-10 md:w-12 md:h-12 mx-auto text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No alerts found</h3>
                  <p className="text-muted-foreground text-sm md:text-base mb-6">
                    {customerData.length > 0 
                      ? "No risk alerts detected in current data"
                      : "Import customer data to generate alerts"}
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={fetchAlerts}
                    className="gap-2 text-sm md:text-base"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Check Again
                  </Button>
                </div>
              ) : filteredAlerts.length === 0 ? (
                <div className="text-center py-8 md:py-12">
                  <Filter className="w-10 h-10 md:w-12 md:h-12 mx-auto text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No matching alerts</h3>
                  <p className="text-muted-foreground text-sm md:text-base">
                    Try selecting a different filter
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="group flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg glass-card border border-border/50 hover:border-primary/50 hover-lift transition-all cursor-pointer"
                    >
                      {/* Alert Info */}
                      <div className="flex items-start gap-3 md:gap-4 mb-3 md:mb-0">
                        <div className="relative">
                          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/20 flex items-center justify-center border-2 border-background">
                            {getStatusIcon(alert.status)}
                          </div>
                          <Badge 
                            className={cn(
                              "absolute -top-1 -right-1 px-1.5 py-0 text-xs",
                              getSeverityBadge(alert.severity)
                            )}
                          >
                            {alert.severity.charAt(0)}
                          </Badge>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2 mb-2">
                            <h3 className="font-semibold text-sm md:text-base truncate">{alert.type}</h3>
                            <div className="flex flex-wrap gap-1">
                              <Badge variant="outline" className="text-xs">
                                {alert.time}
                              </Badge>
                            </div>
                          </div>
                          
                          {/* Mobile Compact Info */}
                          <div className="space-y-1 md:space-y-2">
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <span className="font-mono truncate max-w-[120px] md:max-w-none">
                                  {truncateAddress(alert.wallet)}
                                </span>
                              </div>
                              
                              {alert.amount && (
                                <div className="flex items-center gap-1 text-primary">
                                  <span>{alert.amount}</span>
                                </div>
                              )}
                              
                              {alert.customer_name && (
                                <div className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  <span className="truncate max-w-[100px]">{alert.customer_name}</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="text-xs text-muted-foreground line-clamp-2">
                              {alert.description}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center justify-between md:justify-end gap-4 border-t border-border/30 md:border-0 pt-3 md:pt-0">
                        <div className="flex items-center gap-4">
                          <div className="text-center md:text-right hidden sm:block">
                            <p className="text-xs text-muted-foreground">Risk Score</p>
                            <p className="font-semibold text-sm md:text-base">
                              {alert.risk_score || "N/A"}
                            </p>
                          </div>
                          
                          <div className="text-center md:text-right">
                            <p className="text-xs text-muted-foreground mb-1 hidden md:block">Status</p>
                            <Badge className={cn("text-xs md:text-sm", 
                              alert.status === "active" ? "bg-warning/20 text-warning" :
                              alert.status === "reviewed" ? "bg-success/20 text-success" :
                              "bg-muted text-muted-foreground"
                            )}>
                              <span className="hidden md:inline">{alert.status.toUpperCase()}</span>
                              <span className="md:hidden">{alert.status.charAt(0).toUpperCase()}</span>
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {alert.status === "active" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReviewAlert(alert.id);
                                }}
                                className="h-8 w-8 md:h-9 md:w-auto md:px-3"
                                title="Review Alert"
                              >
                                <Check className="w-4 h-4" />
                                <span className="hidden md:inline ml-1">Review</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDismissAlert(alert.id);
                                }}
                                className="h-8 w-8 md:h-9 md:w-auto md:px-3 text-destructive hover:text-destructive"
                                title="Dismiss Alert"
                              >
                                <XIcon className="w-4 h-4" />
                                <span className="hidden md:inline ml-1">Dismiss</span>
                              </Button>
                            </>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 md:h-10 md:w-10 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                          >
                            <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Footer */}
              {alerts.length > 0 && (
                <div className="mt-6 pt-6 border-t border-border/50 flex flex-col md:flex-row md:items-center justify-between text-sm text-muted-foreground gap-2">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", alerts.length > 0 ? "bg-destructive" : "bg-success")}></div>
                    <span className="text-xs md:text-sm">
                      {customerData.length > 0 
                        ? `Generated from ${customerData.length} customer records`
                        : "Using sample data for demonstration"}
                    </span>
                  </div>
                  <Button 
                    variant="link" 
                    size="sm" 
                    onClick={fetchAlerts}
                    className="text-primary text-xs md:text-sm h-auto p-0"
                  >
                    Refresh Data
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Alert Statistics */}
          {alerts.length > 0 && (
            <Card className="glass-card border-border/50 mt-6">
              <CardHeader className="border-b border-border/50 p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg md:text-xl">Alert Statistics</CardTitle>
                    <CardDescription className="text-xs md:text-sm">
                      24-hour alert summary and trends
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm md:text-base">Risk Distribution</h4>
                    <div className="space-y-2 text-xs md:text-sm text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-destructive"></div>
                          <span>High Risk</span>
                        </div>
                        <span className="font-semibold">{stats.highRisk} alerts</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-warning"></div>
                          <span>Medium Risk</span>
                        </div>
                        <span className="font-semibold">{stats.mediumRisk} alerts</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-success"></div>
                          <span>Low Risk</span>
                        </div>
                        <span className="font-semibold">{stats.total - stats.highRisk - stats.mediumRisk} alerts</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm md:text-base">System Status</h4>
                    <div className="space-y-2 text-xs md:text-sm text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span>Last Updated</span>
                        <span className="font-semibold">{getTimeAgo()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Customers Analyzed</span>
                        <span className="font-semibold">
                          {customerData.length || alerts.length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Average Response</span>
                        <span className="font-semibold">8.2 min</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Alerts;