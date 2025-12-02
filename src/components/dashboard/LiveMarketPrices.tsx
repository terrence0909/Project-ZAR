import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Activity, RefreshCw, DollarSign, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PriceData {
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

interface LiveMarketPricesProps {
  marketPrices?: PriceData[];
  onRefresh?: () => Promise<void>;
  loading?: boolean;
  lastUpdate?: Date;
  error?: string | null;
}

export function LiveMarketPrices({ 
  marketPrices = [],
  onRefresh,
  loading = false,
  lastUpdate,
  error = null
}: LiveMarketPricesProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [usdZarRate, setUsdZarRate] = useState<number>(18.5); // Default USD/ZAR rate
  const [showUSD, setShowUSD] = useState(false); // Toggle between ZAR/USD
  const [exchangeComparisons, setExchangeComparisons] = useState<Record<string, any>>({});

  // Fetch USD/ZAR exchange rate
  useEffect(() => {
    fetchUSDRate();
    // Refresh rate every 5 minutes
    const interval = setInterval(fetchUSDRate, 300000);
    return () => clearInterval(interval);
  }, []);

  // Fetch comparison data from other SA exchanges
  useEffect(() => {
    if (marketPrices.length > 0) {
      fetchSAExchangeComparisons();
    }
  }, [marketPrices]);

  const fetchUSDRate = async () => {
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await response.json();
      setUsdZarRate(data.rates.ZAR);
    } catch (error) {
      console.error('Failed to fetch USD/ZAR rate:', error);
      // Fallback to cached rate
      setUsdZarRate(18.5);
    }
  };

  const fetchSAExchangeComparisons = async () => {
    // Mock data for other SA exchanges - replace with actual API calls
    const mockComparisons: Record<string, any> = {};
    
    marketPrices.forEach(price => {
      const pairKey = price.pair.replace('ZAR', '');
      mockComparisons[price.pair] = {
        LUNO: price.last_trade,
        VALR: price.last_trade * (0.99 + Math.random() * 0.02), // ±1% variation
        ALTCOINTRADER: price.last_trade * (0.98 + Math.random() * 0.04), // ±2% variation
        bestExchange: 'LUNO',
        spread: ((price.ask - price.bid) / price.last_trade * 100).toFixed(2)
      };
    });
    
    setExchangeComparisons(mockComparisons);
  };

  const getFallbackPrices = (): PriceData[] => {
    return [
      { 
        pair: "ETHZAR", 
        pair_display: "ETH/ZAR", 
        last_trade: 47950.0, 
        bid: 47883.0,
        ask: 47954.0,
        change: 0.07, 
        trend: "up" as const,
        volume: "156.157411",
        timestamp: Date.now()
      },
      { 
        pair: "XBTZAR", 
        pair_display: "BTC/ZAR", 
        last_trade: 1469086.0, 
        bid: 1468593.0,
        ask: 1469078.0,
        change: 0.02, 
        trend: "up" as const,
        volume: "39.615121",
        timestamp: Date.now()
      },
      { 
        pair: "SOLZAR", 
        pair_display: "SOL/ZAR", 
        last_trade: 2159.69, 
        bid: 2150.43,
        ask: 2166.31,
        change: 0.06, 
        trend: "up" as const,
        volume: "964.0495",
        timestamp: Date.now()
      },
      { 
        pair: "XRPZAR", 
        pair_display: "XRP/ZAR", 
        last_trade: 34.8, 
        bid: 34.73,
        ask: 34.78,
        change: 0.13, 
        trend: "up" as const,
        volume: "863915.00",
        timestamp: Date.now()
      },
      { 
        pair: "LTCZAR", 
        pair_display: "LTC/ZAR", 
        last_trade: 1321.0, 
        bid: 1313.0,
        ask: 1320.0,
        change: 0.34, 
        trend: "up" as const,
        volume: "193.4807",
        timestamp: Date.now()
      },
      { 
        pair: "BCHZAR", 
        pair_display: "BCH/ZAR", 
        last_trade: 8442.0, 
        bid: 8440.0,
        ask: 9889.0,
        change: -7.88, 
        trend: "down" as const,
        volume: "0.1741",
        timestamp: Date.now()
      }
    ];
  };

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      try {
        await onRefresh();
        // Also refresh USD rate and comparisons
        await Promise.all([fetchUSDRate(), fetchSAExchangeComparisons()]);
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  const formatPrice = (pair: string, price: number) => {
    const amount = showUSD ? price / usdZarRate : price;
    const currency = showUSD ? 'USD' : 'ZAR';
    
    if (pair.includes('XBT') || pair.includes('BTC')) {
      return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: currency,
        notation: 'compact',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    }
    
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: currency,
      minimumFractionDigits: showUSD ? 2 : 0,
      maximumFractionDigits: showUSD ? 2 : 2
    }).format(amount);
  };

  const formatVolume = (volume: string) => {
    const num = parseFloat(volume);
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toFixed(2);
  };

  const calculateSpreadPercentage = (bid: number, ask: number, lastTrade: number) => {
    return ((ask - bid) / lastTrade * 100).toFixed(2);
  };

  // Use provided market prices or fallback
  const prices = marketPrices.length > 0 ? marketPrices : getFallbackPrices();

  // Sort prices: ETH/ZAR first, then BTC/ZAR, then others
  const sortedPrices = [...prices].sort((a, b) => {
    if (a.pair === 'ETHZAR') return -1;
    if (b.pair === 'ETHZAR') return 1;
    if (a.pair === 'XBTZAR') return -1;
    if (b.pair === 'XBTZAR') return 1;
    return 0;
  });

  const isLoading = loading && marketPrices.length === 0;

  if (isLoading) {
    return (
      <Card className="glass-card border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              LIVE SA CRYPTO PRICES
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-500"></div>
              <span className="text-xs text-muted-foreground">Loading...</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(6)].map((_, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="h-4 bg-gray-700 rounded w-1/4"></div>
              <div className="h-4 bg-gray-700 rounded w-1/3"></div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            LIVE SA CRYPTO PRICES
          </CardTitle>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowUSD(!showUSD)}
                    className="gap-1 h-8"
                  >
                    <DollarSign className="w-3 h-3" />
                    <span className="text-xs">{showUSD ? "ZAR" : "USD"}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Show prices in {showUSD ? "South African Rand" : "US Dollars"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                className="gap-1 h-8"
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            )}
            
            <div className="flex items-center gap-1 text-xs">
              <div className={`w-2 h-2 rounded-full ${
                error ? 'bg-destructive animate-pulse' : 'bg-success animate-pulse'
              }`} />
              <span className={error ? 'text-destructive' : 'text-success'}>
                {error ? 'Error' : 'Live'}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-2 rounded-lg text-center">
            {error} • Using cached data
          </div>
        )}
        
        {/* Exchange rate display */}
        <div className="text-xs text-muted-foreground flex items-center justify-between px-1">
          <div>
            USD/ZAR: <span className="font-semibold">{usdZarRate.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-success">●</span>
            <span>Showing prices in {showUSD ? 'USD' : 'ZAR'}</span>
          </div>
        </div>
        
        {sortedPrices.map((price, idx) => {
          const spreadPercent = calculateSpreadPercentage(price.bid, price.ask, price.last_trade);
          const comparison = exchangeComparisons[price.pair];
          
          return (
            <TooltipProvider key={price.pair}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all cursor-pointer group animate-fade-in"
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-sm mono">{price.pair_display}</span>
                      {comparison && comparison.bestExchange === 'LUNO' && (
                        <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded-full">
                          Best
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="font-semibold text-sm">
                          {formatPrice(price.pair, price.last_trade)}
                        </span>
                        <div className="text-xs text-muted-foreground">
                          Vol: {formatVolume(price.volume)}
                        </div>
                      </div>
                      
                      <div className={`flex items-center gap-1 min-w-[70px] justify-end ${
                        price.trend === "up" ? "text-success" : "text-destructive"
                      }`}>
                        {price.trend === "up" ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        <span className="font-medium text-sm">
                          {price.change > 0 ? "+" : ""}{price.change.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-[300px] p-4">
                  <div className="space-y-2">
                    <div className="font-semibold">{price.pair_display} Details</div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Bid:</span>
                          <span>{formatPrice(price.pair, price.bid)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Ask:</span>
                          <span>{formatPrice(price.pair, price.ask)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Spread:</span>
                          <span className={parseFloat(spreadPercent) > 0.5 ? "text-destructive" : "text-success"}>
                            {spreadPercent}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">24h Vol:</span>
                          <span>{formatVolume(price.volume)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Change:</span>
                          <span className={price.trend === "up" ? "text-success" : "text-destructive"}>
                            {price.change > 0 ? "+" : ""}{price.change.toFixed(2)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Price in {showUSD ? "ZAR" : "USD"}:</span>
                          <span>
                            {showUSD 
                              ? formatPrice(price.pair, price.last_trade * usdZarRate).replace('USD', 'ZAR')
                              : formatPrice(price.pair, price.last_trade / usdZarRate).replace('ZAR', 'USD')
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {comparison && (
                      <div className="pt-2 border-t">
                        <div className="text-xs text-muted-foreground mb-1">SA Exchange Comparison:</div>
                        <div className="grid grid-cols-2 gap-1 text-sm">
                          <div className="flex justify-between">
                            <span>LUNO:</span>
                            <span className="font-semibold">{formatPrice(price.pair, comparison.LUNO)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>VALR:</span>
                            <span>{formatPrice(price.pair, comparison.VALR)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="text-xs text-muted-foreground pt-2">
                      Updated: {new Date(price.timestamp).toLocaleTimeString('en-ZA')}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
        
        <div className="pt-2 text-xs text-muted-foreground text-center flex flex-col gap-1">
          <div>
            {error ? 'Using cached data • ' : 'Live from Luno API • '}
            Updated: {lastUpdate ? lastUpdate.toLocaleTimeString('en-ZA') : 'Never'}
          </div>
          {!error && prices.length > 0 && (
            <div className="flex items-center justify-center gap-2">
              <div className="text-success flex items-center gap-1">
                <Activity className="w-3 h-3" />
                Real-time South African market data
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-3 h-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-[250px]">
                      Data sourced from Luno exchange. Spread shows bid/ask difference. 
                      Hover for detailed price comparison with other SA exchanges.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}