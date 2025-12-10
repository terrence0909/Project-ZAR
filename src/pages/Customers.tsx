import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Users, RefreshCw, FileDown, User, AlertCircle, ArrowLeft } from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

// API Endpoint
const CUSTOMERS_API_ENDPOINT = `${import.meta.env.VITE_API_BASE_URL}/customers`;

interface Customer {
  customer_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  nationality?: string;
  id_number?: string;
  average_risk_score: number;
  wallet_count: number;
  wallets: Array<{
    wallet_id: string;
    address: string;
    balance?: number;
    last_activity?: string;
    risk_score?: number;
    declared: boolean;
  }>;
  last_updated: string;
  kyc_status?: 'pending' | 'verified' | 'rejected';
  created_at: string;
}

const Customers = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const navigate = useNavigate();

  // Fetch customers data
  const fetchCustomersData = useCallback(async () => {
    try {
      console.log("📊 Fetching customers data...");
      
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
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("✅ Customers data received:", data.customers?.length || 0, "customers");
      
      if (data.customers && Array.isArray(data.customers)) {
        setCustomers(data.customers);
        setError(null);
      } else {
        throw new Error('Invalid data format from API');
      }
      
    } catch (err) {
      console.error('❌ Customers fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load customers');
      toast.error("Failed to load customers data");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchCustomersData();
  }, [fetchCustomersData]);

  // Filter customers based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCustomers(customers);
      return;
    }

    const term = searchTerm.toLowerCase().trim();
    const filtered = customers.filter(customer => {
      const fullName = `${customer.first_name} ${customer.last_name}`.toLowerCase();
      const email = customer.email?.toLowerCase() || '';
      const idNumber = customer.id_number?.toLowerCase() || '';
      
      // Check wallet addresses
      const hasMatchingWallet = customer.wallets?.some(wallet => 
        wallet.address.toLowerCase().includes(term)
      );

      return (
        fullName.includes(term) ||
        email.includes(term) ||
        idNumber.includes(term) ||
        hasMatchingWallet
      );
    });

    setFilteredCustomers(filtered);
  }, [searchTerm, customers]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    toast.info("Refreshing customers data...");
    await fetchCustomersData();
    setLastUpdated(new Date());
    toast.success("Customers data refreshed");
  };

  const handleExport = () => {
    try {
      if (!customers.length) {
        toast.error("No data to export");
        return;
      }

      const exportData = {
        metadata: {
          exportedAt: new Date().toISOString(),
          totalCustomers: customers.length,
          source: "Crypto Risk Customers"
        },
        customers: customers.map(customer => ({
          id: customer.customer_id,
          name: `${customer.first_name} ${customer.last_name}`,
          email: customer.email,
          riskScore: customer.average_risk_score,
          walletCount: customer.wallet_count,
          kycStatus: customer.kyc_status,
          wallets: customer.wallets?.map(w => ({
            address: w.address,
            declared: w.declared,
            balance: w.balance
          }))
        }))
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `customers-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("Customers data exported");
    } catch (err) {
      console.error('Export error:', err);
      toast.error("Failed to export data");
    }
  };

  const getTimeAgo = useCallback(() => {
    const seconds = Math.floor((new Date().getTime() - lastUpdated.getTime()) / 1000);
    if (seconds < 60) return `${seconds} sec ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;
    return `${Math.floor(hours / 24)} day ago`;
  }, [lastUpdated]);

  const getRiskStatus = (score: number) => {
    if (score < 30) return { status: 'low', label: 'Low Risk' };
    if (score < 70) return { status: 'medium', label: 'Medium Risk' };
    return { status: 'high', label: 'High Risk' };
  };

  const getRiskBadge = (status: string) => {
    const variants = {
      low: "bg-success/20 text-success hover:bg-success/30",
      medium: "bg-warning/20 text-warning hover:bg-warning/30",
      high: "bg-destructive/20 text-destructive hover:bg-destructive/30",
    };
    return variants[status as keyof typeof variants] || variants.low;
  };

  const getUndeclaredWalletsCount = (customer: Customer) => {
    return customer.wallets?.filter(w => !w.declared).length || 0;
  };

  const formatWalletAddress = (address: string) => {
    if (!address) return 'N/A';
    if (address.length <= 16) return address;
    return `${address.substring(0, 8)}...${address.substring(address.length - 8)}`;
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const totalCustomers = customers.length;
    const highRisk = customers.filter(c => c.average_risk_score >= 70).length;
    const mediumRisk = customers.filter(c => c.average_risk_score >= 30 && c.average_risk_score < 70).length;
    const lowRisk = customers.filter(c => c.average_risk_score < 30).length;
    const totalWallets = customers.reduce((sum, c) => sum + (c.wallet_count || 0), 0);
    const undeclaredWallets = customers.reduce((sum, c) => sum + getUndeclaredWalletsCount(c), 0);

    return {
      totalCustomers,
      highRisk,
      mediumRisk,
      lowRisk,
      totalWallets,
      undeclaredWallets
    };
  }, [customers]);

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden md:block">
        <DashboardSidebar lastUpdated={getTimeAgo()} />
      </div>
      
      <main className="flex-1 w-full md:ml-[280px] transition-all">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b">
          <div className="px-4 py-3 md:px-6 md:py-4">
            <div className="flex items-center justify-between gap-4 mb-4 md:mb-0">
              {/* Title - Left */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Users className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                <h1 className="text-base md:text-2xl font-bold">Customers</h1>
              </div>

              {/* Actions - Right */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Mobile Back Button */}
                <Button 
                  variant="outline" 
                  size="icon"
                  className="h-9 w-9 md:hidden"
                  onClick={() => navigate(-1)}
                  title="Go back"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="h-9 w-9 md:h-10 md:w-auto md:px-3 md:gap-2"
                  title="Refresh"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                  <span className="hidden md:inline">Refresh</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handleExport}
                  disabled={!customers.length || isLoading}
                  className="h-9 w-9 md:h-10 md:w-auto md:px-3 md:gap-2"
                  title="Export"
                >
                  <FileDown className="h-4 w-4" />
                  <span className="hidden md:inline">Export</span>
                </Button>
              </div>
            </div>

            {/* Stats subtitle - Mobile */}
            <div className="md:hidden text-xs text-muted-foreground">
              <p>{stats.totalCustomers} customers • {stats.totalWallets} wallets • {stats.undeclaredWallets} undeclared</p>
            </div>

            {/* Desktop subtitle */}
            <div className="hidden md:block text-sm text-muted-foreground">
              {stats.totalCustomers} customers • {stats.totalWallets} wallets • {stats.undeclaredWallets} undeclared wallets • Updated: {getTimeAgo()}
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4 md:space-y-6">
          {/* Error Banner */}
          {error && (
            <div className="flex items-start gap-2 p-3 md:p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-medium text-destructive">Failed to load customers</div>
                <div className="text-xs text-destructive/80 mt-0.5">{error}</div>
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
          )}

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-xs md:text-sm text-muted-foreground">Total Customers</div>
                <div className="text-xl md:text-2xl font-bold mt-1">{stats.totalCustomers}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs md:text-sm text-muted-foreground">High Risk</div>
                <div className="text-xl md:text-2xl font-bold mt-1 text-destructive">{stats.highRisk}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs md:text-sm text-muted-foreground">Medium Risk</div>
                <div className="text-xl md:text-2xl font-bold mt-1 text-warning">{stats.mediumRisk}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs md:text-sm text-muted-foreground">Low Risk</div>
                <div className="text-xl md:text-2xl font-bold mt-1 text-success">{stats.lowRisk}</div>
              </CardContent>
            </Card>
          </div>

          {/* Customer Directory */}
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 md:gap-0">
                <div>
                  <CardTitle>Customer Directory</CardTitle>
                  <CardDescription>
                    Manage and monitor customer risk profiles • {filteredCustomers.length} of {customers.length} shown
                  </CardDescription>
                </div>
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, ID, or wallet..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center space-y-3">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                    <p className="text-muted-foreground">Loading customers...</p>
                  </div>
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">No customers found</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    {searchTerm ? `No customers match "${searchTerm}"` : "No customer data available"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredCustomers.map((customer) => {
                    const riskStatus = getRiskStatus(customer.average_risk_score);
                    const undeclaredCount = getUndeclaredWalletsCount(customer);
                    const primaryWallet = customer.wallets?.[0];
                    
                    return (
                      <div
                        key={customer.customer_id}
                        onClick={() => navigate(`/Project-ZAR/customer/${customer.customer_id}`)}
                        className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border hover:bg-muted/50 cursor-pointer gap-3 md:gap-4 transition-colors"
                      >
                        <div className="flex items-start md:items-center gap-3 md:gap-4 flex-1 min-w-0">
                          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <span className="font-bold text-primary text-sm md:text-base">
                              {customer.first_name[0]}{customer.last_name[0]}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate text-sm md:text-base">
                              {customer.first_name} {customer.last_name}
                            </h3>
                            <div className="flex flex-col gap-1 mt-1">
                              <p className="text-xs md:text-sm text-muted-foreground font-mono truncate">
                                {primaryWallet ? formatWalletAddress(primaryWallet.address) : 'No wallet'}
                              </p>
                              <p className="text-xs text-muted-foreground truncate hidden md:block">
                                {customer.email}
                              </p>
                            </div>
                            {undeclaredCount > 0 && (
                              <div className="flex items-center gap-1 mt-2">
                                <AlertCircle className="h-3 w-3 text-warning flex-shrink-0" />
                                <span className="text-xs text-warning font-medium">
                                  {undeclaredCount} undeclared wallet{undeclaredCount > 1 ? 's' : ''}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between md:justify-end gap-4 md:gap-6 flex-shrink-0">
                          <div className="text-center md:text-right">
                            <p className="text-xs text-muted-foreground">Wallets</p>
                            <p className="font-semibold text-sm md:text-base">{customer.wallet_count}</p>
                          </div>
                          <div className="text-center md:text-right">
                            <p className="text-xs text-muted-foreground">Risk Score</p>
                            <p className={`font-semibold text-base md:text-lg ${
                              riskStatus.status === 'high' ? 'text-destructive' :
                              riskStatus.status === 'medium' ? 'text-warning' :
                              'text-success'
                            }`}>
                              {Math.round(customer.average_risk_score)}
                            </p>
                          </div>
                          <Badge className={getRiskBadge(riskStatus.status)} variant="secondary">
                            {riskStatus.label}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
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