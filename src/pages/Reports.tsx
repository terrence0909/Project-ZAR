import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Calendar, Filter, Search, AlertTriangle, Building, Shield, Loader2, Eye } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

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
      
      // Add watermark
      doc.setTextColor(200, 200, 200);
      doc.setFontSize(60);
      doc.text("CONFIDENTIAL", 40, 140, { angle: 45 });
      doc.setTextColor(0, 0, 0);
      
      // Add header
      doc.setFillColor(13, 71, 161);
      doc.rect(0, 0, 210, 40, 'F');
      
      // Title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.text(report.type.toUpperCase() + " REPORT", 105, 25, { align: 'center' });
      
      doc.setFontSize(10);
      doc.text("Project ZAR Compliance System", 105, 35, { align: 'center' });
      
      // Reset text color
      doc.setTextColor(0, 0, 0);
      
      let yPosition = 50;
      
      // Report Information
      doc.setFontSize(16);
      doc.text("REPORT INFORMATION", 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(11);
      doc.text(`Title: ${report.title}`, 20, yPosition);
      yPosition += 8;
      
      doc.text(`Report ID: REP-${report.id}-${Date.now().toString().slice(-6)}`, 20, yPosition);
      doc.text(`Generated: ${new Date().toLocaleString('en-ZA')}`, 120, yPosition);
      yPosition += 8;
      
      doc.text(`Jurisdiction: ${report.jurisdiction}`, 20, yPosition);
      doc.text(`Status: ${report.status.toUpperCase()}`, 120, yPosition);
      yPosition += 15;
      
      // Report Summary
      doc.setFontSize(16);
      doc.text("EXECUTIVE SUMMARY", 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(11);
      const summary = report.description || `This report contains ${report.type.toLowerCase()} analysis for compliance monitoring.`;
      const splitText = doc.splitTextToSize(summary, 170);
      doc.text(splitText, 20, yPosition);
      yPosition += splitText.length * 5 + 10;
      
      // Key Metrics
      doc.setFontSize(16);
      doc.text("KEY METRICS", 20, yPosition);
      yPosition += 10;
      
      const metricsBody = [
        ['Report Type', report.type],
        ['Generation Date', report.date],
        ['Customer Count', report.customerCount?.toString() || 'N/A'],
        ['High Risk Entities', report.highRisk?.toString() || 'N/A'],
        ['Jurisdiction', report.jurisdiction],
        ['File Size', report.size],
      ];
      
      autoTable(doc, {
        startY: yPosition,
        head: [['Metric', 'Value']],
        body: metricsBody,
        theme: 'grid',
        headStyles: { fillColor: [13, 71, 161] },
        margin: { left: 20, right: 20 },
      });
      
      yPosition = (doc as any).lastAutoTable.finalY + 15;
      
      // SA Regulatory Compliance Notice
      if (report.jurisdiction === "SA") {
        doc.setFontSize(16);
        doc.text("SOUTH AFRICAN REGULATORY COMPLIANCE", 20, yPosition);
        yPosition += 10;
        
        doc.setFontSize(11);
        const complianceNotice = "This report is generated in compliance with South African regulatory requirements including:\n" +
                                "• Financial Intelligence Centre Act, 2001 (Act No. 38 of 2001)\n" +
                                "• Protection of Personal Information Act, 2013 (Act No. 4 of 2013)\n" +
                                "• Regulation of Interception of Communications Act, 2002\n" +
                                "• FATF Recommendations on virtual assets";
        
        const complianceText = doc.splitTextToSize(complianceNotice, 170);
        doc.text(complianceText, 20, yPosition);
        yPosition += complianceText.length * 5 + 15;
      }
      
      // Recommendations
      doc.setFontSize(16);
      doc.text("RECOMMENDED ACTIONS", 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(11);
      const recommendations = [
        "Review report findings with compliance team",
        "Update customer risk assessments accordingly",
        "File SAR with FIC if high-risk activity detected",
        "Schedule follow-up monitoring as required",
        "Document all findings in compliance records"
      ];
      
      recommendations.forEach((rec, index) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(`• ${rec}`, 25, yPosition);
        yPosition += 7;
      });
      
      // Add page numbers
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(
          `Page ${i} of ${pageCount} • Project ZAR Compliance System • ${new Date().toLocaleDateString('en-ZA')}`,
          105,
          290,
          { align: 'center' }
        );
      }
      
      // Save the PDF
      const fileName = `${report.type.replace(/\s+/g, '_')}_${report.id}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
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
      doc.setFillColor(183, 28, 28);
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.text("SUSPICIOUS ACTIVITY REPORT", 105, 25, { align: 'center' });
      
      doc.setFontSize(10);
      doc.text("FIC Form SAA-1 (Section 29, FIC Act)", 105, 35, { align: 'center' });
      
      let yPosition = 50;
      
      // Form fields
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      
      const formFields = [
        ['Reporting Institution', 'Project ZAR Compliance System'],
        ['Report Reference', `SAR-${report.id}-${Date.now().toString().slice(-6)}`],
        ['Date of Report', new Date().toLocaleDateString('en-ZA')],
        ['Report Title', report.title],
        ['Customer Count', report.customerCount?.toString() || 'Multiple'],
        ['High Risk Count', report.highRisk?.toString() || 'All'],
        ['Reason for Filing', 'High-risk crypto activity requiring FIC notification'],
      ];
      
      formFields.forEach(([label, value], index) => {
        doc.text(`${label}:`, 20, yPosition);
        doc.setFont(undefined, 'bold');
        doc.text(value, 80, yPosition);
        doc.setFont(undefined, 'normal');
        yPosition += 10;
      });
      
      yPosition += 10;
      
      // Narrative Section
      doc.setFontSize(14);
      doc.text("NARRATIVE DESCRIPTION", 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(11);
      const narrative = `This SAR is filed in compliance with Section 29 of the Financial Intelligence Centre Act, 2001. ` +
                       `The report identifies ${report.highRisk || 'multiple'} high-risk customer(s) with suspicious crypto activity patterns ` +
                       `including undeclared wallets and unusual transaction behavior requiring FIC attention.`;
      
      doc.text(narrative, 20, yPosition, { maxWidth: 170 });
      yPosition += 40;
      
      // Signature
      doc.setFontSize(12);
      doc.text("AUTHORIZED SIGNATORY", 20, yPosition);
      yPosition += 20;
      
      doc.text("_________________________", 50, yPosition);
      doc.text("Signature", 65, yPosition + 10);
      
      doc.text("_________________________", 120, yPosition);
      doc.text("Date", 140, yPosition + 10);
      
      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(
          `Confidential - For FIC submission only • Page ${i} of ${pageCount}`,
          105,
          290,
          { align: 'center' }
        );
      }
      
      // Save SAR
      const fileName = `SAR_Submission_${report.id}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
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
    toast.info(`Preview feature coming soon for: ${report.title}`);
    // In production: Open PDF in new tab for preview
  };

  const handleGenerateReport = () => {
    toast.info("Opening report generation wizard...");
    // Would open a modal to configure report parameters
  };

  const handleSubmitToFIC = (report: any) => {
    if (report.type === "Suspicious Activity Report") {
      toast.warning(`Submitting SAR ${report.id} to Financial Intelligence Centre...`);
      // In production: Open SAR submission workflow
      generateSARPDF(report);
    }
  };

  // Filter reports based on search and filters
  const filteredReports = mockReports.filter(report => {
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
    totalReports: mockReports.length,
    saReports: mockReports.filter(r => r.jurisdiction === "SA").length,
    urgentReports: mockReports.filter(r => r.urgent).length,
    totalCustomers: mockReports.reduce((sum, r) => sum + (typeof r.customerCount === 'number' ? r.customerCount : 0), 0),
    highRiskCustomers: mockReports.reduce((sum, r) => sum + (typeof r.highRisk === 'number' ? r.highRisk : 0), 0),
  };

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar lastUpdated={getTimeAgo()} />
      
      <main className="flex-1 ml-0 md:ml-[280px] transition-all">
        <header className="sticky top-0 z-10 glass-card border-b border-border/50 backdrop-blur-md px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Compliance Reports</h1>
                <p className="text-sm text-muted-foreground">South African Regulatory Reporting</p>
              </div>
            </div>
            <Button onClick={handleGenerateReport} className="gap-2">
              <FileText className="w-4 h-4" />
              Generate New Report
            </Button>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* SA Compliance Stats */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="glass-card border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Reports</p>
                    <p className="text-3xl font-bold">{stats.totalReports}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stats.saReports} SA specific</p>
                  </div>
                  <FileText className="w-10 h-10 text-primary" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="glasscard border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Customers Analyzed</p>
                    <p className="text-3xl font-bold">{stats.totalCustomers}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stats.highRiskCustomers} high risk</p>
                  </div>
                  <Building className="w-10 h-10 text-warning" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="glass-card border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">SAR Ready</p>
                    <p className="text-3xl font-bold">{stats.urgentReports}</p>
                    <p className="text-xs text-muted-foreground mt-1">For FIC submission</p>
                  </div>
                  <AlertTriangle className="w-10 h-10 text-destructive" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="glass-card border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Regulatory Frameworks</p>
                    <p className="text-3xl font-bold">4</p>
                    <p className="text-xs text-muted-foreground mt-1">FIC, RICA, FATF, POPIA</p>
                  </div>
                  <Shield className="w-10 h-10 text-success" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle>Report Filters</CardTitle>
              <CardDescription>Filter compliance reports by type, status, and jurisdiction</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search reports by title or type..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Select value={reportTypeFilter} onValueChange={setReportTypeFilter}>
                    <SelectTrigger className="w-[180px]">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Report Type" />
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
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={jurisdictionFilter} onValueChange={setJurisdictionFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Jurisdiction" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Jurisdictions</SelectItem>
                      <SelectItem value="SA">South Africa</SelectItem>
                      <SelectItem value="International">International</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-4">
                <Badge 
                  variant="outline" 
                  className="cursor-pointer hover:bg-primary/10"
                  onClick={() => {
                    setReportTypeFilter("all");
                    setStatusFilter("all");
                    setJurisdictionFilter("all");
                    setSearchQuery("");
                  }}
                >
                  Clear Filters
                </Badge>
                <Badge variant="secondary">
                  Showing {filteredReports.length} of {mockReports.length} reports
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Reports Table */}
          <Card className="glass-card border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Compliance Reports</CardTitle>
                  <CardDescription>View, download, and submit regulatory reports</CardDescription>
                </div>
                <div className="text-sm text-muted-foreground">
                  Updated: {getTimeAgo()}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredReports.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No reports found</h3>
                  <p className="text-muted-foreground">Try adjusting your filters or search query</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredReports.map((report) => {
                    const statusBadge = getStatusBadge(report.status);
                    const isGenerating = generatingReportId === report.id;
                    
                    return (
                      <div
                        key={report.id}
                        className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg glass-card border border-border/50 hover-lift gap-4"
                      >
                        <div className="flex items-start gap-4 flex-1">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            report.type === "Suspicious Activity Report" ? "bg-destructive/20" :
                            report.type === "FICA Compliance" ? "bg-primary/20" :
                            "bg-warning/20"
                          }`}>
                            {report.type === "Suspicious Activity Report" ? (
                              <AlertTriangle className="w-6 h-6 text-destructive" />
                            ) : report.type === "FICA Compliance" ? (
                              <Shield className="w-6 h-6 text-primary" />
                            ) : (
                              <FileText className="w-6 h-6 text-warning" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{report.title}</h3>
                              {report.urgent && (
                                <Badge variant="destructive" className="text-xs">URGENT</Badge>
                              )}
                              {report.confidential && (
                                <Badge variant="outline" className="text-xs border-destructive/50 text-destructive">
                                  CONFIDENTIAL
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                {report.type}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {report.date}
                              </span>
                              <span>• {report.size}</span>
                              <span>• Jurisdiction: {report.jurisdiction}</span>
                              {typeof report.customerCount === 'number' && (
                                <span>• Customers: {report.customerCount}</span>
                              )}
                              {typeof report.highRisk === 'number' && (
                                <span className="text-destructive">• High Risk: {report.highRisk}</span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
                              {report.description}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="text-right hidden md:block">
                            <Badge className={statusBadge.class}>
                              <span className="mr-1">{statusBadge.icon}</span>
                              {report.status.toUpperCase()}
                            </Badge>
                            {report.jurisdiction === "SA" && (
                              <div className="text-xs text-muted-foreground mt-1">
                                SA Regulation
                              </div>
                            )}
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePreview(report)}
                              disabled={report.status !== "completed"}
                              className="gap-2"
                              title={report.status !== "completed" ? "Report still processing" : "Preview report"}
                            >
                              <Eye className="w-4 h-4" />
                              Preview
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownload(report)}
                              disabled={report.status !== "completed" || isGenerating}
                              className="gap-2"
                              title={report.status !== "completed" ? "Report still processing" : "Download PDF"}
                            >
                              {isGenerating ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Download className="w-4 h-4" />
                              )}
                              PDF
                            </Button>
                            
                            {report.type === "Suspicious Activity Report" && report.status === "completed" && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleSubmitToFIC(report)}
                                className="gap-2"
                                title="Submit to Financial Intelligence Centre"
                              >
                                <AlertTriangle className="w-4 h-4" />
                                Submit to FIC
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Regulatory Information */}
          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                South African Regulatory Framework
              </CardTitle>
              <CardDescription>Reports are generated in compliance with SA regulations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold">Mandatory Reports</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-destructive"></div>
                      <span><strong>Suspicious Activity Reports (SAR):</strong> Required within 7 days of detection (FIC Act Section 29)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <span><strong>FICA Compliance Reports:</strong> Annual compliance reporting requirements</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-warning"></div>
                      <span><strong>RICA Transaction Reports:</strong> Communication monitoring as per RICA Act</span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold">Report Retention</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span><strong>SAR Reports:</strong> 5 years minimum retention</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span><strong>FICA Records:</strong> 5 years from termination of business relationship</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span><strong>Transaction Records:</strong> 5 years as per FIC Act</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Reports;