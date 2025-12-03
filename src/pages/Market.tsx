import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity, Search, RefreshCw, ChevronRight, Menu, X, Globe } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Current exchange rates (approximate)
const USD_TO_ZAR = 18.5; // Current USD to ZAR exchange rate

const mockMarketData = [
  { symbol: "BTC", name: "Bitcoin", price: 67234.50, change: 2.45, volume: "28.4B", marketCap: "1.32T" },
  { symbol: "ETH", name: "Ethereum", price: 3892.15, change: -1.23, volume: "15.2B", marketCap: "467.8B" },
  { symbol: "USDT", name: "Tether", price: 1.00, change: 0.01, volume: "45.6B", marketCap: "95.3B" },
  { symbol: "BNB", name: "BNB", price: 612.34, change: 3.67, volume: "2.1B", marketCap: "89.2B" },
  { symbol: "SOL", name: "Solana", price: 178.92, change: 5.89, volume: "3.8B", marketCap: "78.4B" },
  { symbol: "XRP", name: "Ripple", price: 0.62, change: -2.14, volume: "1.9B", marketCap: "33.7B" },
];

const Market = () => {
  const [lastUpdated] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [currency, setCurrency] = useState<"ZAR" | "USD">("ZAR");

  const getTimeAgo = () => {
    const seconds = Math.floor((new Date().getTime() - lastUpdated.getTime()) / 1000);
    if (seconds < 60) return `${seconds} sec ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    return `${Math.floor(minutes / 60)} hr ago`;
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const toggleCurrency = () => {
    setCurrency(currency === "ZAR" ? "USD" : "ZAR");
  };

  const filteredData = mockMarketData.filter(
    (coin) =>
      coin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coin.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const convertToZAR = (usdAmount: number) => usdAmount * USD_TO_ZAR;
  const convertToUSD = (zarAmount: number) => zarAmount / USD_TO_ZAR;

  const formatPrice = (price: number, symbol: string) => {
    let displayPrice = currency === "ZAR" ? convertToZAR(price) : price;
    const prefix = currency === "ZAR" ? "R" : "$";
    
    if (symbol === "USDT") {
      return currency === "ZAR" ? `R${displayPrice.toFixed(2)}` : `$${displayPrice.toFixed(2)}`;
    }
    
    if (displayPrice > 1000000000) { // Billions
      return `${prefix}${(displayPrice / 1000000000).toFixed(2)}B`;
    }
    if (displayPrice > 1000000) { // Millions
      return `${prefix}${(displayPrice / 1000000).toFixed(2)}M`;
    }
    if (displayPrice > 1000) { // Thousands
      return `${prefix}${(displayPrice / 1000).toFixed(1)}K`;
    }
    return `${prefix}${displayPrice.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatVolume = (volume: string) => {
    const numericValue = parseFloat(volume.replace(/[BMK]/g, ''));
    const unit = volume.replace(/[0-9.]/g, '');
    let zarVolume = numericValue * USD_TO_ZAR;
    
    if (unit === 'B') {
      return `${(zarVolume / 1000000000).toFixed(1)}B`;
    } else if (unit === 'M') {
      return `${(zarVolume / 1000000).toFixed(1)}M`;
    } else if (unit === 'K') {
      return `${(zarVolume / 1000).toFixed(1)}K`;
    }
    return volume;
  };

  const formatMarketCap = (marketCap: string) => {
    const numericValue = parseFloat(marketCap.replace(/[BMK]/g, ''));
    const unit = marketCap.replace(/[0-9.]/g, '');
    let zarMarketCap = numericValue * USD_TO_ZAR;
    
    if (unit === 'T') {
      return `${(zarMarketCap / 1000000000000).toFixed(2)}T`;
    } else if (unit === 'B') {
      return `${(zarMarketCap / 1000000000).toFixed(2)}B`;
    } else if (unit === 'M') {
      return `${(zarMarketCap / 1000000).toFixed(2)}M`;
    }
    return marketCap;
  };

  // Calculate ZAR equivalents for stats
  const totalMarketCapZAR = (2.84 * USD_TO_ZAR).toFixed(1); // in trillions
  const dailyVolumeZAR = (97.2 * USD_TO_ZAR).toFixed(1); // in billions

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar lastUpdated={getTimeAgo()} />
      
      <main className="flex-1 md:ml-[280px] transition-all pt-16 md:pt-0">
        {/* Header - Mobile Responsive */}
        <header className="sticky top-0 z-10 glass-card border-b border-border/50 backdrop-blur-md px-4 py-3 md:px-6 md:py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center justify-between md:justify-start gap-3">
              <div className="md:hidden flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                <h1 className="text-xl font-bold">Market Data</h1>
              </div>
              <div className="hidden md:flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Market Data</h1>
                  <p className="text-sm text-muted-foreground hidden md:block">
                    Real-time cryptocurrency prices in South African Rand
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between md:justify-end gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:flex-none md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search coins..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-muted/50 text-sm md:text-base"
                />
              </div>
              
              <div className="flex items-center gap-2 ml-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleCurrency}
                  className="h-9 w-9 md:h-10 md:w-auto md:gap-2"
                >
                  <Globe className="w-4 h-4" />
                  <span className="hidden md:inline">
                    {currency}
                  </span>
                </Button>
                
                <Badge className="bg-success/20 text-success text-xs md:text-sm px-2 py-0.5 md:px-3 md:py-1">
                  <Activity className="w-3 h-3 md:w-4 md:h-4 mr-1 animate-pulse flex-shrink-0" />
                  <span className="hidden sm:inline">Live</span>
                </Badge>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="h-9 w-9 md:h-10 md:w-auto md:gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                  <span className="hidden md:inline">
                    {refreshing ? "Refreshing..." : "Refresh"}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Stats Cards - Mobile Stacked */}
        <div className="px-3 md:px-6 pt-4 md:pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-4">
            <Card className="glass-card border-border/50">
              <CardContent className="p-3 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">Total Market Cap</p>
                    <p className="text-xl md:text-2xl lg:text-3xl font-bold">
                      {currency === "ZAR" ? `R${totalMarketCapZAR}T` : `$${2.84}T`}
                    </p>
                    <p className="text-xs md:text-sm text-success flex items-center gap-1 mt-1">
                      <TrendingUp className="w-3 h-3" />
                      +2.4% (24h)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="glass-card border-border/50">
              <CardContent className="p-3 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">24h Volume</p>
                    <p className="text-xl md:text-2xl lg:text-3xl font-bold">
                      {currency === "ZAR" ? `R${dailyVolumeZAR}B` : `$${97.2}B`}
                    </p>
                    <p className="text-xs md:text-sm text-destructive flex items-center gap-1 mt-1">
                      <TrendingDown className="w-3 h-3" />
                      -1.8% (24h)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="glass-card border-border/50">
              <CardContent className="p-3 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">BTC Dominance</p>
                    <p className="text-xl md:text-2xl lg:text-3xl font-bold">46.5%</p>
                    <p className="text-xs md:text-sm text-muted-foreground mt-1">ETH: 16.5%</p>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      Rate: R{USD_TO_ZAR.toFixed(2)}/$
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-3 md:p-6">
          <Card className="glass-card border-border/50">
            <CardHeader className="border-b border-border/50 p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg md:text-xl">Top Cryptocurrencies</CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    {currency === "ZAR" ? "Prices in South African Rand" : "Prices in US Dollars"}
                    {searchTerm && ` • Found ${filteredData.length} coins`}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs md:text-sm border-border">
                    {currency}
                  </Badge>
                  <Badge variant="outline" className="text-xs md:text-sm border-border">
                    {mockMarketData.length} coins
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 md:h-9 md:w-auto md:px-3"
                    onClick={() => {
                      // Sort or filter action
                    }}
                  >
                    <ChevronRight className="w-4 h-4" />
                    <span className="hidden md:inline ml-1">Sort</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-4 md:p-6">
              {filteredData.length === 0 ? (
                <div className="text-center py-8 md:py-12">
                  <Search className="w-10 h-10 md:w-12 md:h-12 mx-auto text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No matching coins</h3>
                  <p className="text-muted-foreground text-sm md:text-base">
                    Try a different search term
                  </p>
                </div>
              ) : (
                <div className="space-y-2 md:space-y-3">
                  {filteredData.map((coin) => (
                    <div
                      key={coin.symbol}
                      className="flex flex-col md:flex-row md:items-center justify-between p-3 md:p-4 rounded-lg glass-card border border-border/50 hover:border-primary/50 hover-lift transition-all cursor-pointer"
                    >
                      {/* Coin Info - Mobile Stacked */}
                      <div className="flex items-start gap-3 md:gap-4 mb-3 md:mb-0 flex-1">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/20 flex items-center justify-center border-2 border-background flex-shrink-0">
                          <span className="font-bold text-primary text-xs md:text-sm">
                            {coin.symbol}
                          </span>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2 mb-1 md:mb-2">
                            <h3 className="font-semibold text-sm md:text-base truncate">
                              {coin.name}
                            </h3>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {coin.symbol}
                              </span>
                              <Badge 
                                className={`text-xs px-1.5 py-0 ${
                                  coin.change > 0 
                                    ? 'bg-success/20 text-success border-success/30' 
                                    : 'bg-destructive/20 text-destructive border-destructive/30'
                                }`}
                              >
                                {coin.change > 0 ? '+' : ''}{coin.change}%
                              </Badge>
                            </div>
                          </div>
                          
                          {/* Mobile Price Display */}
                          <div className="md:hidden">
                            <div className="font-semibold text-lg">
                              {formatPrice(coin.price, coin.symbol)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              MCap: {currency === "ZAR" ? "R" : "$"}{formatMarketCap(coin.marketCap)}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Stats & Actions - Mobile Bottom Row */}
                      <div className="flex items-center justify-between md:justify-end gap-3 md:gap-6 border-t border-border/30 md:border-0 pt-3 md:pt-0">
                        {/* Desktop Price Display */}
                        <div className="hidden md:block text-right">
                          <p className="font-semibold text-lg">
                            {formatPrice(coin.price, coin.symbol)}
                          </p>
                          <div className={`text-sm flex items-center gap-1 justify-end ${coin.change > 0 ? 'text-success' : 'text-destructive'}`}>
                            {coin.change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {coin.change > 0 ? '+' : ''}{coin.change}%
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 md:gap-6">
                          {/* Mobile View - Compact Stats */}
                          <div className="md:hidden text-center">
                            <p className="text-xs text-muted-foreground">Vol</p>
                            <p className="font-semibold text-sm">
                              {currency === "ZAR" ? "R" : "$"}{formatVolume(coin.volume)}
                            </p>
                          </div>
                          
                          {/* Desktop View - Full Stats */}
                          <div className="hidden md:block text-right">
                            <p className="text-sm text-muted-foreground">Volume</p>
                            <p className="font-semibold">
                              {currency === "ZAR" ? "R" : "$"}{formatVolume(coin.volume)}
                            </p>
                          </div>
                          
                          <div className="hidden md:block text-right">
                            <p className="text-sm text-muted-foreground">Market Cap</p>
                            <p className="font-semibold">
                              {currency === "ZAR" ? "R" : "$"}{formatMarketCap(coin.marketCap)}
                            </p>
                          </div>
                          
                          <div className="text-center md:text-right">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8 md:h-10 md:w-10 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Handle coin click
                              }}
                            >
                              <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Footer */}
              <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-border/50 flex flex-col md:flex-row md:items-center justify-between text-sm text-muted-foreground gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                  <span className="text-xs md:text-sm">
                    Data updates every 60 seconds
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    <span className="text-xs md:text-sm">
                      Rate: 1 USD = R{USD_TO_ZAR.toFixed(2)}
                    </span>
                  </div>
                  <span className="text-xs md:text-sm">
                    Showing {filteredData.length} of {mockMarketData.length}
                  </span>
                  <Button 
                    variant="link" 
                    size="sm" 
                    onClick={handleRefresh}
                    className="text-primary text-xs md:text-sm h-auto p-0"
                  >
                    Refresh Data
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Market;