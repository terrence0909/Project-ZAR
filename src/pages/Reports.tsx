import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Calendar, Filter, Search, AlertTriangle, Building, Shield, Loader2, Eye, ChevronRight, Menu, X, Upload, FileUp, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { jsPDF } from "jspdf";
import { GenerateReportDialog } from "@/components/reports/GenerateReportDialog";
import { useNavigate } from "react-router-dom";

// SA Regulatory Report Types
const SA_REPORT_TYPES = {
  FICA: "FICA Compliance",
  SAR: "Suspicious Activity Report",
  RICA: "RICA Monitoring",
  FATF: "FATF Travel Rule",
  MARKET: "Market Analysis",
  RISK: "Risk Assessment",
  AUDIT: "Internal Audit"
};

// Mock reports with SA compliance focus
const mockReports = [
  { 
    id: 1, 
    title: "FIC Act Compliance - Monthly", 
    type: "FICA Compliance", 
    date: "2024-03-01", 
    status: "completed",
    customerCount: 45,
    highRisk: 3,
    jurisdiction: "SA",
    size: "2.4 MB",
    description: "Monthly FICA compliance report for all customers as per FIC Act requirements"
  },
  { 
    id: 2, 
    title: "SAR Submission - High Risk Wallets", 
    type: "Suspicious Activity Report", 
    date: "2024-03-01", 
    status: "completed",
    customerCount: 8,
    highRisk: 8,
    jurisdiction: "SA",
    size: "1.8 MB",
    urgent: true,
    description: "Suspicious Activity Report for high-risk wallets requiring FIC submission"
  },
  { 
    id: 3, 
    title: "RICA Transaction Monitoring Q1", 
    type: "RICA Monitoring", 
    date: "2024-03-15", 
    status: "processing",
    customerCount: 156,
    highRisk: 12,
    jurisdiction: "SA",
    size: "Processing...",
    description: "Q1 transaction monitoring report as per RICA Act requirements"
  },
  { 
    id: 4, 
    title: "FATF Travel Rule Compliance", 
    type: "FATF Travel Rule", 
    date: "2024-03-20", 
    status: "completed",
    customerCount: 89,
    highRisk: 5,
    jurisdiction: "International",
    size: "3.2 MB",
    description: "FATF Travel Rule compliance report for cross-border transactions"
  },
  { 
    id: 5, 
    title: "SA Crypto Market Analysis", 
    type: "Market Analysis", 
    date: "2024-03-25", 
    status: "scheduled",
    customerCount: "N/A",
    highRisk: "N/A",
    jurisdiction: "SA",
    size: "Scheduled",
    description: "South African cryptocurrency market trends and analysis"
  },
  { 
    id: 6, 
    title: "High-Risk Customer Portfolio", 
    type: "Risk Assessment", 
    date: "2024-03-28", 
    status: "completed",
    customerCount: 23,
    highRisk: 23,
    jurisdiction: "SA",
    size: "4.1 MB",
    confidential: true,
    description: "Comprehensive risk assessment of high-risk customer portfolios"
  },
];

const Reports = () => {
  const [lastUpdated] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [reportTypeFilter, setReportTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [jurisdictionFilter, setJurisdictionFilter] = useState("all");
  const [generatingReportId, setGeneratingReportId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reports, setReports] = useState(mockReports);
  const navigate = useNavigate();

  const getTimeAgo = () => {
    const seconds = Math.floor((new Date().getTime() - lastUpdated.getTime()) / 1000);
    if (seconds < 60) return `${seconds} sec ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    return `${Math.floor(minutes / 60)} hr ago`;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: { class: "bg-success/20 text-success", icon: "✓" },
      processing: { class: "bg-warning/20 text-warning", icon: "⟳" },
      scheduled: { class: "bg-primary/20 text-primary", icon: "📅" },
    };
    return variants[status as keyof typeof variants] || variants.scheduled;
  };

  // Generate professional PDF for a report
  const generateReportPDF = (report: any) => {
    setGeneratingReportId(report.id);
    
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFillColor(26, 54, 93);
      doc.rect(0, 0, 210, 40, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.text("PROJECT ZAR", 20, 25);
      doc.setFontSize(12);
      doc.text(report.type, 20, 35);

      // Report info
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(18);
      doc.text(report.title, 20, 55);
      doc.setFontSize(12);
      doc.text(`Generated: ${report.date}`, 20, 65);
      doc.text(`Status: ${report.status}`, 20, 75);

      // Content
      doc.setFontSize(14);
      doc.text("Executive Summary", 20, 95);
      doc.setFontSize(11);
      doc.setTextColor(60, 60, 60);
      doc.text(report.description, 20, 105, { maxWidth: 170 });

      // Metrics
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.text("Key Metrics", 20, 130);
      doc.setFontSize(11);
      doc.text(`• Customers Analyzed: ${report.customerCount}`, 25, 145);
      doc.text(`• High Risk Customers: ${report.highRisk}`, 25, 155);
      doc.text(`• Jurisdiction: ${report.jurisdiction}`, 25, 165);
      doc.text(`• Report Size: ${report.size}`, 25, 175);

      // Footer
      doc.setFontSize(9);
      doc.setTextColor(128, 128, 128);
      doc.text("Confidential - PROJECT ZAR Banking Compliance Dashboard", 20, 280);
      doc.text("South African Regulatory Compliance System", 20, 285);
      doc.text(new Date().toLocaleDateString(), 180, 280);

      // Save PDF
      doc.save(`${report.title.replace(/\s+/g, "_")}.pdf`);
      
      toast.success(`${report.type} PDF generated successfully!`);
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error("Failed to generate PDF report");
    } finally {
      setGeneratingReportId(null);
    }
  };

  // Generate SAR-specific PDF
  const generateSARPDF = (report: any) => {
    setGeneratingReportId(report.id);
    
    try {
      const doc = new jsPDF();
      
      // SAR Form Header
      doc.setFillColor(183, 28, 28); // Red for urgent
      doc.rect(0, 0, 210, 40, "F");
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.text("SUSPICIOUS ACTIVITY REPORT", 105, 25, { align: 'center' });
      
      doc.setFontSize(10);
      doc.text("Financial Intelligence Centre - South Africa", 105, 35, { align: 'center' });
      
      // Form content
      doc.setTextColor(0, 0, 0);
      let y = 50;
      
      const fields = [
        ['Report Reference', `SAR-FNB-${report.id}-${report.date.replace(/-/g, '')}`],
        ['Date', new Date().toLocaleDateString('en-ZA')],
        ['Subject', `${report.title}`],
        ['Customers Involved', report.customerCount],
        ['High Risk Individuals', report.highRisk],
        ['Description', report.description],
        ['Jurisdiction', report.jurisdiction],
        ['Status', 'HIGH PRIORITY - FIC SUBMISSION REQUIRED'],
      ];
      
      fields.forEach(([label, value]) => {
        doc.text(`${label}:`, 20, y);
        doc.text(value.toString(), 80, y);
        y += 10;
      });
      
      // Legal notice
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text('CONFIDENTIAL: Protected under Section 38 of the FIC Act', 20, 250);
      
      // Save PDF
      doc.save(`SAR_${report.id}_FIC_Submission.pdf`);
      
      toast.success("SAR Form generated for FIC submission!");
    } catch (error) {
      console.error('SAR PDF generation error:', error);
      toast.error("Failed to generate SAR form");
    } finally {
      setGeneratingReportId(null);
    }
  };

  const handleDownload = (report: any) => {
    if (report.type === "Suspicious Activity Report") {
      generateSARPDF(report);
    } else {
      generateReportPDF(report);
    }
  };

  const handlePreview = (report: any) => {
    if (report.status !== "completed") {
      toast.error(`Report is still ${report.status}. Please wait for completion.`);
      return;
    }
    
    // Generate preview PDF
    try {
      const doc = new jsPDF();
      
      // Simple preview version
      doc.setFontSize(16);
      doc.text(`Preview: ${report.title}`, 20, 30);
      doc.setFontSize(12);
      doc.text(`Type: ${report.type}`, 20, 45);
      doc.text(`Date: ${report.date}`, 20, 55);
      doc.text(`Status: ${report.status}`, 20, 65);
      
      // Open in new tab
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
      
      toast.info(`Opening ${report.title} in new tab`);
    } catch (error) {
      toast.error("Failed to preview report");
    }
  };

  const handleGenerateReport = () => {
    setDialogOpen(true);
  };

  const handleSubmitToFIC = (report: any) => {
    if (report.type === "Suspicious Activity Report") {
      toast.warning(`Submitting SAR ${report.id} to Financial Intelligence Centre...`);
      generateSARPDF(report);
    }
  };

  const handleReportGenerated = (newReport: { title: string; type: string; date: string; status: string }) => {
    // Create a new report object with mock data
    const generatedReport = {
      id: reports.length + 1,
      title: newReport.title,
      type: newReport.type,
      date: newReport.date,
      status: newReport.status,
      customerCount: Math.floor(Math.random() * 100) + 10,
      highRisk: Math.floor(Math.random() * 20) + 1,
      jurisdiction: "SA",
      size: "1.5 MB",
      description: `Automatically generated ${newReport.type.toLowerCase()} report`,
      urgent: newReport.type === "Suspicious Activity Report",
    };
    
    // Add to the beginning of the reports list
    setReports(prev => [generatedReport, ...prev]);
    
    toast.success(`New report "${newReport.title}" has been added`);
  };

  // Filter reports based on search and filters
  const filteredReports = reports.filter(report => {
    const matchesSearch = searchQuery === "" || 
      report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.type.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = reportTypeFilter === "all" || report.type === reportTypeFilter;
    const matchesStatus = statusFilter === "all" || report.status === statusFilter;
    const matchesJurisdiction = jurisdictionFilter === "all" || report.jurisdiction === jurisdictionFilter;
    
    return matchesSearch && matchesType && matchesStatus && matchesJurisdiction;
  });

  // Calculate statistics
  const stats = {
    totalReports: reports.length,
    saReports: reports.filter(r => r.jurisdiction === "SA").length,
    urgentReports: reports.filter(r => r.urgent).length,
    totalCustomers: reports.reduce((sum, r) => sum + (typeof r.customerCount === 'number' ? r.customerCount : 0), 0),
    highRiskCustomers: reports.reduce((sum, r) => sum + (typeof r.highRisk === 'number' ? r.highRisk : 0), 0),
  };

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden md:block">
        <DashboardSidebar lastUpdated={getTimeAgo()} />
      </div>
      
      <main className="flex-1 w-full md:ml-[280px] transition-all">
        {/* Single Header with Back Button */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b px-4 py-3 md:px-6 md:py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Mobile Back Button */}
              <Button 
                variant="outline" 
                size="icon"
                className="h-9 w-9 md:hidden"
                onClick={() => navigate(-1)}
                title="Go back"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              
              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="h-9 w-9 md:hidden"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>

              {/* Desktop Icon and Title */}
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                <h1 className="text-base md:text-2xl font-bold">Reports</h1>
              </div>
            </div>

            {/* Save Button - Right */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button 
                onClick={handleGenerateReport} 
                size="sm" 
                className="h-9 md:h-10"
              >
                <FileText className="w-4 h-4 mr-2" />
                <span>New Report</span>
              </Button>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
          {/* SA Compliance Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-3 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">Total Reports</p>
                    <p className="text-xl md:text-2xl font-bold">{stats.totalReports}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stats.saReports} SA specific</p>
                  </div>
                  <FileText className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">Customers Analyzed</p>
                    <p className="text-xl md:text-2xl font-bold">{stats.totalCustomers}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stats.highRiskCustomers} high risk</p>
                  </div>
                  <Building className="w-6 h-6 md:w-8 md:h-8 text-warning" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">SAR Ready</p>
                    <p className="text-xl md:text-2xl font-bold">{stats.urgentReports}</p>
                    <p className="text-xs text-muted-foreground mt-1">For FIC submission</p>
                  </div>
                  <AlertTriangle className="w-6 h-6 md:w-8 md:h-8 text-destructive" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">Regulatory Frameworks</p>
                    <p className="text-xl md:text-2xl font-bold">4</p>
                    <p className="text-xs text-muted-foreground mt-1">FIC, RICA, FATF, POPIA</p>
                  </div>
                  <Shield className="w-6 h-6 md:w-8 md:h-8 text-success" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg md:text-xl">Report Filters</CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    Filter compliance reports by type, status, and jurisdiction
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs md:text-sm w-fit">
                  {filteredReports.length} of {reports.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search reports by title or type..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 text-sm md:text-base"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                  <div className="space-y-2">
                    <label className="text-xs md:text-sm text-muted-foreground block">Report Type</label>
                    <Select value={reportTypeFilter} onValueChange={setReportTypeFilter}>
                      <SelectTrigger className="text-sm md:text-base w-full">
                        <Filter className="w-4 h-4 mr-2 hidden sm:block" />
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="FICA Compliance">FICA Compliance</SelectItem>
                        <SelectItem value="Suspicious Activity Report">SAR</SelectItem>
                        <SelectItem value="RICA Monitoring">RICA Monitoring</SelectItem>
                        <SelectItem value="FATF Travel Rule">FATF Travel Rule</SelectItem>
                        <SelectItem value="Risk Assessment">Risk Assessment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs md:text-sm text-muted-foreground block">Status</label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="text-sm md:text-base w-full">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs md:text-sm text-muted-foreground block">Jurisdiction</label>
                    <Select value={jurisdictionFilter} onValueChange={setJurisdictionFilter}>
                      <SelectTrigger className="text-sm md:text-base w-full">
                        <SelectValue placeholder="All Jurisdictions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Jurisdictions</SelectItem>
                        <SelectItem value="SA">South Africa</SelectItem>
                        <SelectItem value="International">International</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setReportTypeFilter("all");
                      setStatusFilter("all");
                      setJurisdictionFilter("all");
                      setSearchQuery("");
                    }}
                    className="text-xs md:text-sm h-8"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reports List */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg md:text-xl">Compliance Reports</CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    View, download, and submit regulatory reports
                  </CardDescription>
                </div>
                <div className="text-xs md:text-sm text-muted-foreground">
                  Updated: {getTimeAgo()}
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {filteredReports.length === 0 ? (
                <div className="text-center py-8 md:py-12">
                  <FileText className="w-10 h-10 md:w-12 md:h-12 mx-auto text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No reports found</h3>
                  <p className="text-muted-foreground text-sm md:text-base">Try adjusting your filters or search query</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredReports.map((report) => {
                    const statusBadge = getStatusBadge(report.status);
                    const isGenerating = generatingReportId === report.id;
                    
                    return (
                      <div
                        key={report.id}
                        className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border hover:border-primary/50 transition-all cursor-pointer"
                      >
                        {/* Report Info */}
                        <div className="flex items-start gap-3 md:gap-4 mb-3 md:mb-0 flex-1">
                          <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center border-2 border-background flex-shrink-0 ${
                            report.type === "Suspicious Activity Report" ? "bg-destructive/20" :
                            report.type === "FICA Compliance" ? "bg-primary/20" :
                            "bg-warning/20"
                          }`}>
                            {report.type === "Suspicious Activity Report" ? (
                              <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-destructive" />
                            ) : report.type === "FICA Compliance" ? (
                              <Shield className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                            ) : (
                              <FileText className="w-5 h-5 md:w-6 md:h-6 text-warning" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2 mb-1 md:mb-2">
                              <h3 className="font-semibold text-sm md:text-base truncate">
                                {report.title}
                              </h3>
                              <div className="flex flex-wrap gap-1">
                                {report.urgent && (
                                  <Badge variant="destructive" className="text-xs px-1.5 py-0.5">URGENT</Badge>
                                )}
                                {report.confidential && (
                                  <Badge variant="outline" className="text-xs px-1.5 py-0.5 border-destructive/50 text-destructive">
                                    CONFIDENTIAL
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            <div className="space-y-1 md:space-y-2">
                              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <FileText className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate">{report.type}</span>
                                </div>
                                
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>{report.date}</span>
                                </div>
                                
                                <Badge className={`text-xs px-1.5 py-0 ${statusBadge.class}`}>
                                  {report.status.toUpperCase()}
                                </Badge>
                              </div>
                              
                              <div className="text-xs text-muted-foreground line-clamp-2">
                                {report.description}
                              </div>
                              
                              {/* Mobile Details */}
                              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground md:hidden">
                                <span>• {report.size}</span>
                                <span>• {report.jurisdiction}</span>
                                {typeof report.customerCount === 'number' && (
                                  <span>• {report.customerCount} customers</span>
                                )}
                                {typeof report.highRisk === 'number' && (
                                  <span className="text-destructive">• {report.highRisk} high risk</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Actions & Details */}
                        <div className="flex items-center justify-between md:justify-end gap-3 md:gap-4 border-t border-border/30 md:border-0 pt-3 md:pt-0">
                          {/* Desktop Details */}
                          <div className="hidden md:flex flex-col items-end text-sm text-muted-foreground">
                            <span>{report.size}</span>
                            <span>{report.jurisdiction}</span>
                            {typeof report.customerCount === 'number' && (
                              <span>{report.customerCount} customers</span>
                            )}
                            {typeof report.highRisk === 'number' && (
                              <span className="text-destructive">{report.highRisk} high risk</span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handlePreview(report)}
                              disabled={report.status !== "completed"}
                              className="h-8 w-8 md:h-9 md:w-auto md:px-3"
                              title={report.status !== "completed" ? "Report still processing" : "Preview report"}
                            >
                              <Eye className="w-4 h-4" />
                              <span className="hidden md:inline ml-1">Preview</span>
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDownload(report)}
                              disabled={report.status !== "completed" || isGenerating}
                              className="h-8 w-8 md:h-9 md:w-auto md:px-3"
                              title={report.status !== "completed" ? "Report still processing" : "Download PDF"}
                            >
                              {isGenerating ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Download className="w-4 h-4" />
                              )}
                              <span className="hidden md:inline ml-1">PDF</span>
                            </Button>
                            
                            {report.type === "Suspicious Activity Report" && report.status === "completed" && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleSubmitToFIC(report)}
                                className="h-8 w-8 md:h-9 md:w-auto md:px-3"
                                title="Submit to Financial Intelligence Centre"
                              >
                                <FileUp className="w-4 h-4" />
                                <span className="hidden md:inline ml-1">FIC</span>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* Footer */}
              <div className="mt-6 pt-6 border-t flex flex-col md:flex-row md:items-center justify-between text-sm text-muted-foreground gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success"></div>
                  <span className="text-xs md:text-sm">
                    South African Regulatory Compliance System
                  </span>
                </div>
                <span className="text-xs md:text-sm">
                  {filteredReports.length} reports displayed
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Regulatory Information */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    South African Regulatory Framework
                  </CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    Reports are generated in compliance with SA regulations
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm md:text-base">Mandatory Reports</h4>
                  <ul className="space-y-2 text-xs md:text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-destructive mt-1.5 flex-shrink-0"></div>
                      <span><strong>Suspicious Activity Reports (SAR):</strong> Required within 7 days of detection (FIC Act Section 29)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                      <span><strong>FICA Compliance Reports:</strong> Annual compliance reporting requirements</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-warning mt-1.5 flex-shrink-0"></div>
                      <span><strong>RICA Transaction Reports:</strong> Communication monitoring as per RICA Act</span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm md:text-base">Report Retention</h4>
                  <ul className="space-y-2 text-xs md:text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span><strong>SAR Reports:</strong> 5 years minimum retention</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span><strong>FICA Records:</strong> 5 years from termination of business relationship</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span><strong>Transaction Records:</strong> 5 years as per FIC Act</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Generate Report Dialog */}
      <GenerateReportDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onReportGenerated={handleReportGenerated}
      />
    </div>
  );
};

export default Reports;