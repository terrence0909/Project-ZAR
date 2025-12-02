import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

interface Alert {
  id: string;
  time: string;
  customer: string;
  alertType: string;
  severity: "high" | "medium" | "low";
  status: "pending" | "reviewed";
  wallet?: string;
  riskScore?: number;
  timestamp?: string;
}

interface RecentAlertsTableProps {
  alerts?: Array<{
    id: string;
    type: string;
    customer: string;
    wallet: string;
    riskScore: number;
    timestamp: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}

export function RecentAlertsTable({ alerts: propAlerts }: RecentAlertsTableProps) {
  
  // Convert prop alerts to the format expected by the component
  const formatAlerts = (alerts: any[]): Alert[] => {
    return alerts.map(alert => {
      const date = new Date(alert.timestamp);
      const time = date.toLocaleTimeString('en-ZA', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
      
      return {
        id: alert.id,
        time: time,
        customer: alert.customer,
        alertType: alert.type || 'Risk Alert',
        severity: alert.severity || 'high',
        status: 'pending', // Default status
        wallet: alert.wallet,
        riskScore: alert.riskScore,
        timestamp: alert.timestamp
      };
    });
  };

  // Use prop alerts or default to empty array
  const alerts: Alert[] = propAlerts && propAlerts.length > 0 
    ? formatAlerts(propAlerts)
    : [
        { id: "1", time: "14:30", customer: "Maria Rodriguez", alertType: "High Risk Customer", severity: "high", status: "pending", wallet: "0x28c6c06298d514Db089934071355E5743bf21d60", riskScore: 72 },
        { id: "2", time: "13:45", customer: "John Crypto", alertType: "Medium Risk Customer", severity: "medium", status: "reviewed", wallet: "0x1f9090aae28b8a3dcecc2fafcdef9f3778915e81", riskScore: 68 },
        { id: "3", time: "11:20", customer: "Sarah Johnson", alertType: "High Risk Customer", severity: "high", status: "pending", wallet: "0xdfd5293d8e347dfe59e90efd55b2956a1343963d", riskScore: 55 },
        { id: "4", time: "09:15", customer: "David Kim", alertType: "Undeclared Wallet", severity: "medium", status: "pending", wallet: "0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936F0bE", riskScore: 72 }
      ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high": return "bg-destructive/20 text-destructive border-destructive/30";
      case "medium": return "bg-warning/20 text-warning border-warning/30";
      case "low": return "bg-success/20 text-success border-success/30";
      default: return "bg-muted/20 text-muted-foreground";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "high": return "🔴";
      case "medium": return "🟡";
      case "low": return "🟢";
      default: return "⚪";
    }
  };

  const truncateWallet = (wallet: string | undefined) => {
    if (!wallet) return "N/A";
    return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
  };

  return (
    <Card className="glass-card border-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">RECENT RISK ALERTS</CardTitle>
          <Button variant="link" className="text-primary" asChild>
            <Link to="/alerts">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">TIME</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">CUSTOMER</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">WALLET</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">ALERT TYPE</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">RISK SCORE</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">SEVERITY</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert, idx) => (
                <tr
                  key={alert.id || idx}
                  className="border-b border-border/30 hover:bg-muted/30 transition-colors cursor-pointer animate-fade-in"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                  onClick={() => {
                    // Navigate to customer search with wallet
                    window.location.href = `/?search=${alert.wallet || alert.customer}`;
                  }}
                >
                  <td className="py-4 px-4 text-sm">{alert.time}</td>
                  <td className="py-4 px-4 font-medium">{alert.customer}</td>
                  <td className="py-4 px-4 text-sm font-mono text-muted-foreground">
                    {truncateWallet(alert.wallet)}
                  </td>
                  <td className="py-4 px-4 text-sm">{alert.alertType}</td>
                  <td className="py-4 px-4">
                    <Badge variant="outline" className="bg-muted/20 text-muted-foreground border-border">
                      {alert.riskScore || "N/A"}
                    </Badge>
                  </td>
                  <td className="py-4 px-4">
                    <Badge variant="outline" className={getSeverityColor(alert.severity)}>
                      <span className="mr-1">{getSeverityIcon(alert.severity)}</span>
                      {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                    </Badge>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      {alert.status === "pending" ? (
                        <>
                          <Clock className="w-4 h-4 text-warning" />
                          <span className="text-sm text-warning">Pending</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-success" />
                          <span className="text-sm text-success">Reviewed</span>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {alerts.map((alert, idx) => (
            <div
              key={alert.id || idx}
              className="glass-card p-4 rounded-lg space-y-2 animate-fade-in cursor-pointer"
              style={{ animationDelay: `${idx * 0.05}s` }}
              onClick={() => {
                window.location.href = `/?search=${alert.wallet || alert.customer}`;
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{alert.time}</span>
                <Badge variant="outline" className={getSeverityColor(alert.severity)}>
                  <span className="mr-1">{getSeverityIcon(alert.severity)}</span>
                  {alert.severity}
                </Badge>
              </div>
              <div className="font-medium">{alert.customer}</div>
              <div className="text-sm text-muted-foreground font-mono">
                {truncateWallet(alert.wallet)}
              </div>
              <div className="flex justify-between items-center">
                <div className="text-sm">{alert.alertType}</div>
                <Badge variant="outline" className="bg-muted/20 text-muted-foreground border-border">
                  Score: {alert.riskScore || "N/A"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                {alert.status === "pending" ? (
                  <>
                    <Clock className="w-4 h-4 text-warning" />
                    <span className="text-sm text-warning">Pending</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    <span className="text-sm text-success">Reviewed</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}