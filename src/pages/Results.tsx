import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Mail, Printer, Eye, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RiskScoreCard from "@/components/analysis/RiskScoreCard";
import IdentityCard from "@/components/analysis/IdentityCard";
import WalletPortfolio from "@/components/analysis/WalletPortfolio";
import RiskFlags from "@/components/analysis/RiskFlags";
import TransactionFlowGraph from "@/components/analysis/TransactionFlowGraph";
import ComplianceReport from "@/components/analysis/ComplianceReport";
import MarketData from "@/components/analysis/MarketData";

// Helper function to generate customer-specific market data
const generateCustomerSpecificMarkets = (customerId: string, wallets: any[]) => {
  // Get customer profile from ID
  const getCustomerProfile = (id: string) => {
    if (id.includes('vitalik')) return 'vitalik';
    if (id.includes('coinbase')) return 'trader';
    if (id.includes('opensea')) return 'nft_trader';
    return 'default';
  };

  // Market data templates for each profile
  const marketTemplates = {
    vitalik: {
      description: "Ethereum Founder - Primarily ETH/BTC holdings",
      pairs: [
        { pair: 'ETHZAR', base: 'ETH', color: 'blue' },
        { pair: 'BTCZAR', base: 'BTC', color: 'orange' },
        { pair: 'USDCZAR', base: 'USDC', color: 'green' }
      ]
    },
    trader: {
      description: "Active Trader - Multiple currency exposure",
      pairs: [
        { pair: 'BTCZAR', base: 'BTC', color: 'orange' },
        { pair: 'XRPZAR', base: 'XRP', color: 'blue' },
        { pair: 'LTCZAR', base: 'LTC', color: 'gray' },
        { pair: 'BCHZAR', base: 'BCH', color: 'green' }
      ]
    },
    nft_trader: {
      description: "NFT Collector - ETH and altcoin focus",
      pairs: [
        { pair: 'ETHZAR', base: 'ETH', color: 'blue' },
        { pair: 'SOLZAR', base: 'SOL', color: 'purple' },
        { pair: 'MANAZAR', base: 'MANA', color: 'orange' },
        { pair: 'SANDZAR', base: 'SAND', color: 'yellow' }
      ]
    },
    default: {
      description: "Standard Crypto User",
      pairs: [
        { pair: 'BTCZAR', base: 'BTC', color: 'orange' },
        { pair: 'ETHZAR', base: 'ETH', color: 'blue' },
        { pair: 'XRPZAR', base: 'XRP', color: 'blue' }
      ]
    }
  };

  // Base prices (realistic ZAR prices)
  const basePrices = {
    'BTCZAR': 985000,
    'ETHZAR': 45000,
    'XRPZAR': 8.5,
    'LTCZAR': 1200,
    'BCHZAR': 3500,
    'SOLZAR': 850,
    'MANAZAR': 3.2,
    'SANDZAR': 2.8,
    'USDCZAR': 18.5,
    'ADA': 4.5,
    'DOT': 60
  };

  // Get customer profile
  const profile = getCustomerProfile(customerId);
  const template = marketTemplates[profile];
  
  // Analyze wallet holdings to customize further
  const walletAnalysis = analyzeWallets(wallets);
  
  // Generate market data
  return template.pairs.map(({ pair, base, color }) => {
    const basePrice = basePrices[pair] || basePrices[base] || 1000;
    
    // Add some randomness (±2%)
    const lastTrade = basePrice * (0.98 + Math.random() * 0.04);
    const spread = basePrice * 0.001; // 0.1% spread
    
    // Customer-specific volume based on profile
    let volumeMultiplier = 1;
    if (profile === 'vitalik') volumeMultiplier = 5; // Higher volume
    if (profile === 'trader') volumeMultiplier = 3; // Active trader
    
    // Check if customer holds this asset
    const holdsAsset = walletAnalysis.holdings.includes(base);
    if (holdsAsset) volumeMultiplier *= 2;
    
    return {
      pair,
      last_trade: lastTrade.toFixed(profile.includes('ZAR') ? 0 : 2),
      bid: (lastTrade - spread).toFixed(profile.includes('ZAR') ? 0 : 2),
      ask: (lastTrade + spread).toFixed(profile.includes('ZAR') ? 0 : 2),
      rolling_24_hour_volume: (basePrice * volumeMultiplier * (0.5 + Math.random())).toFixed(2),
      status: holdsAsset ? 'ACTIVE_HOLDINGS' : 'ACTIVE',
      customer_holds: holdsAsset,
      profile_color: color
    };
  });
};

// Helper to analyze wallet holdings
const analyzeWallets = (wallets: any[]) => {
  const holdings: string[] = [];
  const totalValue = wallets.reduce((sum, wallet) => {
    const balance = parseFloat(wallet.balance) || 0;
    if (balance > 0) {
      // Simple detection based on balance pattern
      if (balance > 10) holdings.push('BTC');
      else if (balance > 1) holdings.push('ETH');
      else holdings.push('ALT');
    }
    return sum + balance;
  }, 0);
  
  return {
    holdings,
    totalValue,
    walletCount: wallets.length
  };
};

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get results from navigation state
  const apiData = location.state?.results;

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
        })),
        last_updated: apiData.enriched_at || new Date().toISOString(),
        luno_integration: apiData.luno_integration,
        // REAL MARKET DATA FROM LUNO API
        market_tickers: apiData.declared_wallets.length > 0
          ? apiData.declared_wallets[0].luno_data?.market_tickers || []
          : [],
      }
    : null;

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">Loading analysis results...</p>
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
          <Button onClick={() => navigate("/")} variant="default">
            Back to Search
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header/Breadcrumb */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="hover:bg-muted/50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="text-sm text-muted-foreground">
                <span>Home</span>
                <span className="mx-2">/</span>
                <span>Analysis Results</span>
                <span className="mx-2">/</span>
                <span className="mono">{apiData?.sa_id?.slice(0, 10)}...</span>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Last updated: {new Date(transformedData.last_updated).toLocaleString()}
              {transformedData.luno_integration === "enabled" && (
                <span className="ml-2 text-green-600">✓ Luno Integrated</span>
              )}
              {apiData?.etherscan_integration === "enabled" && (
                <span className="ml-2 text-green-600">✓ Etherscan Integrated</span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Risk Score Card - Prominent */}
        <section className="animate-fade-in-up">
          <RiskScoreCard data={transformedData} />
        </section>

        {/* Identity Information */}
        <section className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <IdentityCard data={transformedData} />
        </section>

        {/* Alert Banner for High Risk */}
        {transformedData.risk_score > 70 && (
          <section className="animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <div className="glass-card p-4 rounded-xl border-danger/50 bg-danger/10">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-danger mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-danger mb-1">High-Risk Activity Detected</h3>
                  <p className="text-sm text-foreground/90">
                    This wallet shows suspicious activity patterns. Immediate investigation recommended.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Wallet Portfolio */}
        <section className="animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
          <WalletPortfolio
            declaredWallets={transformedData.declared_wallets}
            undeclaredWallets={transformedData.undeclared_wallets}
          />
        </section>

        {/* Risk Flags */}
        <section className="animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
          <RiskFlags flags={transformedData.risk_flags} />
        </section>

        {/* Customer-Specific Market Data */}
        <section className="animate-fade-in-up" style={{ animationDelay: "0.45s" }}>
          <MarketData 
            marketTickers={transformedData.market_tickers} 
            customerId={transformedData.customer_id}
          />
        </section>

        {/* Transaction Flow Visualization */}
        <section className="animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
          <TransactionFlowGraph
            wallets={[...transformedData.declared_wallets, ...transformedData.undeclared_wallets]}
          />
        </section>

        {/* Compliance Report */}
        <section className="animate-fade-in-up" style={{ animationDelay: "0.6s" }}>
          <ComplianceReport data={transformedData} />
        </section>
      </main>
    </div>
  );
};

export default Results;