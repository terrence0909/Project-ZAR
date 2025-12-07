import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, XCircle, Filter, Bell, RefreshCw, ChevronRight, Check, X as XIcon, Loader2, Shield, Users, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
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

  const fetchAlerts = async () => {
    try {
      setRefreshing(true);
      setLoading(true);
      
      console.log("📡 Fetching customer data for alerts...");
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/customers`, {
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

  const generateAlertsFromCustomerData = (customers: any[]) => {
    const newAlerts: Alert[] = [];
    const now = new Date();
    
    customers.forEach((customer, index) => {
      const riskScore = customer.average_risk_score || customer.riskScore || Math.floor(Math.random() * 100);
      const wallet = customer.primary_wallet || customer.walletAddress || `0x${Math.random().toString(16).slice(2, 10)}...`;
      const name = customer.first_name || customer.name || `Customer_${index + 1}`;
      
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
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar lastUpdated={getTimeAgo()} />
      
      <main className="flex-1 w-full overflow-x-hidden">
        {/* Mobile Header */}
        <header className="sticky top-0 z-50 glass-card border-b border-border/50 backdrop-blur-md px-3 xs:px-4 sm:px-6 py-3 xs:py-4">
          <div className="flex items-center justify-between gap-2 xs:gap-3">
            <div className="flex items-center gap-2 xs:gap-3 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="h-8 w-8 xs:h-9 xs:w-9 p-0 flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4 xs:w-5 xs:h-5" />
              </Button>
              <div className="w-9 h-9 xs:w-10 xs:h-10 rounded-lg bg-destructive/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 xs:w-5 xs:h-5 text-destructive" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base xs:text-lg sm:text-xl font-bold truncate">Risk Alerts</h1>
                <p className="text-xs xs:text-sm text-muted-foreground hidden xs:block">
                  Real-time risk monitoring
                </p>
              </div>
            </div>
            
            <Button 
              variant="outline"
              size="sm"
              onClick={fetchAlerts}
              disabled={refreshing}
              className="h-9 w-9 xs:h-10 xs:w-10 flex-shrink-0"
            >
              <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
            </Button>
          </div>
        </header>

        {/* Filter Buttons - Horizontal Scrollable */}
        <div className="sticky top-14 xs:top-16 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50">
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-1.5 xs:gap-2 px-3 xs:px-4 sm:px-6 py-2 xs:py-3 min-w-min">
              <Button
                variant={activeFilter === "active" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter("active")}
                className="h-8 xs:h-9 text-xs xs:text-sm whitespace-nowrap flex-shrink-0"
              >
                <Bell className="w-3 h-3 xs:w-4 xs:h-4 mr-1 xs:mr-2" />
                Active ({stats.active})
              </Button>
              <Button
                variant={activeFilter === "reviewed" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter("reviewed")}
                className="h-8 xs:h-9 text-xs xs:text-sm whitespace-nowrap flex-shrink-0"
              >
                <CheckCircle className="w-3 h-3 xs:w-4 xs:h-4 mr-1 xs:mr-2" />
                Reviewed ({stats.reviewed})
              </Button>
              <Button
                variant={activeFilter === "dismissed" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter("dismissed")}
                className="h-8 xs:h-9 text-xs xs:text-sm whitespace-nowrap flex-shrink-0"
              >
                <XCircle className="w-3 h-3 xs:w-4 xs:h-4 mr-1 xs:mr-2" />
                Dismissed ({stats.dismissed})
              </Button>
              <Button
                variant={activeFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter("all")}
                className="h-8 xs:h-9 text-xs xs:text-sm whitespace-nowrap flex-shrink-0"
              >
                <Filter className="w-3 h-3 xs:w-4 xs:h-4 mr-1 xs:mr-2" />
                All ({stats.total})
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="px-3 xs:px-4 sm:px-6 py-3 xs:py-4">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 xs:gap-3">
            <Card className="glass-card border-border/50">
              <CardContent className="p-2.5 xs:p-3 sm:p-4">
                <div className="space-y-1 xs:space-y-2">
                  <p className="text-xs xs:text-sm text-muted-foreground">Active Alerts</p>
                  <p className="text-lg xs:text-xl sm:text-2xl font-bold">{stats.active}</p>
                  <p className="text-xs text-muted-foreground">{stats.highRisk} high risk</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="glass-card border-border/50">
              <CardContent className="p-2.5 xs:p-3 sm:p-4">
                <div className="space-y-1 xs:space-y-2">
                  <p className="text-xs xs:text-sm text-muted-foreground">Under Review</p>
                  <p className="text-lg xs:text-xl sm:text-2xl font-bold">{stats.reviewed}</p>
                  <p className="text-xs text-muted-foreground">{stats.mediumRisk} medium risk</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="glass-card border-border/50 col-span-2 lg:col-span-1">
              <CardContent className="p-2.5 xs:p-3 sm:p-4">
                <div className="space-y-1 xs:space-y-2">
                  <p className="text-xs xs:text-sm text-muted-foreground">Total Alerts</p>
                  <p className="text-lg xs:text-xl sm:text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">
                    {customerData.length > 0 ? `${customerData.length} customers` : "Monitoring"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-3 xs:px-4 sm:px-6 py-3 xs:py-4 pb-6">
          <Card className="glass-card border-border/50">
            <CardHeader className="border-b border-border/50 p-3 xs:p-4 sm:p-6">
              <div className="flex items-start justify-between gap-2 xs:gap-3">
                <div className="min-w-0">
                  <CardTitle className="text-base xs:text-lg sm:text-xl">Risk Alerts</CardTitle>
                  <CardDescription className="text-xs xs:text-sm">
                    Monitor and respond to security alerts
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs xs:text-sm whitespace-nowrap flex-shrink-0">
                  <div className={cn("w-2 h-2 rounded-full mr-1 xs:mr-2", alerts.length > 0 ? "bg-destructive" : "bg-success")} />
                  {alerts.length > 0 ? "Live" : "No Alerts"}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="p-3 xs:p-4 sm:p-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-48">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                  <p className="text-sm xs:text-base text-muted-foreground">Loading alerts...</p>
                </div>
              ) : alerts.length === 0 ? (
                <div className="text-center py-8 xs:py-12">
                  <CheckCircle className="w-10 h-10 xs:w-12 xs:h-12 mx-auto text-muted-foreground/30 mb-3 xs:mb-4" />
                  <h3 className="text-base xs:text-lg font-semibold mb-2">No alerts found</h3>
                  <p className="text-xs xs:text-sm text-muted-foreground mb-4 xs:mb-6">
                    {customerData.length > 0 
                      ? "No risk alerts detected in current data"
                      : "Import customer data to generate alerts"}
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={fetchAlerts}
                    className="gap-2 text-xs xs:text-sm h-9 xs:h-10"
                  >
                    <RefreshCw className="w-3 h-3 xs:w-4 xs:h-4" />
                    Check Again
                  </Button>
                </div>
              ) : filteredAlerts.length === 0 ? (
                <div className="text-center py-8 xs:py-12">
                  <Filter className="w-10 h-10 xs:w-12 xs:h-12 mx-auto text-muted-foreground/30 mb-3 xs:mb-4" />
                  <h3 className="text-base xs:text-lg font-semibold mb-2">No matching alerts</h3>
                  <p className="text-xs xs:text-sm text-muted-foreground">
                    Try selecting a different filter
                  </p>
                </div>
              ) : (
                <div className="space-y-2 xs:space-y-3">
                  {filteredAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="group p-3 xs:p-4 rounded-lg glass-card border border-border/50 hover:border-primary/50 hover-lift transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2 xs:gap-3 mb-2 xs:mb-3">
                        <div className="flex items-start gap-2 xs:gap-3 min-w-0">
                          <div className="relative flex-shrink-0">
                            <div className="w-8 h-8 xs:w-10 xs:h-10 rounded-full bg-primary/20 flex items-center justify-center border-2 border-background">
                              {getStatusIcon(alert.status)}
                            </div>
                            <Badge 
                              className={cn(
                                "absolute -top-1 -right-1 px-1 py-0 text-xs",
                                getSeverityBadge(alert.severity)
                              )}
                            >
                              {alert.severity.charAt(0).toUpperCase()}
                            </Badge>
                          </div>
                          
                          <div className="min-w-0">
                            <div className="flex items-center gap-1 xs:gap-2 mb-0.5 xs:mb-1 flex-wrap">
                              <h3 className="font-semibold text-xs xs:text-sm truncate">{alert.type}</h3>
                              <Badge variant="outline" className="text-xs flex-shrink-0">
                                {alert.time}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-1 xs:gap-2 text-xs text-muted-foreground flex-wrap">
                              <span className="font-mono text-xs">{truncateAddress(alert.wallet)}</span>
                              {alert.amount && (
                                <span className="text-primary font-medium text-xs">{alert.amount}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      </div>
                      
                      <div className="space-y-2 xs:space-y-2.5">
                        <div className="text-xs xs:text-sm text-muted-foreground line-clamp-2">
                          {alert.description}
                        </div>
                        
                        {alert.customer_name && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{alert.customer_name}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between pt-2 xs:pt-3 border-t border-border/30 gap-2">
                          <div className="flex items-center gap-2 xs:gap-4 min-w-0">
                            <div className="min-w-fit">
                              <p className="text-xs text-muted-foreground">Risk Score</p>
                              <p className="font-semibold text-xs xs:text-sm">{alert.risk_score || "N/A"}</p>
                            </div>
                            
                            <div className="min-w-fit">
                              <p className="text-xs text-muted-foreground">Status</p>
                              <Badge className={cn("text-xs", 
                                alert.status === "active" ? "bg-warning/20 text-warning" :
                                alert.status === "reviewed" ? "bg-success/20 text-success" :
                                "bg-muted text-muted-foreground"
                              )}>
                                {alert.status.charAt(0).toUpperCase()}
                              </Badge>
                            </div>
                          </div>
                          
                          {alert.status === "active" && (
                            <div className="flex gap-1 flex-shrink-0">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReviewAlert(alert.id);
                                }}
                                className="h-7 w-7 xs:h-8 xs:w-8"
                                title="Review Alert"
                              >
                                <Check className="w-3 h-3 xs:w-4 xs:h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDismissAlert(alert.id);
                                }}
                                className="h-7 w-7 xs:h-8 xs:w-8 text-destructive hover:text-destructive"
                                title="Dismiss Alert"
                              >
                                <XIcon className="w-3 h-3 xs:w-4 xs:h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {alerts.length > 0 && (
                <div className="mt-4 xs:mt-6 pt-4 xs:pt-6 border-t border-border/50 flex items-center justify-between text-xs xs:text-sm text-muted-foreground gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={cn("w-2 h-2 rounded-full flex-shrink-0", alerts.length > 0 ? "bg-destructive" : "bg-success")} />
                    <span className="text-xs xs:text-sm truncate">
                      {customerData.length > 0 
                        ? `${customerData.length} customers`
                        : "Sample data"}
                    </span>
                  </div>
                  <Button 
                    variant="link" 
                    size="sm" 
                    onClick={fetchAlerts}
                    className="text-primary h-auto p-0 text-xs xs:text-sm flex-shrink-0"
                  >
                    Refresh
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {alerts.length > 0 && (
            <Card className="glass-card border-border/50 mt-4 xs:mt-6">
              <CardHeader className="border-b border-border/50 p-3 xs:p-4 sm:p-6">
                <CardTitle className="text-base xs:text-lg sm:text-xl">Alert Statistics</CardTitle>
                <CardDescription className="text-xs xs:text-sm">
                  24-hour alert summary
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 xs:p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 xs:gap-6">
                  <div className="space-y-2.5 xs:space-y-3">
                    <h4 className="font-semibold text-sm xs:text-base">Risk Distribution</h4>
                    <div className="space-y-2 text-xs xs:text-sm text-muted-foreground">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-destructive flex-shrink-0" />
                          <span>High Risk</span>
                        </div>
                        <span className="font-semibold flex-shrink-0">{stats.highRisk} alerts</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-warning flex-shrink-0" />
                          <span>Medium Risk</span>
                        </div>
                        <span className="font-semibold flex-shrink-0">{stats.mediumRisk} alerts</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-success flex-shrink-0" />
                          <span>Low Risk</span>
                        </div>
                        <span className="font-semibold flex-shrink-0">{stats.total - stats.highRisk - stats.mediumRisk} alerts</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2.5 xs:space-y-3">
                    <h4 className="font-semibold text-sm xs:text-base">System Status</h4>
                    <div className="space-y-2 text-xs xs:text-sm text-muted-foreground">
                      <div className="flex items-center justify-between gap-2">
                        <span>Last Updated</span>
                        <span className="font-semibold flex-shrink-0">{getTimeAgo()}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span>Customers Analyzed</span>
                        <span className="font-semibold flex-shrink-0">
                          {customerData.length || alerts.length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span>Average Response</span>
                        <span className="font-semibold flex-shrink-0">8.2 min</span>
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