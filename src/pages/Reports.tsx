import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Calendar } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const mockReports = [
  { id: 1, title: "Monthly Risk Summary", type: "Risk Analysis", date: "2024-03-01", status: "completed" },
  { id: 2, title: "Customer Compliance Report", type: "Compliance", date: "2024-03-01", status: "completed" },
  { id: 3, title: "Transaction Analysis Q1", type: "Analytics", date: "2024-03-15", status: "processing" },
  { id: 4, title: "High-Risk Wallets Overview", type: "Risk Analysis", date: "2024-03-20", status: "completed" },
  { id: 5, title: "Market Trends Report", type: "Market", date: "2024-03-25", status: "scheduled" },
];

const Reports = () => {
  const [lastUpdated] = useState<Date>(new Date());

  const getTimeAgo = () => {
    const seconds = Math.floor((new Date().getTime() - lastUpdated.getTime()) / 1000);
    if (seconds < 60) return `${seconds} sec ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    return `${Math.floor(minutes / 60)} hr ago`;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "bg-success/20 text-success",
      processing: "bg-warning/20 text-warning",
      scheduled: "bg-primary/20 text-primary",
    };
    return variants[status as keyof typeof variants] || variants.scheduled;
  };

  const handleDownload = (reportTitle: string) => {
    toast.success(`Downloading ${reportTitle}`);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar lastUpdated={getTimeAgo()} />
      
      <main className="flex-1 ml-0 md:ml-[280px] transition-all">
        <header className="sticky top-0 z-10 glass-card border-b border-border/50 backdrop-blur-md px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold">Reports</h1>
            </div>
            <Button className="gap-2">
              <FileText className="w-4 h-4" />
              Generate Report
            </Button>
          </div>
        </header>

        <div className="p-6 space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="glass-card border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Reports</p>
                    <p className="text-3xl font-bold">24</p>
                  </div>
                  <FileText className="w-10 h-10 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">This Month</p>
                    <p className="text-3xl font-bold">5</p>
                  </div>
                  <Calendar className="w-10 h-10 text-warning" />
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Downloads</p>
                    <p className="text-3xl font-bold">142</p>
                  </div>
                  <Download className="w-10 h-10 text-success" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle>Recent Reports</CardTitle>
              <CardDescription>View and download generated reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockReports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-4 rounded-lg glass-card border border-border/50 hover-lift"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{report.title}</h3>
                        <p className="text-sm text-muted-foreground">{report.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Generated</p>
                        <p className="font-semibold">{report.date}</p>
                      </div>
                      <Badge className={getStatusBadge(report.status)}>
                        {report.status.toUpperCase()}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(report.title)}
                        disabled={report.status !== "completed"}
                        className="gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </Button>
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

export default Reports;
