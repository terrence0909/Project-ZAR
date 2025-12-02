import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  Users, 
  Loader2, 
  RefreshCw, 
  ExternalLink, 
  User, 
  Globe, 
  Calendar, 
  Coins,
  Shield,
  Mail,
  Phone,
  FileText,
  AlertTriangle
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Customer {
  id: string;
  name: string;
  walletAddress: string;
  riskScore: number;
  riskLevel: "low" | "medium" | "high";
  totalTransactions: number;
  totalVolume: number;
  lastActive: string;
  country?: string;
  email?: string;
  phone?: string;
  kycStatus: "verified" | "pending" | "unverified";
  customerId?: string;
  tags?: string[];
  vaspId?: string;
  saId?: string;
}

const Customers = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    low: 0,
    medium: 0,
    high: 0
  });
  const navigate = useNavigate();

  const fetchCustomers = async () => {
    try {
      setRefreshing(true);
      
      console.log("📡 Fetching customers from API...");
      
      // Your working API endpoint
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
      console.log("✅ API response:", data);
      
      // Transform API data to match your Customer interface
      const transformedCustomers: Customer[] = data.customers.map((apiCustomer: any) => ({
        id: apiCustomer.customer_id,
        name: `${apiCustomer.first_name} ${apiCustomer.last_name}`,
        walletAddress: apiCustomer.primary_wallet || "",
        riskScore: Math.round(apiCustomer.average_risk_score || 0),
        riskLevel: determineRiskLevel(apiCustomer.average_risk_score || 0),
        totalTransactions: apiCustomer.wallet_count || 0,
        totalVolume: apiCustomer.total_balance || 0,
        lastActive: apiCustomer.created_at || new Date().toISOString(),
        country: "ZA",
        email: apiCustomer.email,
        kycStatus: "verified",
        customerId: apiCustomer.sa_id,
        tags: [],
        vaspId: apiCustomer.vasp_id,
        saId: apiCustomer.sa_id
      }));
      
      console.log("📊 Transformed customers:", transformedCustomers.length);
      setCustomers(transformedCustomers);
      updateStats(transformedCustomers);
      
      toast.success(`Loaded ${transformedCustomers.length} customers from imported data`);
      
    } catch (err) {
      console.error("❌ Error loading customers:", err);
      toast.error("Failed to load customers from API");
      
      // Keep UI clean - no mock data
      setCustomers([]);
      updateStats([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const processCustomerData = (customerList: Customer[]) => {
    console.log("✅ Processing customer data:", customerList.length, "customers");
    
    if (customerList && customerList.length > 0) {
      setCustomers(customerList);
      updateStats(customerList);
      toast.success(`Loaded ${customerList.length} customers from imported data`);
    } else {
      setCustomers([]);
      toast.info("No customer data available");
    }
  };

  const determineRiskLevel = (riskScore: number): "low" | "medium" | "high" => {
    if (riskScore < 30) return "low";
    if (riskScore < 70) return "medium";
    return "high";
  };

  const updateStats = (customerList: Customer[]) => {
    const stats = {
      total: customerList.length,
      low: customerList.filter(c => c.riskLevel === 'low').length,
      medium: customerList.filter(c => c.riskLevel === 'medium').length,
      high: customerList.filter(c => c.riskLevel === 'high').length
    };
    setStats(stats);
  };

  const handleCustomerClick = (customerId: string, customerName: string) => {
    // Navigate to search results with customer data
    navigate("/", { 
      state: { 
        searchQuery: customerId,
        customerName: customerName
      } 
    });
  };

  const truncateAddress = (address: string) => {
    if (!address || address.length < 10) return "No wallet";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Unknown";
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return "Today";
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      
      return date.toLocaleDateString('en-ZA', { 
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const getRiskBadge = (riskLevel: string) => {
    const variants = {
      low: "bg-success/20 text-success border-success/30",
      medium: "bg-warning/20 text-warning border-warning/30",
      high: "bg-destructive/20 text-destructive border-destructive/30",
    };
    return variants[riskLevel as keyof typeof variants] || variants.medium;
  };

  const getKycBadge = (status: string) => {
    const variants = {
      verified: "bg-success/20 text-success border-success/30",
      pending: "bg-warning/20 text-warning border-warning/30",
      unverified: "bg-muted text-muted-foreground border-border",
    };
    return variants[status as keyof typeof variants] || variants.unverified;
  };

  useEffect(() => {
    fetchCustomers();
    
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchCustomers, 60000);
    return () => clearInterval(interval);
  }, []);

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.walletAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.customerId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.saId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar lastUpdated="Just now" />
      
      <main className="flex-1 ml-0 md:ml-[280px] transition-all">
        {/* Header */}
        <header className="sticky top-0 z-10 glass-card border-b border-border/50 backdrop-blur-md px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Customers</h1>
                <p className="text-sm text-muted-foreground">
                  Real customer data from your XML imports
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchCustomers}
                disabled={refreshing}
                className="gap-2"
              >
                <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
                {refreshing ? "Refreshing..." : "Refresh"}
              </Button>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64 bg-muted/50"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="px-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="glass-card border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Customers</p>
                    <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                  </div>
                  <Users className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="glass-card border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Low Risk</p>
                    <p className="text-2xl font-bold text-success">{stats.low}</p>
                  </div>
                  <Shield className="w-8 h-8 text-success" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="glass-card border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Medium Risk</p>
                    <p className="text-2xl font-bold text-warning">{stats.medium}</p>
                  </div>
                  <Shield className="w-8 h-8 text-warning" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="glass-card border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">High Risk</p>
                    <p className="text-2xl font-bold text-destructive">{stats.high}</p>
                  </div>
                  <Shield className="w-8 h-8 text-destructive" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          <Card className="glass-card border-border/50">
            <CardHeader className="border-b border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-foreground">Customer Directory</CardTitle>
                  <CardDescription>
                    Manage and monitor customer risk profiles from imported data
                    {searchTerm && ` • Found ${filteredCustomers.length} customers`}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-sm border-border">
                  <div className={cn(
                    "w-2 h-2 rounded-full mr-2",
                    customers.length > 0 ? "bg-success" : "bg-warning"
                  )}></div>
                  {customers.length > 0 ? "Connected" : "No data"}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground">Loading customer data...</p>
                </div>
              ) : customers.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    No customers found
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Import your XML data to see customers here
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={fetchCustomers}
                    className="gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retry Connection
                  </Button>
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="text-center py-12">
                  <Search className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    No matching customers
                  </h3>
                  <p className="text-muted-foreground">
                    Try a different search term
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      onClick={() => handleCustomerClick(customer.customerId || customer.id, customer.name)}
                      className="group flex items-center justify-between p-4 rounded-lg glass-card border border-border/50 hover:border-primary/50 hover-lift transition-all cursor-pointer"
                    >
                      {/* Customer Info */}
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center border-2 border-background">
                            <User className="w-6 h-6 text-primary" />
                          </div>
                          <Badge 
                            className={cn(
                              "absolute -top-1 -right-1 px-2 py-0.5 text-xs",
                              getRiskBadge(customer.riskLevel)
                            )}
                          >
                            {customer.riskScore}
                          </Badge>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground">{customer.name}</h3>
                            <Badge variant="outline" className={getKycBadge(customer.kycStatus)}>
                              {customer.kycStatus}
                            </Badge>
                            {customer.saId && (
                              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                ID: {customer.saId}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Coins className="w-3 h-3" />
                              <span className="font-mono">{truncateAddress(customer.walletAddress)}</span>
                            </div>
                            
                            {customer.country && (
                              <div className="flex items-center gap-1">
                                <Globe className="w-3 h-3" />
                                <span>{customer.country}</span>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDate(customer.lastActive)}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {customer.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                <span>{customer.email}</span>
                              </div>
                            )}
                            
                            {customer.vaspId && (
                              <div className="flex items-center gap-1">
                                <Shield className="w-3 h-3" />
                                <span>VASP: {customer.vaspId}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Stats & Actions */}
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Wallets</p>
                          <p className="font-semibold text-foreground">{customer.totalTransactions}</p>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Balance</p>
                          <p className="font-semibold text-foreground">{customer.totalVolume.toFixed(2)} ETH</p>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground mb-1">Risk Level</p>
                          <Badge className={getRiskBadge(customer.riskLevel)}>
                            {customer.riskLevel.toUpperCase()}
                          </Badge>
                        </div>
                        
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCustomerClick(customer.customerId || customer.id, customer.name);
                          }}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Footer */}
              {customers.length > 0 && (
                <div className="mt-6 pt-6 border-t border-border/50 flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-success"></div>
                    <span>
                      {customers.length} customers from imported XML data
                    </span>
                  </div>
                  <Button 
                    variant="link" 
                    size="sm" 
                    onClick={fetchCustomers}
                    className="text-primary"
                  >
                    Refresh Data
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Customers;