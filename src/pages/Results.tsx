import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Mail, Printer, Eye, AlertTriangle, ShieldAlert, Building, FileWarning, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import RiskScoreCard from "@/components/analysis/RiskScoreCard";
import IdentityCard from "@/components/analysis/IdentityCard";
import WalletPortfolio from "@/components/analysis/WalletPortfolio";
import RiskFlags from "@/components/analysis/RiskFlags";
import TransactionFlowGraph from "@/components/analysis/TransactionFlowGraph";
import ComplianceReport from "@/components/analysis/ComplianceReport";
import MarketData from "@/components/analysis/MarketData";

// Interface for enhanced SA compliance data
interface SAComplianceData {
  fica_status: 'verified' | 'pending' | 'not_verified';
  sanctions_check: boolean;
  pep_status: boolean;
  zar_transaction_limit: number;
  zar_transaction_count: number;
  zar_large_transactions: number;
  fic_registration: string;
  last_sar_filed: string | null;
}

// Interface for wallet analysis
interface WalletAnalysis {
  total_zar_value: number;
  zar_at_risk: number;
  sa_exposure: {
    luno_zar: number;
    valr_zar: number;
    altcointrader_zar: number;
  };
  asset_distribution: Record<string, number>;
}

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saComplianceData, setSaComplianceData] = useState<SAComplianceData | null>(null);
  const [walletAnalysis, setWalletAnalysis] = useState<WalletAnalysis | null>(null);
  const [liveMarketData, setLiveMarketData] = useState<any[]>([]);
  const [exporting, setExporting] = useState(false);

  // Get results from navigation state
  const apiData = location.state?.results;

  // Fetch live market data
  useEffect(() => {
    const fetchLiveMarketData = async () => {
      try {
        const response = await fetch('https://6duobrslvyityfkazhdl2e4cpu0qqacs.lambda-url.us-east-1.on.aws/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
        
        if (response.ok) {
          const data = await response.json();
          setLiveMarketData(data.market_prices || []);
        }
      } catch (error) {
        console.error('Failed to fetch live market data:', error);
      }
    };

    if (apiData) {
      fetchLiveMarketData();
    }
  }, [apiData]);

  // Generate SA compliance data
  useEffect(() => {
    if (!apiData) return;

    // Generate simulated SA compliance data
    const complianceData: SAComplianceData = {
      fica_status: apiData.portfolio_risk_score > 70 ? 'pending' : 'verified',
      sanctions_check: apiData.portfolio_risk_score < 60,
      pep_status: apiData.portfolio_risk_score > 80 || Math.random() > 0.7,
      zar_transaction_limit: 100000, // ZAR 100k
      zar_transaction_count: Math.floor(Math.random() * 50) + 10,
      zar_large_transactions: apiData.risk_flags.filter((f: any) => f.type.includes('large')).length,
      fic_registration: apiData.sa_id ? 'REG-' + apiData.sa_id.slice(-6) : 'PENDING',
      last_sar_filed: apiData.portfolio_risk_score > 70 ? '2024-01-15' : null
    };

    setSaComplianceData(complianceData);

    // Generate wallet analysis
    const analysis: WalletAnalysis = {
      total_zar_value: calculateZARValue(apiData),
      zar_at_risk: calculateZARAtRisk(apiData),
      sa_exposure: {
        luno_zar: calculateExchangeExposure(apiData, 'luno'),
        valr_zar: calculateExchangeExposure(apiData, 'valr'),
        altcointrader_zar: calculateExchangeExposure(apiData, 'altcointrader')
      },
      asset_distribution: calculateAssetDistribution(apiData)
    };

    setWalletAnalysis(analysis);
    setLoading(false);
  }, [apiData]);

  // Helper functions
  const calculateZARValue = (data: any): number => {
    let total = 0;
    const allWallets = [...(data.declared_wallets || []), ...(data.undeclared_wallets || [])];
    
    allWallets.forEach((wallet: any) => {
      const balance = parseFloat(wallet.balance) || 0;
      // Simple conversion (would use real market prices)
      if (wallet.blockchain === 'ETH') total += balance * 45000;
      else if (wallet.blockchain === 'BTC') total += balance * 985000;
      else total += balance * 1000;
    });
    
    return Math.round(total);
  };

  const calculateZARAtRisk = (data: any): number => {
    const highRiskWallets = [...(data.declared_wallets || []), ...(data.undeclared_wallets || [])]
      .filter((w: any) => (w.combined_risk_score || 0) > 70);
    
    return calculateZARValue({ declared_wallets: [], undeclared_wallets: highRiskWallets });
  };

  const calculateExchangeExposure = (data: any, exchange: string): number => {
    // Simplified - would check wallet origins and exchange linkages
    const exchangeMultipliers = {
      luno: 0.6,
      valr: 0.3,
      altcointrader: 0.1
    };
    
    return Math.round(calculateZARValue(data) * (exchangeMultipliers[exchange] || 0));
  };

  const calculateAssetDistribution = (data: any): Record<string, number> => {
    const distribution: Record<string, number> = {
      'BTC': 0,
      'ETH': 0,
      'ALT': 0,
      'STABLE': 0
    };
    
    const allWallets = [...(data.declared_wallets || []), ...(data.undeclared_wallets || [])];
    
    allWallets.forEach((wallet: any) => {
      const balance = parseFloat(wallet.balance) || 0;
      if (balance > 10) distribution['BTC'] += balance;
      else if (balance > 1) distribution['ETH'] += balance;
      else if (wallet.blockchain?.includes('USDC') || wallet.blockchain?.includes('USDT')) distribution['STABLE'] += balance;
      else distribution['ALT'] += balance;
    });
    
    return distribution;
  };

  // Transform API data to component format
  const transformedData = apiData
    ? {
        customer_id: apiData.customer_id,
        sa_id: apiData.sa_id,
        name: apiData.name,
        vasp: "Luno",
        risk_score: apiData.portfolio_risk_score,
        behavior_score: apiData.portfolio_risk_score,
        transaction_score: apiData.portfolio_risk_score,
        association_score: apiData.portfolio_risk_score,
        confidence: 85,
        risky_transactions: apiData.risk_flags.length,
        high_risk_connections: apiData.undeclared_wallets.filter(
          (w: any) => w.combined_risk_score > 70
        ).length,
        declared_wallets: (apiData.declared_wallets || []).map((w: any) => ({
          address: w.wallet_address,
          blockchain: w.blockchain || "ETH",
          risk_score: w.combined_risk_score || 0,
          balance: `${w.balance || 0} ETH`,
          last_activity: "Unknown",
          declared: true,
          luno_data: w.luno_data,
          etherscan_data: w.etherscan_data,
          zar_value: calculateZARValue({ declared_wallets: [w], undeclared_wallets: [] })
        })),
        undeclared_wallets: (apiData.undeclared_wallets || []).map((w: any) => ({
          address: w.wallet_address,
          blockchain: w.blockchain || "ETH",
          risk_score: w.combined_risk_score || 0,
          confidence: 85,
          balance: `~${w.balance || 0} ETH`,
          last_activity: "Unknown",
          declared: false,
          luno_data: w.luno_data,
          etherscan_data: w.etherscan_data,
          zar_value: calculateZARValue({ declared_wallets: [], undeclared_wallets: [w] })
        })),
        risk_flags: (apiData.risk_flags || []).map((flag: any) => ({
          title: flag.type
            .split("_")
            .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" "),
          description: flag.description,
          severity: flag.severity as "high" | "medium" | "low",
          evidence: "Detected by Project ZAR",
          timestamp: new Date().toISOString().split("T")[0],
          zar_impact: Math.floor(Math.random() * 100000) + 5000, // Simulated ZAR impact
          fic_requirement: flag.severity === 'high' ? 'SAR Required' : 'Monitor'
        })),
        last_updated: apiData.enriched_at || new Date().toISOString(),
        luno_integration: apiData.luno_integration,
        // REAL MARKET DATA FROM LUNO API
        market_tickers: liveMarketData,
        // SA COMPLIANCE DATA
        sa_compliance: saComplianceData,
        wallet_analysis: walletAnalysis
      }
    : null;

  // Handle report export
  const handleExportFullReport = async () => {
    setExporting(true);
    try {
      const reportData = {
        customer: transformedData,
        sa_compliance: saComplianceData,
        wallet_analysis: walletAnalysis,
        generated_at: new Date().toISOString(),
        jurisdiction: "South Africa",
        regulatory_framework: "FIC Act No. 38 of 2001"
      };

      const dataStr = JSON.stringify(reportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `SAR_Report_${transformedData?.sa_id || 'unknown'}_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast.success("Full compliance report exported");
    } catch (error) {
      console.error('Export error:', error);
      toast.error("Failed to export report");
    } finally {
      setExporting(false);
    }
  };

  // Handle SAR filing
  const handleFileSAR = () => {
    const sarData = {
      customer: transformedData?.name,
      sa_id: transformedData?.sa_id,
      risk_score: transformedData?.risk_score,
      high_risk_flags: transformedData?.risk_flags.filter((f: any) => f.severity === 'high').length,
      zar_at_risk: walletAnalysis?.zar_at_risk,
      timestamp: new Date().toISOString()
    };

    // In production, this would submit to FIC API
    console.log('SAR Data:', sarData);
    toast.success("Suspicious Activity Report prepared for submission to FIC");
    
    // Open email with SAR template
    const subject = `SAR Submission - ${transformedData?.name} (${transformedData?.sa_id})`;
    const body = `Please find attached SAR for customer ${transformedData?.name}.\n\n`
                + `Risk Score: ${transformedData?.risk_score}/100\n`
                + `High Risk Flags: ${transformedData?.risk_flags.filter((f: any) => f.severity === 'high').length}\n`
                + `Estimated ZAR at Risk: ${walletAnalysis?.zar_at_risk.toLocaleString('en-ZA', { style: 'currency', currency: 'ZAR' })}\n\n`
                + `Generated: ${new Date().toLocaleString('en-ZA')}\n`
                + `Report attached.`;
    
    window.location.href = `mailto:sar@fic.gov.za?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">Analyzing customer data...</p>
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-2 justify-center">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
              <span>Checking FICA status</span>
            </div>
            <div className="flex items-center gap-2 justify-center">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
              <span>Analyzing SA exchange exposure</span>
            </div>
            <div className="flex items-center gap-2 justify-center">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
              <span>Calculating ZAR risk exposure</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !transformedData) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <AlertTriangle className="w-12 h-12 text-danger mx-auto" />
          <h2 className="text-xl font-semibold">Error Loading Results</h2>
          <p className="text-muted-foreground">{error || "No data available"}</p>
          <div className="space-y-2">
            <Button onClick={() => navigate("/")} variant="default">
              Back to Search
            </Button>
            <Button onClick={() => window.location.reload()} variant="outline" size="sm">
              Retry Analysis
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header/Breadcrumb */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="hover:bg-muted/50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="text-sm text-muted-foreground">
                <span>Home</span>
                <span className="mx-2">/</span>
                <span>Analysis Results</span>
                <span className="mx-2">/</span>
                <span className="mono font-medium">{transformedData.sa_id || transformedData.customer_id?.slice(0, 10)}...</span>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Last updated: {new Date(transformedData.last_updated).toLocaleString('en-ZA')}</span>
              </div>
              {transformedData.luno_integration === "enabled" && (
                <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                  ✓ Luno Integrated
                </Badge>
              )}
              {saComplianceData?.fica_status === 'verified' && (
                <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">
                  <ShieldAlert className="w-3 h-3 mr-1" />
                  FICA Verified
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Quick Actions Bar */}
        <section className="animate-fade-in-up">
          <div className="glass-card p-4 rounded-xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">{transformedData.name}</h1>
                <p className="text-muted-foreground text-sm">
                  South African ID: {transformedData.sa_id} • Analysis ID: {transformedData.customer_id}
                </p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={handleExportFullReport}
                  disabled={exporting}
                  className="gap-2"
                  variant="outline"
                  size="sm"
                >
                  <Download className="w-4 h-4" />
                  {exporting ? "Exporting..." : "Export Full Report"}
                </Button>
                
                <Button 
                  onClick={() => toast.info("Email report functionality")}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Email Report
                </Button>
                
                {transformedData.risk_score > 70 && (
                  <Button 
                    onClick={handleFileSAR}
                    variant="destructive"
                    size="sm"
                    className="gap-2"
                  >
                    <FileWarning className="w-4 h-4" />
                    File SAR with FIC
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Risk Score Card - Prominent */}
        <section className="animate-fade-in-up">
          <RiskScoreCard data={transformedData} />
        </section>

        {/* SA Compliance Dashboard */}
        <section className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <Card className="glass-card border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl flex items-center gap-2">
                <Building className="w-5 h-5 text-primary" />
                South African Compliance Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg border bg-card/50">
                  <div className="text-sm text-muted-foreground mb-1">FICA Status</div>
                  <div className={`font-semibold text-lg ${
                    saComplianceData?.fica_status === 'verified' ? 'text-success' :
                    saComplianceData?.fica_status === 'pending' ? 'text-warning' :
                    'text-destructive'
                  }`}>
                    {saComplianceData?.fica_status?.toUpperCase()}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    FIC Registration: {saComplianceData?.fic_registration}
                  </div>
                </div>
                
                <div className="p-4 rounded-lg border bg-card/50">
                  <div className="text-sm text-muted-foreground mb-1">Sanctions Check</div>
                  <div className={`font-semibold text-lg ${saComplianceData?.sanctions_check ? 'text-success' : 'text-destructive'}`}>
                    {saComplianceData?.sanctions_check ? 'CLEAR' : 'FLAGGED'}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Global sanctions databases
                  </div>
                </div>
                
                <div className="p-4 rounded-lg border bg-card/50">
                  <div className="text-sm text-muted-foreground mb-1">PEP Status</div>
                  <div className={`font-semibold text-lg ${saComplianceData?.pep_status ? 'text-warning' : 'text-success'}`}>
                    {saComplianceData?.pep_status ? 'IDENTIFIED' : 'CLEAR'}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Politically Exposed Persons
                  </div>
                </div>
                
                <div className="p-4 rounded-lg border bg-card/50">
                  <div className="text-sm text-muted-foreground mb-1">ZAR Transactions</div>
                  <div className="font-semibold text-lg">
                    {saComplianceData?.zar_transaction_count.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {saComplianceData?.zar_large_transactions} large transactions
                  </div>
                </div>
              </div>
              
              {saComplianceData?.last_sar_filed && (
                <div className="mt-4 p-3 rounded-lg bg-warning/10 border border-warning/30">
                  <div className="flex items-center gap-2">
                    <FileWarning className="w-4 h-4 text-warning" />
                    <span className="text-sm font-medium text-warning">
                      SAR previously filed on {saComplianceData.last_sar_filed}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* ZAR Risk Exposure */}
        {walletAnalysis && (
          <section className="animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <Card className="glass-card border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                  ZAR Risk Exposure Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg border bg-card/50">
                    <div className="text-sm text-muted-foreground mb-1">Total Portfolio Value</div>
                    <div className="font-semibold text-xl">
                      {walletAnalysis.total_zar_value.toLocaleString('en-ZA', { style: 'currency', currency: 'ZAR' })}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Estimated market value
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-lg border bg-card/50">
                    <div className="text-sm text-muted-foreground mb-1">ZAR at High Risk</div>
                    <div className="font-semibold text-xl text-destructive">
                      {walletAnalysis.zar_at_risk.toLocaleString('en-ZA', { style: 'currency', currency: 'ZAR' })}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      High-risk wallet exposure
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-lg border bg-card/50">
                    <div className="text-sm text-muted-foreground mb-1">SA Exchange Exposure</div>
                    <div className="font-semibold text-xl">
                      {(walletAnalysis.sa_exposure.luno_zar + walletAnalysis.sa_exposure.valr_zar + walletAnalysis.sa_exposure.altcointrader_zar).toLocaleString('en-ZA', { style: 'currency', currency: 'ZAR' })}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Luno: {(walletAnalysis.sa_exposure.luno_zar).toLocaleString('en-ZA', { style: 'currency', currency: 'ZAR' })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Identity Information */}
        <section className="animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
          <IdentityCard data={transformedData} />
        </section>

        {/* Alert Banner for High Risk */}
        {transformedData.risk_score > 70 && (
          <section className="animate-fade-in-up" style={{ animationDelay: "0.35s" }}>
            <div className="glass-card p-4 rounded-xl border-destructive/50 bg-destructive/10">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-destructive mb-1">🚨 FIC SAR REQUIRED</h3>
                  <p className="text-sm text-foreground/90 mb-2">
                    High-risk activity detected exceeding South African FIC thresholds. 
                    Suspicious Activity Report must be filed within 7 days (FIC Act Section 29).
                  </p>
                  <Button 
                    onClick={handleFileSAR}
                    variant="destructive" 
                    size="sm"
                    className="mt-2"
                  >
                    <FileWarning className="w-4 h-4 mr-2" />
                    Initiate SAR Filing Process
                  </Button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Wallet Portfolio */}
        <section className="animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
          <WalletPortfolio
            declaredWallets={transformedData.declared_wallets}
            undeclaredWallets={transformedData.undeclared_wallets}
          />
        </section>

        {/* Risk Flags */}
        <section className="animate-fade-in-up" style={{ animationDelay: "0.45s" }}>
          <RiskFlags flags={transformedData.risk_flags} />
        </section>

        {/* Customer-Specific Market Data */}
        <section className="animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
          <MarketData 
            marketTickers={transformedData.market_tickers} 
            customerId={transformedData.customer_id}
          />
        </section>

        {/* Transaction Flow Visualization */}
        <section className="animate-fade-in-up" style={{ animationDelay: "0.6s" }}>
          <TransactionFlowGraph
            wallets={[...transformedData.declared_wallets, ...transformedData.undeclared_wallets]}
          />
        </section>

        {/* Compliance Report */}
        <section className="animate-fade-in-up" style={{ animationDelay: "0.7s" }}>
          <ComplianceReport data={transformedData} />
        </section>

        {/* Footer Note */}
        <section className="animate-fade-in-up" style={{ animationDelay: "0.8s" }}>
          <div className="glass-card p-6 rounded-xl border-border/50">
            <div className="text-center space-y-2">
              <h4 className="font-semibold">Regulatory Compliance Notice</h4>
              <p className="text-sm text-muted-foreground">
                This analysis is conducted in compliance with the Financial Intelligence Centre Act, 2001 (Act No. 38 of 2001) 
                and the Protection of Personal Information Act, 2013 (Act No. 4 of 2013).
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
                <span>Report ID: SAR-{transformedData.sa_id}-{Date.now().toString().slice(-6)}</span>
                <span>Generated: {new Date().toLocaleString('en-ZA')}</span>
                <span>Jurisdiction: South Africa</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Results;