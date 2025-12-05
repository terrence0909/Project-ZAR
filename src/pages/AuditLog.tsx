import { useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Search, Filter, Download, User, Shield, FileText, Database, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  category: "auth" | "data" | "admin" | "report" | "system";
  details: string;
  ipAddress: string;
  status: "success" | "failed" | "warning";
}

const mockAuditLog: AuditEntry[] = [
  {
    id: "1",
    timestamp: new Date(Date.now() - 300000).toISOString(),
    user: "admin@projectzar.co.za",
    action: "User Login",
    category: "auth",
    details: "Successful login via email/password",
    ipAddress: "192.168.1.100",
    status: "success"
  },
  {
    id: "2",
    timestamp: new Date(Date.now() - 600000).toISOString(),
    user: "analyst@projectzar.co.za",
    action: "Export Report",
    category: "report",
    details: "Exported customer risk report (PDF)",
    ipAddress: "192.168.1.105",
    status: "success"
  },
  {
    id: "3",
    timestamp: new Date(Date.now() - 900000).toISOString(),
    user: "admin@projectzar.co.za",
    action: "Role Modified",
    category: "admin",
    details: "Updated permissions for 'Analyst' role",
    ipAddress: "192.168.1.100",
    status: "success"
  },
  {
    id: "4",
    timestamp: new Date(Date.now() - 1200000).toISOString(),
    user: "unknown",
    action: "Failed Login",
    category: "auth",
    details: "Invalid credentials - 3 attempts",
    ipAddress: "203.0.113.50",
    status: "failed"
  },
  {
    id: "5",
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    user: "system",
    action: "Data Sync",
    category: "system",
    details: "Synchronized 150 customer records from API",
    ipAddress: "internal",
    status: "success"
  },
  {
    id: "6",
    timestamp: new Date(Date.now() - 2400000).toISOString(),
    user: "analyst@projectzar.co.za",
    action: "Customer View",
    category: "data",
    details: "Viewed customer profile: John Smith (ID: 12345)",
    ipAddress: "192.168.1.105",
    status: "success"
  },
  {
    id: "7",
    timestamp: new Date(Date.now() - 3000000).toISOString(),
    user: "admin@projectzar.co.za",
    action: "High Risk Alert",
    category: "system",
    details: "Flagged wallet 0x1234...5678 for manual review",
    ipAddress: "192.168.1.100",
    status: "warning"
  },
  {
    id: "8",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    user: "viewer@projectzar.co.za",
    action: "Dashboard Access",
    category: "auth",
    details: "Accessed main dashboard",
    ipAddress: "192.168.1.110",
    status: "success"
  },
];

const AuditLog = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredLogs = mockAuditLog.filter(entry => {
    const matchesSearch = 
      entry.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.details.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || entry.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || entry.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "auth": return <User className="h-4 w-4" />;
      case "admin": return <Shield className="h-4 w-4" />;
      case "report": return <FileText className="h-4 w-4" />;
      case "data": return <Database className="h-4 w-4" />;
      case "system": return <AlertTriangle className="h-4 w-4" />;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-success/20 text-success border-success/30">Success</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "warning":
        return <Badge className="bg-warning/20 text-warning border-warning/30">Warning</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-ZA', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleExport = () => {
    const csvContent = [
      ["Timestamp", "User", "Action", "Category", "Details", "IP Address", "Status"],
      ...filteredLogs.map(entry => [
        entry.timestamp,
        entry.user,
        entry.action,
        entry.category,
        entry.details,
        entry.ipAddress,
        entry.status
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Audit log exported");
  };

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar lastUpdated="just now" />
      
      <main className="flex-1 md:ml-[280px] pt-16 md:pt-0">
        <header className="sticky top-0 z-10 glass-card border-b border-border/50 backdrop-blur-md px-4 py-3 md:px-6 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl md:text-2xl font-bold">Audit Log</h1>
                <p className="text-sm text-muted-foreground">Track all system activities and user actions</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </header>

        <div className="p-4 md:p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{mockAuditLog.length}</div>
                <p className="text-xs text-muted-foreground">Total Events</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-success">
                  {mockAuditLog.filter(e => e.status === "success").length}
                </div>
                <p className="text-xs text-muted-foreground">Successful</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-destructive">
                  {mockAuditLog.filter(e => e.status === "failed").length}
                </div>
                <p className="text-xs text-muted-foreground">Failed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-warning">
                  {mockAuditLog.filter(e => e.status === "warning").length}
                </div>
                <p className="text-xs text-muted-foreground">Warnings</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by user, action, or details..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="auth">Authentication</SelectItem>
                    <SelectItem value="data">Data Access</SelectItem>
                    <SelectItem value="admin">Administration</SelectItem>
                    <SelectItem value="report">Reports</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Audit Log Table */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>
                Showing {filteredLogs.length} of {mockAuditLog.length} entries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[140px]">Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead className="hidden md:table-cell">Details</TableHead>
                      <TableHead className="hidden lg:table-cell">IP Address</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatTimestamp(entry.timestamp)}
                        </TableCell>
                        <TableCell className="font-medium text-sm">
                          {entry.user}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">
                              {getCategoryIcon(entry.category)}
                            </span>
                            <span className="text-sm">{entry.action}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-[250px] truncate">
                          {entry.details}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-xs text-muted-foreground font-mono">
                          {entry.ipAddress}
                        </TableCell>
                        <TableCell className="text-right">
                          {getStatusBadge(entry.status)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AuditLog;
