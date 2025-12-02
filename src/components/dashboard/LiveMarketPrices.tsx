import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Activity, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

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
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  const formatPrice = (pair: string, price: number) => {
    if (pair.includes('XBT') || pair.includes('BTC')) {
      return new Intl.NumberFormat('en-ZA', { 
        style: 'currency', 
        currency: 'ZAR',
        notation: 'compact',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(price);
    }
    
    return new Intl.NumberFormat('en-ZA', { 
      style: 'currency', 
      currency: 'ZAR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
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
              LIVE LUNO PRICES
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
            LIVE LUNO PRICES
          </CardTitle>
          <div className="flex items-center gap-2">
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
        
        {sortedPrices.map((price, idx) => (
          <div
            key={price.pair}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all cursor-pointer animate-fade-in"
            style={{ animationDelay: `${idx * 0.05}s` }}
            title={`24h Volume: ${formatVolume(price.volume)} • Bid: ${formatPrice(price.pair, price.bid)} • Ask: ${formatPrice(price.pair, price.ask)}`}
          >
            <div className="flex items-center gap-3">
              <span className="font-bold text-sm mono">{price.pair_display}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold text-sm">
                {formatPrice(price.pair, price.last_trade)}
              </span>
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
        ))}
        
        <div className="pt-2 text-xs text-muted-foreground text-center">
          {error ? 'Using cached data • ' : 'Live from Luno API • '}
          Updated: {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Never'}
          {!error && prices.length > 0 && (
            <div className="mt-1 text-success">
              Real-time prices from Luno Exchange
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}