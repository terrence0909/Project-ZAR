import { useState } from "react";
import { TrendingUp, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Match your Luno API response structure
interface MarketPrice {
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

interface MarketDataProps {
  marketPrices: MarketPrice[];  // Changed prop name to match what you actually have
  customerId?: string;
  isLoading?: boolean;
  onRefresh?: () => void;
}

const MarketData = ({ marketPrices, customerId, isLoading = false, onRefresh }: MarketDataProps) => {
  const [expanded, setExpanded] = useState(false);
  
  // Show loading state
  if (isLoading) {
    return (
      <Card className="glass-card w-full max-w-full overflow-hidden">
        <CardHeader className="px-4 sm:px-6">
          <div className="h-6 bg-muted/50 rounded w-1/2 animate-pulse" />
          <div className="h-4 bg-muted/50 rounded w-3/4 mt-2 animate-pulse" />
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-14 bg-muted/30 rounded mb-2 animate-pulse" />
          ))}
        </CardContent>
      </Card>
    );
  }
  
  if (!marketPrices || marketPrices.length === 0) {
    return null;
  }

  // Convert Luno MarketPrice to display format
  const displayData = marketPrices.map(price => ({
    ...price,
    pair: price.pair_display || price.pair,
    last_trade: price.last_trade.toString(),
    bid: price.bid.toString(),
    ask: price.ask.toString(),
    rolling_24_hour_volume: price.volume || "0",
    status: "TRADING" as const,
  }));

  const getPairIcon = (pair: string) => {
    const emojiMap: Record<string, string> = {
      BTC: "₿",
      ETH: "Ξ",
      XRP: "✕",
      SOL: "◎",
      ADA: "∞",
      USDC: "$",
      USDT: "$",
      LTC: "Ł",
      BCH: "◆",
      DOT: "●",
      MANA: "M",
      SAND: "S",
    };

    const base = pair.replace("ZAR", "").replace("/", "");
    const emoji = emojiMap[base] || "◇";

    return (
      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
        <span className="text-lg font-bold">{emoji}</span>
      </div>
    );
  };

  const majorPairs = ["BTCZAR", "ETHZAR", "XRPZAR", "ADAZAR", "SOLZAR", "DOTZAR", "LTCZAR"];
  const displayTickers = expanded
    ? displayData.slice(0, 15)
    : displayData
        .filter((ticker) => majorPairs.includes(ticker.pair))
        .slice(0, 6);

  const formatPrice = (price: string, pair: string) => {
    const num = parseFloat(price);
    if (isNaN(num)) return "R0.00";
    
    if (pair.includes("ZAR")) {
      return `R${num.toLocaleString("en-ZA", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
    return `$${num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatVolume = (volume: string) => {
    const num = parseFloat(volume);
    if (isNaN(num)) return "0";
    
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toFixed(2);
  };

  return (
    <Card className="glass-card w-full max-w-full overflow-hidden">
      <CardHeader className="px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500 flex-shrink-0" />
              <CardTitle className="text-lg sm:text-xl truncate">
                Luno Market Data
              </CardTitle>
            </div>
            <CardDescription className="truncate text-sm mt-1">
              {customerId
                ? `Market data for customer ${customerId.slice(0, 8)}...`
                : "Real-time cryptocurrency prices from Luno exchange"}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {onRefresh && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onRefresh}
                className="h-8 w-8"
                title="Refresh market data"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
            <Badge variant="secondary" className="text-xs whitespace-nowrap">
              {displayData.length} pairs
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="h-8 px-2 sm:px-3 whitespace-nowrap"
            >
              {expanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1 flex-shrink-0" />
                  Less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1 flex-shrink-0" />
                  More
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-3 sm:px-6">
        <div className="space-y-2 sm:space-y-3">
          {displayTickers.map((ticker, index) => (
            <div
              key={`${ticker.pair}-${index}`}
              className="flex items-center justify-between p-3 sm:p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                {getPairIcon(ticker.pair)}
                <div className="min-w-0">
                  <div className="font-medium text-sm sm:text-base truncate">
                    {ticker.pair}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Vol: {formatVolume(ticker.rolling_24_hour_volume)}</span>
                    {ticker.change !== undefined && (
                      <span className={`${ticker.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {ticker.change >= 0 ? '↗' : '↘'} {Math.abs(ticker.change).toFixed(2)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right min-w-0 ml-2 sm:ml-4">
                <div className="font-semibold text-sm sm:text-base truncate">
                  {formatPrice(ticker.last_trade, ticker.pair)}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  Spread:{" "}
                  {formatPrice(
                    (parseFloat(ticker.ask) - parseFloat(ticker.bid)).toFixed(2),
                    ticker.pair
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {!expanded && displayData.length > 6 && (
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpanded(true)}
              className="text-xs w-full sm:w-auto"
            >
              Show {displayData.length - 6} more trading pairs
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MarketData;