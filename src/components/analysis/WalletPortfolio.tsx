import { useState } from "react";
import { Copy, Eye, TrendingUp, Bitcoin, Wallet, ExternalLink, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Wallet {
  address: string;
  blockchain: string;
  risk_score: number;
  balance: string;
  last_activity: string;
  declared: boolean;
  confidence?: number;
  etherscan_data?: any;
}

interface WalletPortfolioProps {
  declaredWallets: Wallet[];
  undeclaredWallets: Wallet[];
}

const WalletPortfolio = ({ declaredWallets, undeclaredWallets }: WalletPortfolioProps) => {
  const [sortBy, setSortBy] = useState<"risk" | "activity">("risk");
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const allWallets = [...declaredWallets, ...undeclaredWallets];

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast.success("Address copied to clipboard");
  };

  const getRiskColor = (score: number) => {
    if (score <= 30) return "success";
    if (score <= 70) return "warning";
    return "danger";
  };

  const getBlockchainIcon = (blockchain: string) => {
    if (blockchain === "BTC") return <Bitcoin className="w-4 h-4" />;
    return <Wallet className="w-4 h-4" />;
  };

  const sortWallets = (wallets: Wallet[]) => {
    if (sortBy === "risk") {
      return [...wallets].sort((a, b) => b.risk_score - a.risk_score);
    }
    return wallets;
  };

  const openEtherscan = (address: string) => {
    window.open(`https://etherscan.io/address/${address}`, '_blank');
  };

  const TransactionModal = ({ wallet }: { wallet: Wallet }) => {
    const ethData = wallet.etherscan_data;
    
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="glass-card max-w-2xl w-full max-h-96 overflow-y-auto rounded-xl">
          <div className="sticky top-0 bg-card/80 backdrop-blur-sm p-4 flex items-center justify-between border-b border-border/50">
            <h3 className="font-semibold">Transaction Details</h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedWallet(null)}
              className="h-6 w-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Wallet Address</p>
                <code className="mono text-xs bg-muted/50 px-2 py-1 rounded">{wallet.address}</code>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => openEtherscan(wallet.address)}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                View on Etherscan
              </Button>
            </div>

            {ethData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-muted/30 p-3 rounded">
                    <p className="text-xs text-muted-foreground">ETH Balance</p>
                    <p className="font-semibold">{ethData.eth_balance?.toFixed(4)} ETH</p>
                  </div>
                  <div className="bg-muted/30 p-3 rounded">
                    <p className="text-xs text-muted-foreground">Transactions</p>
                    <p className="font-semibold">{ethData.transaction_count || 0}</p>
                  </div>
                  <div className="bg-muted/30 p-3 rounded">
                    <p className="text-xs text-muted-foreground">Last Updated</p>
                    <p className="font-semibold text-xs">
                      {ethData.last_updated ? new Date(ethData.last_updated).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>

                {ethData.risk_indicators && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Risk Indicators</p>
                    <div className="space-y-1 text-sm">
                      {ethData.risk_indicators.high_frequency_trading && (
                        <div className="flex items-center gap-2 text-warning">
                          <span>🔴</span>
                          <span>High frequency trading detected</span>
                        </div>
                      )}
                      {ethData.risk_indicators.large_transactions && (
                        <div className="flex items-center gap-2 text-warning">
                          <span>🔴</span>
                          <span>Large transactions detected</span>
                        </div>
                      )}
                      {ethData.risk_indicators.suspicious_patterns?.length > 0 && (
                        <div className="flex items-center gap-2 text-warning">
                          <span>🔴</span>
                          <span>{ethData.risk_indicators.suspicious_patterns.join(', ')}</span>
                        </div>
                      )}
                      {!ethData.risk_indicators.high_frequency_trading && 
                       !ethData.risk_indicators.large_transactions && 
                       (!ethData.risk_indicators.suspicious_patterns?.length) && (
                        <div className="flex items-center gap-2 text-success">
                          <span>✅</span>
                          <span>No suspicious patterns detected</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {ethData.transactions && ethData.transactions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Recent Transactions ({ethData.transactions.length})</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {ethData.transactions.map((tx: any, idx: number) => (
                        <div key={idx} className="bg-muted/20 p-2 rounded text-xs mono">
                          <div className="flex justify-between items-center">
                            <span className="truncate">{tx.hash}</span>
                            <span className={tx.status ? 'text-success' : 'text-danger'}>
                              {tx.status ? '✓' : '✗'}
                            </span>
                          </div>
                          <div className="text-muted-foreground text-xs mt-1">
                            {tx.value} ETH • {tx.timestamp}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No Etherscan data available</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEtherscan(wallet.address)}
                  className="mt-4"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  View on Etherscan
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const WalletCard = ({ wallet }: { wallet: Wallet }) => {
    const riskColor = getRiskColor(wallet.risk_score);
    
    return (
      <div className="glass-card p-4 rounded-lg hover-lift">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {getBlockchainIcon(wallet.blockchain)}
            <span className="text-sm font-medium">{wallet.blockchain}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={`bg-${riskColor}/10 border-${riskColor}/30 text-${riskColor}`}
            >
              Risk: {wallet.risk_score}
            </Badge>
            {wallet.declared ? (
              <Badge variant="outline" className="bg-success/10 border-success/30 text-success">
                Declared
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-warning/10 border-warning/30 text-warning">
                Undeclared
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <code className="mono text-xs bg-muted/50 px-2 py-1 rounded flex-1 truncate">
              {wallet.address}
            </code>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => copyAddress(wallet.address)}
              className="h-7 w-7 p-0"
            >
              <Copy className="w-3 h-3" />
            </Button>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Balance: {wallet.balance}</span>
            <span>Last: {wallet.last_activity}</span>
          </div>

          {!wallet.declared && wallet.confidence && (
            <div className="text-sm">
              <span className="text-muted-foreground">Confidence: </span>
              <span className="font-semibold text-foreground">{wallet.confidence}%</span>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-3">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs"
            onClick={() => setSelectedWallet(wallet)}
          >
            <Eye className="w-3 h-3 mr-1" />
            View Transactions
          </Button>
          <Button size="sm" variant="outline" className="flex-1 text-xs">
            <TrendingUp className="w-3 h-3 mr-1" />
            Add to Watchlist
          </Button>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="glass-card p-6 rounded-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Wallet Portfolio</h2>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={sortBy === "risk" ? "default" : "outline"}
              onClick={() => setSortBy("risk")}
            >
              Sort by Risk
            </Button>
            <Button
              size="sm"
              variant={sortBy === "activity" ? "default" : "outline"}
              onClick={() => setSortBy("activity")}
            >
              Sort by Activity
            </Button>
          </div>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="all">
              All Wallets ({allWallets.length})
            </TabsTrigger>
            <TabsTrigger value="declared">
              Declared ({declaredWallets.length})
            </TabsTrigger>
            <TabsTrigger value="undeclared">
              Undeclared ({undeclaredWallets.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {sortWallets(allWallets).map((wallet, idx) => (
                <WalletCard key={idx} wallet={wallet} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="declared" className="space-y-4">
            {declaredWallets.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {sortWallets(declaredWallets).map((wallet, idx) => (
                  <WalletCard key={idx} wallet={wallet} />
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No declared wallets</p>
            )}
          </TabsContent>

          <TabsContent value="undeclared" className="space-y-4">
            {undeclaredWallets.length > 0 ? (
              <>
                <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 mb-4">
                  <p className="text-sm">
                    <span className="font-semibold text-warning">Portfolio Discrepancy: </span>
                    System discovered {undeclaredWallets.length} additional wallet{undeclaredWallets.length !== 1 ? 's' : ''} not reported by customer
                  </p>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {sortWallets(undeclaredWallets).map((wallet, idx) => (
                    <WalletCard key={idx} wallet={wallet} />
                  ))}
                </div>
              </>
            ) : (
              <p className="text-center text-muted-foreground py-8">No undeclared wallets found</p>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {selectedWallet && <TransactionModal wallet={selectedWallet} />}
    </>
  );
};

export default WalletPortfolio;