import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import { useState } from "react";

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

  const getTimeAgo = () => {
    const seconds = Math.floor((new Date().getTime() - lastUpdated.getTime()) / 1000);
    if (seconds < 60) return `${seconds} sec ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    return `${Math.floor(minutes / 60)} hr ago`;
  };

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar lastUpdated={getTimeAgo()} />
      
      <main className="flex-1 ml-0 md:ml-[280px] transition-all">
        <header className="sticky top-0 z-10 glass-card border-b border-border/50 backdrop-blur-md px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold">Market Data</h1>
            </div>
            <Badge className="bg-success/20 text-success">
              <Activity className="w-3 h-3 mr-1 animate-pulse" />
              Live
            </Badge>
          </div>
        </header>

        <div className="p-6 space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="glass-card border-border/50">
              <CardContent className="pt-6">
                <div>
                  <p className="text-sm text-muted-foreground">Total Market Cap</p>
                  <p className="text-3xl font-bold">$2.84T</p>
                  <p className="text-sm text-success flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3" />
                    +2.4% (24h)
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card border-border/50">
              <CardContent className="pt-6">
                <div>
                  <p className="text-sm text-muted-foreground">24h Volume</p>
                  <p className="text-3xl font-bold">$97.2B</p>
                  <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                    <TrendingDown className="w-3 h-3" />
                    -1.8% (24h)
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card border-border/50">
              <CardContent className="pt-6">
                <div>
                  <p className="text-sm text-muted-foreground">BTC Dominance</p>
                  <p className="text-3xl font-bold">46.5%</p>
                  <p className="text-sm text-muted-foreground mt-1">ETH: 16.5%</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle>Top Cryptocurrencies</CardTitle>
              <CardDescription>Real-time market prices and statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mockMarketData.map((coin) => (
                  <div
                    key={coin.symbol}
                    className="flex items-center justify-between p-4 rounded-lg glass-card border border-border/50 hover-lift"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="font-bold text-primary text-sm">{coin.symbol}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold">{coin.name}</h3>
                        <p className="text-sm text-muted-foreground">{coin.symbol}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <p className="font-semibold text-lg">${coin.price.toLocaleString()}</p>
                        <div className={`text-sm flex items-center gap-1 justify-end ${coin.change > 0 ? 'text-success' : 'text-destructive'}`}>
                          {coin.change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {coin.change > 0 ? '+' : ''}{coin.change}%
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Volume</p>
                        <p className="font-semibold">${coin.volume}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Market Cap</p>
                        <p className="font-semibold">${coin.marketCap}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Market;
