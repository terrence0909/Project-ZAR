import { useState } from "react";
import { TrendingUp, ChevronDown, ChevronUp, Circle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface MarketTicker {
  pair: string;
  last_trade: string;
  bid: string;
  ask: string;
  rolling_24_hour_volume: string;
  status: string;
}

interface MarketDataProps {
  marketTickers: MarketTicker[];
  customerId?: string;
}

const MarketData = ({ marketTickers, customerId }: MarketDataProps) => {
  const [expanded, setExpanded] = useState(false);
  
  if (!marketTickers || marketTickers.length === 0) {
    return null;
  }

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
    ? marketTickers.slice(0, 15)
    : marketTickers
        .filter((ticker) => majorPairs.includes(ticker.pair))
        .slice(0, 6);

  const formatPrice = (price: string, pair: string) => {
    const num = parseFloat(price);
    if (pair.includes("ZAR")) {
      return `R${num.toLocaleString("en-ZA", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
    return num.toString();
  };

  const formatVolume = (volume: string) => {
    const num = parseFloat(volume);
    if (num > 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toFixed(2);
  };

  return (
    <Card className="glass-card w-full max-w-full overflow-hidden">
      <CardHeader className="px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <TrendingUp className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span className="truncate">Luno Market Data</span>
            </CardTitle>
            <CardDescription className="truncate text-sm">
              {customerId
                ? `Market data for customer ${customerId.slice(0, 8)}...`
                : "Real-time cryptocurrency prices from Luno exchange"}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Badge variant="secondary" className="text-xs whitespace-nowrap">
              {marketTickers.length} pairs
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
          {displayTickers.map((ticker) => (
            <div
              key={ticker.pair}
              className="flex items-center justify-between p-3 sm:p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                {getPairIcon(ticker.pair)}
                <div className="min-w-0">
                  <div className="font-medium text-sm sm:text-base truncate">
                    {ticker.pair}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Vol: {formatVolume(ticker.rolling_24_hour_volume)}
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

        {!expanded && marketTickers.length > 6 && (
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpanded(true)}
              className="text-xs w-full sm:w-auto"
            >
              Show {marketTickers.length - 6} more trading pairs
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MarketData;