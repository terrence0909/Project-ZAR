import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  ArrowLeft, 
  AlertTriangle, 
  Shield, 
  Wallet, 
  Clock, 
  FileText, 
  Download, 
  Flag, 
  Loader2,
  RefreshCw,
  CheckCircle,
  XCircle,
  ExternalLink,
  Copy,
  Menu,
  X,
  CreditCard,
  TrendingUp,
  AlertCircle,
  ChevronLeft
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";

// API Endpoint
const CUSTOMERS_API_ENDPOINT = `${import.meta.env.VITE_API_BASE_URL}/customers`;

interface Customer {
  id?: string;
  customer_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  nationality?: string;
  id_number?: string;
  sa_id?: string;
  vasp_id?: string;
  created_at: string;
  last_kyc_review?: string;
  kyc_status?: string;
  average_risk_score: number;
  wallet_count: number;
  highest_risk_score?: number;
  total_balance?: number;
  primary_wallet?: string;
  primary_wallet_risk?: number;
  wallets?: Array<{
    address: string;
    risk_score?: number;
    declared: boolean;
    balance?: number;
    blockchain?: string;
    last_activity?: string;
    transaction_count?: number;
  }>;
}

interface Transaction {
  id: string;
  timestamp: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'swap';
  amount: number;
  currency: string;
  from_address: string;
  to_address: string;
  value_zar: number;
  status: 'completed' | 'pending' | 'failed';
  risk_score?: number;
  risk_flags?: string[];
}

interface RiskFlag {
  id: string;
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
  resolved: boolean;
}

const CustomerDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [riskFlags, setRiskFlags] = useState<RiskFlag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [activeTab, setActiveTab] = useState("wallets");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchAllCustomers = useCallback(async (): Promise<Customer[]> => {
    try {
      const response = await fetch(CUSTOMERS_API_ENDPOINT, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.customers || [];
      
    } catch (err) {
      console.error('❌ Error fetching customers:', err);
      throw err;
    }
  }, [id]);

  const findCustomerInList = useCallback((allCustomers: Customer[], customerId: string): Customer | null => {
    if (!customerId || !allCustomers.length) return null;
    
    const searchLower = customerId.toLowerCase();
    
    const exactMatch = allCustomers.find((c: Customer) => {
      return (
        c.customer_id === customerId ||
        c.id === customerId ||
        c.sa_id === customerId ||
        (c.email && c.email.toLowerCase() === searchLower)
      );
    });
    
    if (exactMatch) return exactMatch;
    
    return allCustomers.find((c: Customer) => {
      const fullName = `${c.first_name} ${c.last_name}`.toLowerCase();
      const email = c.email?.toLowerCase() || '';
      
      return (
        fullName.includes(searchLower) ||
        email.includes(searchLower) ||
        c.customer_id.toLowerCase().includes(searchLower) ||
        (c.sa_id && c.sa_id.includes(customerId)) ||
        c.wallets?.some(w => w.address.toLowerCase().includes(searchLower))
      );
    }) || null;
  }, []);

  const fetchCustomerData = useCallback(async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      setSearchAttempted(true);
      
      const allCustomers = await fetchAllCustomers();
      
      if (!allCustomers || allCustomers.length === 0) {
        throw new Error("No customers data available from API");
      }
      
      const foundCustomer = findCustomerInList(allCustomers, id);
      
      if (!foundCustomer) {
        throw new Error(`Customer "${id}" not found. Try clicking from Customers list.`);
      }
      
      setCustomer(foundCustomer);
      await processCustomerData(foundCustomer);
      setLastUpdated(new Date());
      
      toast.success(`Loaded: ${foundCustomer.first_name} ${foundCustomer.last_name}`);
      
    } catch (err) {
      console.error('❌ Error fetching customer data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load customer data';
      setError(errorMessage);
      
      if (errorMessage.includes('not found')) {
        toast.error("Customer not found");
      } else {
        toast.error("Failed to load customer data");
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [id, fetchAllCustomers, findCustomerInList]);

  const processCustomerData = async (customerData: Customer) => {
    try {
      const flags = generateRiskFlags(customerData);
      setRiskFlags(flags);
      
      const mockTx = generateMockTransactions(customerData);
      setTransactions(mockTx);
    } catch (err) {
      console.error('❌ Error processing customer data:', err);
    }
  };

  const generateMockTransactions = (customerData: Customer): Transaction[] => {
    const txTypes: Transaction['type'][] = ['deposit', 'withdrawal', 'transfer', 'swap'];
    const currencies = ['ETH', 'BTC', 'USDT', 'ZAR'];
    const primaryWallet = customerData.primary_wallet || customerData.wallets?.[0]?.address;
    
    return Array.from({ length: 8 }, (_, i) => {
      const type = txTypes[Math.floor(Math.random() * txTypes.length)];
      const currency = currencies[Math.floor(Math.random() * currencies.length)];
      const amount = Math.random() * 10;
      const zarValue = amount * (currency === 'BTC' ? 985000 : currency === 'ETH' ? 45000 : 1);
      const status: Transaction['status'] = i < 6 ? 'completed' : Math.random() > 0.5 ? 'pending' : 'failed';
      
      const fromAddress = type === 'deposit' ? 
        `0x${Math.random().toString(16).slice(2, 12)}...` : 
        primaryWallet || `0x${Math.random().toString(16).slice(2, 12)}...`;
      
      const toAddress = type === 'withdrawal' ? 
        `0x${Math.random().toString(16).slice(2, 12)}...` : 
        primaryWallet || `0x${Math.random().toString(16).slice(2, 12)}...`;
      
      return {
        id: `TX${customerData.customer_id?.slice(-6)}-${(i + 1).toString().padStart(4, '0')}`,
        timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        type,
        amount: parseFloat(amount.toFixed(4)),
        currency,
        from_address: fromAddress,
        to_address: toAddress,
        value_zar: parseFloat(zarValue.toFixed(2)),
        status,
        risk_score: Math.random() > 0.7 ? Math.floor(Math.random() * 100) : undefined,
        risk_flags: Math.random() > 0.8 ? ['Suspicious amount', 'Unusual pattern'] : []
      };
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const generateRiskFlags = (customerData: Customer): RiskFlag[] => {
    const flags: RiskFlag[] = [];
    const riskScore = customerData.average_risk_score || 0;
    const now = new Date().toISOString();
    
    if (riskScore >= 70) {
      flags.push({
        id: `flag-${customerData.customer_id}-high-risk`,
        type: "High Risk Score",
        description: `Customer has a high risk score of ${Math.round(riskScore)}/100`,
        severity: "high",
        timestamp: now,
        resolved: false
      });
    }
    
    const undeclaredWallets = customerData.wallets?.filter(w => !w.declared).length || 0;
    if (undeclaredWallets > 0) {
      flags.push({
        id: `flag-${customerData.customer_id}-undeclared`,
        type: "Undeclared Wallets",
        description: `Customer has ${undeclaredWallets} undeclared wallet${undeclaredWallets > 1 ? 's' : ''}`,
        severity: undeclaredWallets > 1 ? "high" : "medium",
        timestamp: now,
        resolved: false
      });
    }
    
    const highRiskWallet = customerData.wallets?.find(w => (w.risk_score || 0) >= 70);
    if (highRiskWallet) {
      flags.push({
        id: `flag-${customerData.customer_id}-wallet-risk`,
        type: "High Risk Wallet",
        description: `Wallet ${formatWalletAddress(highRiskWallet.address)} has high risk score: ${highRiskWallet.risk_score}`,
        severity: "high",
        timestamp: now,
        resolved: false
      });
    }
    
    if (customerData.kyc_status === 'pending' || !customerData.kyc_status) {
      flags.push({
        id: `flag-${customerData.customer_id}-kyc-pending`,
        type: "KYC Pending",
        description: "Customer KYC verification is pending or unknown",
        severity: "medium",
        timestamp: now,
        resolved: false
      });
    }
    
    if (riskScore < 10) {
      flags.push({
        id: `flag-${customerData.customer_id}-very-low-risk`,
        type: "Very Low Risk Score",
        description: `Extremely low risk score of ${Math.round(riskScore)} might indicate incomplete data`,
        severity: "medium",
        timestamp: now,
        resolved: false
      });
    }
    
    return flags;
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

  const getRiskStatus = (score: number = 0) => {
    if (score < 30) return "low";
    if (score < 70) return "medium";
    return "high";
  };

  const getRiskBadge = (score: number = 0) => {
    const status = getRiskStatus(score);
    const variants = {
      low: "bg-success/20 text-success hover:bg-success/30",
      medium: "bg-warning/20 text-warning hover:bg-warning/30",
      high: "bg-destructive/20 text-destructive hover:bg-destructive/30",
    };
    return variants[status as keyof typeof variants] || variants.low;
  };

  const getRiskColor = (score: number = 0) => {
    const status = getRiskStatus(score);
    const colors = {
      low: "text-success",
      medium: "text-warning",
      high: "text-destructive",
    };
    return colors[status as keyof typeof colors] || colors.low;
  };

  const formatWalletAddress = (address: string): string => {
    if (!address) return 'N/A';
    if (address.length <= 12) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const formatCurrency = (amount: number, currency: string): string => {
    return `${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} ${currency}`;
  };

  const formatZAR = (amount: number): string => {
    return `R ${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const stats = useMemo(() => {
    if (!customer) {
      return {
        totalExposure: 0,
        transactionCount: 0,
        undeclaredWallets: 0,
        declaredWallets: 0,
        walletCount: 0,
        totalBalance: 0
      };
    }
    
    const wallets = customer.wallets || [];
    const declaredWallets = wallets.filter(w => w.declared).length;
    const undeclaredWallets = wallets.filter(w => !w.declared).length;
    const totalBalance = customer.total_balance || wallets.reduce((sum, w) => sum + (w.balance || 0), 0);
    const totalExposure = totalBalance * 45000;
    
    return {
      totalExposure,
      transactionCount: 0,
      undeclaredWallets,
      declaredWallets,
      walletCount: wallets.length,
      totalBalance
    };
  }, [customer]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    toast.info("Refreshing customer data...");
    await fetchCustomerData();
  };

  const handleExportData = () => {
    if (!customer) return;
    
    try {
      const exportData = {
        metadata: {
          exportedAt: new Date().toISOString(),
          reportType: "Customer Detail Export",
          customerId: customer.customer_id,
          dataSource: "Crypto Risk API"
        },
        customer,
        transactions: transactions.slice(0, 50),
        riskFlags,
        statistics: stats,
        summary: {
          riskLevel: getRiskStatus(customer.average_risk_score),
          kycStatus: customer.kyc_status || 'unknown',
          totalFlags: riskFlags.length
        }
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `customer-${customer.customer_id}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("Customer data exported");
    } catch (err) {
      console.error('Export error:', err);
      toast.error("Failed to export data");
    }
  };

  const handleGenerateReport = async () => {
    if (!customer) return;
    
    setGeneratingReport(true);
    
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      const riskStatus = getRiskStatus(customer.average_risk_score);
      
      doc.setFillColor(26, 54, 93);
      doc.rect(0, 0, 210, 40, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.text("CRYPTO RISK DASHBOARD", 20, 25);
      doc.setFontSize(12);
      doc.text("Customer Risk Report", 20, 35);

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(18);
      doc.text(`Customer: ${customer.first_name} ${customer.last_name}`, 20, 55);
      doc.setFontSize(12);
      doc.text(`Customer ID: ${customer.customer_id}`, 20, 65);
      doc.text(`SA ID: ${customer.sa_id || customer.id_number || 'N/A'}`, 20, 75);
      doc.text(`Risk Score: ${Math.round(customer.average_risk_score)}/100`, 20, 85);
      doc.text(`Status: ${riskStatus.toUpperCase()} RISK`, 20, 95);

      doc.setFontSize(16);
      doc.text("Risk Overview", 20, 115);
      doc.setFontSize(11);
      doc.text(`• Total Exposure: ${formatZAR(stats.totalExposure)}`, 25, 130);
      doc.text(`• Total Balance: ${customer.total_balance || 0} ETH`, 25, 140);
      doc.text(`• Declared Wallets: ${stats.declaredWallets}`, 25, 150);
      doc.text(`• Undeclared Wallets: ${stats.undeclaredWallets}`, 25, 160);
      doc.text(`• VASP: ${customer.vasp_id || 'N/A'}`, 25, 170);
      doc.text(`• KYC Status: ${customer.kyc_status?.toUpperCase() || 'UNKNOWN'}`, 25, 180);

      if (riskFlags.length > 0) {
        doc.setFontSize(16);
        doc.text("Active Risk Flags", 20, 200);
        doc.setFontSize(11);
        
        riskFlags.forEach((flag, index) => {
          const yPos = 215 + (index * 15);
          doc.text(`• ${flag.type} (${flag.severity}): ${flag.description}`, 25, yPos);
        });
      }

      doc.setFontSize(9);
      doc.setTextColor(128, 128, 128);
      doc.text("Generated by Crypto Risk Dashboard", 20, 280);
      doc.text(`Generated: ${new Date().toLocaleDateString('en-ZA')} ${new Date().toLocaleTimeString('en-ZA')}`, 150, 280);

      const fileName = `customer-report-${customer.customer_id}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      toast.success("Customer report generated");
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error("Failed to generate report");
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleFlagCustomer = () => {
    if (!customer) return;
    
    toast.info("Customer flagged for review", {
      description: `${customer.first_name} ${customer.last_name} has been flagged for compliance review`
    });
  };

  const handleResolveFlag = (flagId: string) => {
    setRiskFlags(prev => prev.map(flag => 
      flag.id === flagId ? { ...flag, resolved: true } : flag
    ));
    toast.success("Risk flag marked as resolved");
  };

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    toast.success(message);
  };

  useEffect(() => {
    if (id) {
      fetchCustomerData();
    }
  }, [id, fetchCustomerData]);

  if (isLoading && !customer) {
    return (
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar lastUpdated={getTimeAgo()} />
        <main className="flex-1 w-full p-4 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <div>
              <p className="text-muted-foreground">Loading customer data...</p>
              <p className="text-xs text-muted-foreground mt-1">Customer ID: {id}</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error && !customer && searchAttempted) {
    return (
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar lastUpdated={getTimeAgo()} />
        <main className="flex-1 w-full p-4">
          <div className="h-full flex flex-col justify-center items-center">
            <div className="text-center space-y-4 max-w-md">
              <AlertTriangle className="w-16 h-16 text-destructive mx-auto" />
              <div>
                <h2 className="text-xl font-bold">Customer Not Found</h2>
                <p className="text-muted-foreground mt-2">{error}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 justify-center pt-4">
                <Button variant="outline" onClick={() => navigate("/customers")} className="w-full sm:w-auto">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Customers
                </Button>
                <Button onClick={handleRefresh} className="w-full sm:w-auto">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  const riskScore = Math.round(customer.average_risk_score || 0);
  const riskStatus = getRiskStatus(riskScore);
  const activeRiskFlags = riskFlags.filter(f => !f.resolved);

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar lastUpdated={getTimeAgo()} />
      
      <main className="flex-1 w-full md:ml-[280px] transition-all">
        {/* Header - Mobile Optimized */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b">
          <div className="p-3 md:px-6 md:py-4">
            {/* Mobile Top Bar */}
            <div className="md:hidden mb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="h-10 w-10 border-2"
                    onClick={() => navigate(-1)}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <div>
                    <h1 className="text-lg font-bold">Customer Details</h1>
                    <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                      {customer.customer_id}
                    </p>
                  </div>
                </div>
                <Badge className={getRiskBadge(riskScore) + " text-xs px-3 py-1"}>
                  {riskStatus.toUpperCase()}
                </Badge>
              </div>
            </div>

            {/* Desktop Header */}
            <div className="hidden md:flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate(-1)}
                  className="gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="font-bold text-primary">
                      {customer.first_name?.[0]}{customer.last_name?.[0]}
                    </span>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold">
                      {customer.first_name} {customer.last_name}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      {customer.customer_id}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge className={getRiskBadge(riskScore) + " text-sm"}>
                  {riskStatus.toUpperCase()}
                </Badge>
              </div>
            </div>

            {/* Desktop Header Actions */}
            <div className="hidden md:flex items-center justify-between mt-3">
              <div className="text-sm text-muted-foreground">
                Updated: {getTimeAgo()}
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                  <span>Refresh</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleExportData}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleGenerateReport}
                  disabled={generatingReport}
                  className="gap-2"
                >
                  {generatingReport ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                  <span>Report</span>
                </Button>
                
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={handleFlagCustomer}
                  className="gap-2"
                >
                  <Flag className="w-4 h-4" />
                  <span>Flag</span>
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="p-3 md:p-6 max-w-7xl mx-auto">
          {/* Error Banner */}
          {error && (
            <div className="mb-4">
              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-destructive">Partial Data Loaded</div>
                  <div className="text-xs text-destructive/80 mt-0.5">{error}</div>
                </div>
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
          )}

          {/* Customer Info Bar - Mobile */}
          <div className="md:hidden mb-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-card border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="font-bold text-primary text-lg">
                    {customer.first_name?.[0]}{customer.last_name?.[0]}
                  </span>
                </div>
                <div>
                  <h2 className="font-bold text-lg">{customer.first_name} {customer.last_name}</h2>
                  <p className="text-xs text-muted-foreground">{customer.email || 'No email'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards - Mobile Optimized */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-6">
            <Card className="border-border/50">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Risk Score</p>
                    <p className={`text-lg md:text-2xl font-bold ${getRiskColor(riskScore)}`}>
                      {riskScore}
                    </p>
                  </div>
                  <Shield className={`w-6 h-6 md:w-8 md:h-8 ${getRiskColor(riskScore)}`} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Exposure</p>
                    <p className="text-lg md:text-xl font-bold">{formatZAR(stats.totalExposure)}</p>
                  </div>
                  <Wallet className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Wallets</p>
                    <p className="text-lg md:text-xl font-bold">{stats.walletCount}</p>
                    <p className="text-xs text-muted-foreground">
                      {stats.declaredWallets}D/{stats.undeclaredWallets}U
                    </p>
                  </div>
                  <CreditCard className="w-6 h-6 md:w-8 md:h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Risk Flags</p>
                    <p className={`text-lg md:text-xl font-bold ${activeRiskFlags.length > 0 ? 'text-destructive' : 'text-success'}`}>
                      {activeRiskFlags.length}
                    </p>
                  </div>
                  <AlertCircle className={`w-6 h-6 md:w-8 md:h-8 ${activeRiskFlags.length > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mobile Action Buttons */}
          <div className="flex gap-2 mb-4 md:hidden overflow-x-auto pb-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex-shrink-0 px-3"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExportData}
              className="flex-shrink-0 px-3"
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              Export
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleGenerateReport}
              disabled={generatingReport}
              className="flex-shrink-0 px-3"
            >
              {generatingReport ? (
                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
              ) : (
                <FileText className="w-3.5 h-3.5 mr-1" />
              )}
              Report
            </Button>
            
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleFlagCustomer}
              className="flex-shrink-0 px-3"
            >
              <Flag className="w-3.5 h-3.5 mr-1" />
              Flag
            </Button>
          </div>

          {/* Customer Info & Wallets - Mobile Stacked */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
            <Card className="border-border/50">
              <CardHeader className="p-3 md:p-4">
                <CardTitle className="text-base md:text-lg flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Customer Info
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 md:p-4 pt-0 space-y-3">
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">SA ID Number</p>
                    <div className="flex items-center gap-1 mt-1">
                      <p className="font-medium text-sm truncate">{customer.sa_id || 'N/A'}</p>
                      {customer.sa_id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => copyToClipboard(customer.sa_id!, "SA ID copied")}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <div className="flex items-center gap-1 mt-1">
                      <p className="font-medium text-sm truncate">{customer.email || 'Not provided'}</p>
                      {customer.email && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => copyToClipboard(customer.email!, "Email copied")}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">KYC Status</p>
                      <div className="mt-1">
                        <Badge 
                          className={
                            customer.kyc_status === 'VERIFIED' || customer.kyc_status === 'verified' ? 'bg-success/20 text-success text-xs' :
                            customer.kyc_status === 'PENDING' || customer.kyc_status === 'pending' ? 'bg-warning/20 text-warning text-xs' :
                            'bg-muted/20 text-muted-foreground text-xs'
                          }
                        >
                          {customer.kyc_status?.toUpperCase() || 'UNKNOWN'}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Customer Since</p>
                      <p className="font-medium text-xs mt-1">
                        {new Date(customer.created_at).toLocaleDateString('en-ZA')}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="p-3 md:p-4">
                <CardTitle className="text-base md:text-lg flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  Wallet Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 md:p-4 pt-0 space-y-3">
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <div className="flex flex-col p-2 md:p-3 rounded-lg bg-success/10 border border-success/20">
                    <p className="text-xs text-muted-foreground">Declared</p>
                    <p className="text-lg md:text-xl font-bold text-success mt-1">{stats.declaredWallets}</p>
                  </div>
                  <div className="flex flex-col p-2 md:p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <p className="text-xs text-muted-foreground">Undeclared</p>
                    <p className="text-lg md:text-xl font-bold text-destructive mt-1">{stats.undeclaredWallets}</p>
                  </div>
                </div>
                
                {customer.primary_wallet && (
                  <div className="p-2 md:p-3 rounded-lg bg-muted/10 border border-muted/20">
                    <p className="text-xs text-muted-foreground mb-1">Primary Wallet</p>
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-mono text-xs truncate flex-1">{formatWalletAddress(customer.primary_wallet)}</p>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => copyToClipboard(customer.primary_wallet!, "Wallet copied")}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => window.open(`https://etherscan.io/address/${customer.primary_wallet}`, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Risk: <span className={getRiskColor(customer.primary_wallet_risk)}>{customer.primary_wallet_risk || 'N/A'}</span>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tabs Section - Mobile Optimized */}
          <div className="mb-4 md:mb-6">
            {/* Mobile Tab Navigation - Scrollable */}
            <div className="md:hidden mb-3">
              <div className="flex overflow-x-auto pb-1 space-x-1">
                <Button
                  variant={activeTab === "wallets" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("wallets")}
                  className="flex-shrink-0 px-3 gap-1"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  Wallets
                </Button>
                <Button
                  variant={activeTab === "transactions" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("transactions")}
                  className="flex-shrink-0 px-3 gap-1"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  Transactions
                </Button>
                <Button
                  variant={activeTab === "riskflags" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("riskflags")}
                  className="flex-shrink-0 px-3 gap-1 relative"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  Risk Flags
                  {activeRiskFlags.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] flex items-center justify-center text-white">
                      {activeRiskFlags.length}
                    </span>
                  )}
                </Button>
              </div>
            </div>

            {/* Desktop Tabs */}
            <div className="hidden md:block">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="wallets" className="gap-2">
                    <CreditCard className="w-4 h-4" />
                    Wallets
                  </TabsTrigger>
                  <TabsTrigger value="transactions" className="gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Transactions
                  </TabsTrigger>
                  <TabsTrigger value="riskflags" className="gap-2 relative">
                    <AlertCircle className="w-4 h-4" />
                    Risk Flags
                    {activeRiskFlags.length > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] flex items-center justify-center text-white">
                        {activeRiskFlags.length}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Tab Content */}
          <div className="space-y-3 md:space-y-4">
            {/* Wallets Tab */}
            {activeTab === "wallets" && (
              <Card className="border-border/50">
                <CardHeader className="p-3 md:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base md:text-lg flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Customer Wallets
                      </CardTitle>
                      <CardDescription className="hidden md:block">All detected wallet addresses</CardDescription>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {customer.wallets?.length || 0} wallets
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {customer.wallets && customer.wallets.length > 0 ? (
                    <>
                      {/* Desktop Table */}
                      <div className="hidden md:block">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="min-w-[150px]">Address</TableHead>
                                <TableHead className="min-w-[80px]">Chain</TableHead>
                                <TableHead className="min-w-[100px]">Declared</TableHead>
                                <TableHead className="min-w-[80px]">Risk</TableHead>
                                <TableHead className="min-w-[100px]">Balance</TableHead>
                                <TableHead className="min-w-[80px]">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {customer.wallets.map((wallet, index) => (
                                <TableRow key={wallet.address || index}>
                                  <TableCell className="font-mono text-sm">
                                    <div className="flex items-center gap-2">
                                      {formatWalletAddress(wallet.address)}
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => copyToClipboard(wallet.address, "Wallet copied")}
                                      >
                                        <Copy className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                  <TableCell className="capitalize">
                                    <Badge variant="outline" className="text-xs">
                                      {wallet.blockchain || 'ETH'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Badge 
                                      className={wallet.declared ? 'bg-success/20 text-success text-xs' : 'bg-destructive/20 text-destructive text-xs'}
                                    >
                                      {wallet.declared ? 'Yes' : 'No'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <span className={getRiskColor(wallet.risk_score) + " font-medium"}>
                                      {wallet.risk_score || 'N/A'}
                                    </span>
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    {wallet.balance !== undefined ? `${wallet.balance} ETH` : 'N/A'}
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => window.open(`https://etherscan.io/address/${wallet.address}`, '_blank')}
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                      
                      {/* Mobile Cards */}
                      <div className="md:hidden">
                        <div className="space-y-2 p-3">
                          {customer.wallets.map((wallet, index) => (
                            <div key={wallet.address || index} className="p-3 rounded-lg border border-border/50 bg-card">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <p className="font-mono text-xs mb-1">{formatWalletAddress(wallet.address)}</p>
                                  <div className="flex items-center gap-1 flex-wrap">
                                    <Badge 
                                      className={wallet.declared ? 'bg-success/20 text-success text-xs' : 'bg-destructive/20 text-destructive text-xs'}
                                    >
                                      {wallet.declared ? 'Declared' : 'Undeclared'}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {wallet.blockchain || 'ETH'}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => copyToClipboard(wallet.address, "Wallet copied")}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => window.open(`https://etherscan.io/address/${wallet.address}`, '_blank')}
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <p className="text-xs text-muted-foreground mb-0.5">Risk Score</p>
                                  <p className={getRiskColor(wallet.risk_score) + " text-sm font-medium"}>
                                    {wallet.risk_score || 'N/A'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground mb-0.5">Balance</p>
                                  <p className="text-sm font-medium">{wallet.balance !== undefined ? `${wallet.balance} ETH` : 'N/A'}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No wallet data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Transactions Tab */}
            {activeTab === "transactions" && (
              <Card className="border-border/50">
                <CardHeader className="p-3 md:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base md:text-lg flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Recent Transactions
                      </CardTitle>
                      <CardDescription className="hidden md:block">Latest transaction activity</CardDescription>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {transactions.length} total
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {transactions.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No transaction data available</p>
                    </div>
                  ) : (
                    <>
                      {/* Desktop Table */}
                      <div className="hidden md:block">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="min-w-[100px]">TX ID</TableHead>
                                <TableHead className="min-w-[120px]">Date</TableHead>
                                <TableHead className="min-w-[100px]">Type</TableHead>
                                <TableHead className="min-w-[120px]">Amount</TableHead>
                                <TableHead className="min-w-[120px]">Value (ZAR)</TableHead>
                                <TableHead className="min-w-[100px]">Status</TableHead>
                                <TableHead className="min-w-[80px]">Risk</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {transactions.slice(0, 5).map((tx) => (
                                <TableRow key={tx.id}>
                                  <TableCell className="font-mono text-sm">
                                    {tx.id.slice(0, 10)}...
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    {new Date(tx.timestamp).toLocaleDateString('en-ZA', { 
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="text-xs capitalize">
                                      {tx.type}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="font-medium text-sm">
                                    {formatCurrency(tx.amount, tx.currency)}
                                  </TableCell>
                                  <TableCell className="text-sm font-medium">
                                    {formatZAR(tx.value_zar)}
                                  </TableCell>
                                  <TableCell>
                                    <Badge 
                                      variant={
                                        tx.status === "completed" ? "default" :
                                        tx.status === "pending" ? "secondary" : "destructive"
                                      }
                                      className="text-xs"
                                    >
                                      {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    {tx.risk_score ? (
                                      <Badge 
                                        variant="outline" 
                                        className={
                                          getRiskStatus(tx.risk_score) === 'high' ? 'border-destructive/50 text-destructive text-xs' :
                                          getRiskStatus(tx.risk_score) === 'medium' ? 'border-warning/50 text-warning text-xs' :
                                          'border-success/50 text-success text-xs'
                                        }
                                      >
                                        {tx.risk_score}
                                      </Badge>
                                    ) : (
                                      <span className="text-xs text-muted-foreground">N/A</span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                      
                      {/* Mobile Cards */}
                      <div className="md:hidden">
                        <div className="space-y-2 p-3">
                          {transactions.slice(0, 5).map((tx) => (
                            <div key={tx.id} className="p-3 rounded-lg border border-border/50 bg-card">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <p className="font-mono text-xs mb-1">{tx.id.slice(0, 12)}...</p>
                                  <Badge 
                                    variant={
                                      tx.status === "completed" ? "default" :
                                      tx.status === "pending" ? "secondary" : "destructive"
                                    }
                                    className="text-xs"
                                  >
                                    {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                                  </Badge>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(tx.timestamp).toLocaleDateString('en-ZA', { 
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 mb-2">
                                <div>
                                  <p className="text-xs text-muted-foreground mb-0.5">Type</p>
                                  <Badge variant="outline" className="text-xs capitalize">
                                    {tx.type}
                                  </Badge>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground mb-0.5">Amount</p>
                                  <p className="text-sm font-medium">{formatCurrency(tx.amount, tx.currency)}</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <p className="text-xs text-muted-foreground mb-0.5">Value (ZAR)</p>
                                  <p className="text-sm font-medium">{formatZAR(tx.value_zar)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground mb-0.5">Risk Score</p>
                                  {tx.risk_score ? (
                                    <Badge 
                                      variant="outline" 
                                      className={
                                        getRiskStatus(tx.risk_score) === 'high' ? 'border-destructive/50 text-destructive text-xs' :
                                        getRiskStatus(tx.risk_score) === 'medium' ? 'border-warning/50 text-warning text-xs' :
                                        'border-success/50 text-success text-xs'
                                      }
                                    >
                                      {tx.risk_score}
                                    </Badge>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">N/A</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {transactions.length > 5 && (
                        <div className="text-center py-2 border-t text-xs text-muted-foreground">
                          Showing 5 of {transactions.length} transactions
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Risk Flags Tab */}
            {activeTab === "riskflags" && (
              <Card className="border-border/50">
                <CardHeader className="p-3 md:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base md:text-lg flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Risk Flags
                      </CardTitle>
                      <CardDescription className="hidden md:block">Compliance alerts requiring attention</CardDescription>
                    </div>
                    <Badge variant={activeRiskFlags.length === 0 ? "default" : "destructive"} className="text-xs">
                      {activeRiskFlags.length} Active
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-3 md:p-4">
                  {riskFlags.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No risk flags detected for this customer</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {riskFlags.map((flag) => (
                        <div
                          key={flag.id}
                          className={`p-3 rounded-lg border ${
                            flag.resolved 
                              ? 'bg-muted/10 border-muted/30'
                              : flag.severity === "high"
                                ? "bg-destructive/10 border-destructive/30"
                                : "bg-warning/10 border-warning/30"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <AlertTriangle
                                  className={`w-4 h-4 flex-shrink-0 ${
                                    flag.resolved 
                                      ? 'text-muted-foreground'
                                      : flag.severity === "high" 
                                        ? "text-destructive" 
                                        : "text-warning"
                                  }`}
                                />
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-sm truncate">{flag.type}</h4>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <Badge
                                      className={
                                        flag.resolved 
                                          ? 'bg-muted/20 text-muted-foreground text-xs'
                                          : flag.severity === "high"
                                            ? "bg-destructive/20 text-destructive text-xs"
                                            : "bg-warning/20 text-warning text-xs"
                                      }
                                    >
                                      {flag.severity.toUpperCase()}
                                    </Badge>
                                    {flag.resolved && (
                                      <Badge variant="outline" className="text-xs">
                                        Resolved
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground mb-1">{flag.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(flag.timestamp).toLocaleDateString('en-ZA', { 
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                            {!flag.resolved && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleResolveFlag(flag.id)}
                                className="h-7 text-xs flex-shrink-0 px-2"
                              >
                                <CheckCircle className="w-3 h-3 mr-0.5" />
                                Resolve
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CustomerDetail;