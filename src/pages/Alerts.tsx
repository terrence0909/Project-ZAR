import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";

const mockAlerts = [
  { id: 1, type: "High-Risk Transaction", wallet: "0x742d...8f3a", severity: "high", time: "2 min ago", status: "active" },
  { id: 2, type: "Suspicious Pattern", wallet: "0x9a3f...2e1c", severity: "medium", time: "15 min ago", status: "active" },
  { id: 3, type: "Large Transfer", wallet: "0x1b8d...7c4f", severity: "high", time: "1 hr ago", status: "reviewed" },
  { id: 4, type: "Unusual Activity", wallet: "0x5e2a...9d6b", severity: "low", time: "3 hr ago", status: "dismissed" },
  { id: 5, type: "Multiple Wallets", wallet: "0x3c7f...4a8e", severity: "medium", time: "5 hr ago", status: "active" },
];

const Alerts = () => {
  const [lastUpdated] = useState<Date>(new Date());

  const getTimeAgo = () => {
    const seconds = Math.floor((new Date().getTime() - lastUpdated.getTime()) / 1000);
    if (seconds < 60) return `${seconds} sec ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    return `${Math.floor(minutes / 60)} hr ago`;
  };

  const getSeverityBadge = (severity: string) => {
    const variants = {
      low: "bg-success/20 text-success",
      medium: "bg-warning/20 text-warning",
      high: "bg-destructive/20 text-destructive",
    };
    return variants[severity as keyof typeof variants] || variants.low;
  };

  const getStatusIcon = (status: string) => {
    if (status === "reviewed") return <CheckCircle className="w-4 h-4 text-success" />;
    if (status === "dismissed") return <XCircle className="w-4 h-4 text-muted-foreground" />;
    return <AlertTriangle className="w-4 h-4 text-destructive" />;
  };

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar lastUpdated={getTimeAgo()} />
      
      <main className="flex-1 ml-0 md:ml-[280px] transition-all">
        <header className="sticky top-0 z-10 glass-card border-b border-border/50 backdrop-blur-md px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-destructive" />
              <h1 className="text-2xl font-bold">Risk Alerts</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Active</Button>
              <Button variant="outline" size="sm">Reviewed</Button>
              <Button variant="outline" size="sm">All</Button>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="glass-card border-destructive/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Alerts</p>
                    <p className="text-3xl font-bold">3</p>
                  </div>
                  <AlertTriangle className="w-10 h-10 text-destructive" />
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card border-warning/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Under Review</p>
                    <p className="text-3xl font-bold">1</p>
                  </div>
                  <CheckCircle className="w-10 h-10 text-warning" />
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card border-success/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Resolved Today</p>
                    <p className="text-3xl font-bold">12</p>
                  </div>
                  <XCircle className="w-10 h-10 text-success" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle>Recent Alerts</CardTitle>
              <CardDescription>Monitor and respond to security alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between p-4 rounded-lg glass-card border border-border/50 hover-lift"
                  >
                    <div className="flex items-center gap-4">
                      {getStatusIcon(alert.status)}
                      <div>
                        <h3 className="font-semibold">{alert.type}</h3>
                        <p className="text-sm text-muted-foreground font-mono">{alert.wallet}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">{alert.time}</span>
                      <Badge className={getSeverityBadge(alert.severity)}>
                        {alert.severity.toUpperCase()}
                      </Badge>
                      <Button size="sm" variant="outline">Review</Button>
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

export default Alerts;
