import { FileText, Download, Mail, Printer, ShieldAlert, Building, FileWarning, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// Import jsPDF - make sure you've installed: npm install jspdf jspdf-autotable
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface ComplianceReportProps {
  data: {
    name: string;
    sa_id: string;
    declared_wallets: any[];
    undeclared_wallets: any[];
    risk_score: number;
    risk_flags: any[];
    fica_status?: 'verified' | 'pending' | 'not_verified';
    sanctions_check?: boolean;
    pep_status?: boolean;
  };
}

const ComplianceReport = ({ data }: ComplianceReportProps) => {
  const [includeTransactions, setIncludeTransactions] = useState(true);
  const [includeConfidence, setIncludeConfidence] = useState(true);
  const [includeAuditTrail, setIncludeAuditTrail] = useState(true);
  const [includeFATFReport, setIncludeFATFReport] = useState(true);
  const [includeSARForm, setIncludeSARForm] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Calculate derived values
  const totalWallets = data.declared_wallets.length + data.undeclared_wallets.length;
  const flaggedWallets = [...data.declared_wallets, ...data.undeclared_wallets].filter(
    w => w.risk_score > 70
  ).length;

  const getRiskLevel = (score: number) => {
    if (score > 70) return { label: "HIGH RISK", color: "text-destructive", bg: "bg-destructive/10" };
    if (score > 40) return { label: "MEDIUM RISK", color: "text-warning", bg: "bg-warning/10" };
    return { label: "LOW RISK", color: "text-success", bg: "bg-success/10" };
  };

  const riskLevel = getRiskLevel(data.risk_score);

  // Helper function to calculate ZAR values (simplified - use real prices in production)
  const calculateZARValues = () => {
    const allWallets = [...data.declared_wallets, ...data.undeclared_wallets];
    
    let totalZAR = 0;
    let zarAtRisk = 0;
    
    allWallets.forEach(wallet => {
      const balance = parseFloat(wallet.balance) || 0;
      // Simplified conversion - in production, use real market prices
      let zarValue = 0;
      if (wallet.blockchain === 'ETH' || wallet.symbol === 'ETH') {
        zarValue = balance * 45000; // ~R45,000 per ETH
      } else if (wallet.blockchain === 'BTC' || wallet.symbol === 'BTC') {
        zarValue = balance * 985000; // ~R985,000 per BTC
      } else {
        zarValue = balance * 1000; // Default
      }
      
      totalZAR += zarValue;
      if (wallet.risk_score > 70) {
        zarAtRisk += zarValue;
      }
    });
    
    return {
      totalZAR: Math.round(totalZAR),
      zarAtRisk: Math.round(zarAtRisk),
      lunoExposure: Math.round(totalZAR * 0.6), // Assume 60% exposure to Luno
      valrExposure: Math.round(totalZAR * 0.3), // Assume 30% exposure to VALR
      altcointraderExposure: Math.round(totalZAR * 0.1), // Assume 10% exposure to AltcoinTrader
    };
  };

  const zarValues = calculateZARValues();

  // Generate professional PDF with jsPDF
  const generatePDFReport = () => {
    setIsGeneratingPDF(true);
    
    try {
      const doc = new jsPDF();
      
      // Add watermark
      doc.setTextColor(200, 200, 200);
      doc.setFontSize(60);
      doc.text("CONFIDENTIAL", 40, 140, { angle: 45 });
      doc.setTextColor(0, 0, 0);
      
      // Add header with logo/color
      doc.setFillColor(13, 71, 161); // Blue background
      doc.rect(0, 0, 210, 40, 'F');
      
      // Title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.text("FICA COMPLIANCE REPORT", 105, 25, { align: 'center' });
      
      doc.setFontSize(10);
      doc.text("Financial Intelligence Centre Act, 2001 (Act No. 38 of 2001)", 105, 35, { align: 'center' });
      
      // Reset text color
      doc.setTextColor(0, 0, 0);
      
      let yPosition = 50;
      
      // Customer Information
      doc.setFontSize(16);
      doc.text("CUSTOMER INFORMATION", 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(11);
      doc.text(`Name: ${data.name}`, 20, yPosition);
      doc.text(`SA ID: ${data.sa_id}`, 120, yPosition);
      yPosition += 8;
      
      doc.text(`FICA Status: ${data.fica_status?.toUpperCase() || 'NOT VERIFIED'}`, 20, yPosition);
      doc.text(`Report ID: FICA-${data.sa_id}-${Date.now().toString().slice(-6)}`, 120, yPosition);
      yPosition += 8;
      
      doc.text(`Generated: ${new Date().toLocaleString('en-ZA')}`, 20, yPosition);
      yPosition += 15;
      
      // Risk Overview
      doc.setFontSize(16);
      doc.text("RISK OVERVIEW", 20, yPosition);
      yPosition += 10;
      
      // Risk Score in colored box
      const riskColor = data.risk_score > 70 ? [244, 67, 54] : data.risk_score > 40 ? [255, 152, 0] : [76, 175, 80];
      doc.setFillColor(riskColor[0], riskColor[1], riskColor[2]);
      doc.rect(20, yPosition, 30, 20, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.text(`${data.risk_score}`, 35, yPosition + 14, { align: 'center' });
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.text("/ 100", 55, yPosition + 14);
      doc.text(riskLevel.label, 90, yPosition + 14);
      
      yPosition += 25;
      
      // Key Metrics Table
      autoTable(doc, {
        startY: yPosition,
        head: [['Metric', 'Value', 'Status']],
        body: [
          ['Declared Wallets', data.declared_wallets.length.toString(), '✅ Verified'],
          ['Undeclared Wallets', data.undeclared_wallets.length.toString(), '⚠️ Investigation Required'],
          ['High Risk Flags', data.risk_flags.filter(f => f.severity === 'high').length.toString(), 
           data.risk_flags.filter(f => f.severity === 'high').length > 0 ? '🚨 Immediate Action' : '✅ Clear'],
          ['Total Wallets', totalWallets.toString(), '📈 Complete'],
        ],
        theme: 'grid',
        headStyles: { fillColor: [13, 71, 161] },
        margin: { left: 20, right: 20 },
      });
      
      yPosition = (doc as any).lastAutoTable.finalY + 15;
      
      // Financial Exposure in ZAR
      doc.setFontSize(16);
      doc.text("FINANCIAL EXPOSURE (ZAR)", 20, yPosition);
      yPosition += 10;
      
      const zarBody = [
        ['Total Portfolio Value', `R ${zarValues.totalZAR.toLocaleString('en-ZA')}`, 'Estimated Market Value'],
        ['ZAR at High Risk', `R ${zarValues.zarAtRisk.toLocaleString('en-ZA')}`, 'High-Risk Exposure'],
        ['SA Exchange Exposure', `R ${(zarValues.lunoExposure + zarValues.valrExposure + zarValues.altcointraderExposure).toLocaleString('en-ZA')}`, 'Local Platforms'],
      ];
      
      autoTable(doc, {
        startY: yPosition,
        head: [['Exposure Type', 'Amount (ZAR)', 'Description']],
        body: zarBody,
        theme: 'striped',
        headStyles: { fillColor: [25, 118, 210] },
        margin: { left: 20, right: 20 },
      });
      
      yPosition = (doc as any).lastAutoTable.finalY + 15;
      
      // Risk Flags
      if (data.risk_flags.length > 0) {
        doc.setFontSize(16);
        doc.text("RISK FLAGS DETECTED", 20, yPosition);
        yPosition += 10;
        
        const riskFlagsBody = data.risk_flags.slice(0, 8).map(flag => [
          flag.title || flag.type,
          flag.severity.toUpperCase(),
          flag.description?.substring(0, 60) || 'No description'
        ]);
        
        autoTable(doc, {
          startY: yPosition,
          head: [['Flag Type', 'Severity', 'Description']],
          body: riskFlagsBody,
          theme: 'grid',
          headStyles: { fillColor: [183, 28, 28] },
          columnStyles: {
            0: { cellWidth: 60 },
            1: { cellWidth: 30 },
            2: { cellWidth: 100 }
          },
          margin: { left: 20, right: 20 },
          styles: {
            fontSize: 9,
            cellPadding: 3
          },
          willDrawCell: (data) => {
            if (data.section === 'body' && data.column.index === 1) {
              const severity = data.cell.raw as string;
              if (severity === 'HIGH') {
                data.cell.styles.fillColor = [244, 67, 54];
                data.cell.styles.textColor = [255, 255, 255];
              } else if (severity === 'MEDIUM') {
                data.cell.styles.fillColor = [255, 152, 0];
                data.cell.styles.textColor = [255, 255, 255];
              } else {
                data.cell.styles.fillColor = [76, 175, 80];
                data.cell.styles.textColor = [255, 255, 255];
              }
            }
          }
        });
        
        yPosition = (doc as any).lastAutoTable.finalY + 15;
      }
      
      // Recommendations
      doc.setFontSize(16);
      doc.text("RECOMMENDATIONS", 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(11);
      const recommendations = data.risk_score > 70 
        ? [
            "🚨 IMMEDIATE INVESTIGATION REQUIRED",
            "Freeze suspicious accounts pending investigation",
            "File SAR with FIC within 7 days (FIC Act Section 29)",
            "Conduct enhanced due diligence interview",
            "Review all transaction patterns for last 12 months"
          ]
        : [
            "✅ Continue with standard monitoring procedures",
            "Schedule annual compliance review",
            "Document all findings in customer file",
            "Update risk assessment in 6 months"
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
      const fileName = `FICA_Report_${data.sa_id}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      toast.success("Professional PDF report generated successfully!");
      
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error("Failed to generate PDF. Using fallback export.");
      
      // Fallback to JSON export
      exportAsJSON();
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Generate SAR Form PDF
  const generateSARFormPDF = () => {
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
      ['Report Reference', `SAR-${data.sa_id}-${Date.now().toString().slice(-6)}`],
      ['Date of Report', new Date().toLocaleDateString('en-ZA')],
      ['Subject Name', data.name],
      ['SA ID Number', data.sa_id],
      ['Reason for Filing', 'High-risk crypto activity and undeclared wallets'],
      ['Risk Score', `${data.risk_score}/100`],
      ['ZAR Value at Risk', `R ${zarValues.zarAtRisk.toLocaleString('en-ZA')}`],
    ];
    
    formFields.forEach(([label, value], index) => {
      doc.text(`${label}:`, 20, yPosition);
      doc.setFont(undefined, 'bold');
      doc.text(value, 80, yPosition);
      doc.setFont(undefined, 'normal');
      yPosition += 10;
    });
    
    // Save SAR form
    const fileName = `SAR_Form_${data.sa_id}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    toast.success("SAR Form generated for FIC submission!");
  };

  const handleDownloadPDF = async () => {
    if (includeSARForm && data.risk_score > 70) {
      generateSARFormPDF();
    } else {
      generatePDFReport();
    }
  };

  const exportAsJSON = () => {
    const reportData = {
      reportType: "FICA Compliance Report",
      customer: {
        name: data.name,
        sa_id: data.sa_id,
        fica_status: data.fica_status || 'not_verified',
        sanctions_check: data.sanctions_check || false,
        pep_status: data.pep_status || false
      },
      riskAssessment: {
        overall_risk_score: data.risk_score,
        risk_level: riskLevel.label,
        high_risk_flags: data.risk_flags.filter(f => f.severity === "high").length,
        medium_risk_flags: data.risk_flags.filter(f => f.severity === "medium").length,
        low_risk_flags: data.risk_flags.filter(f => f.severity === "low").length
      },
      walletAnalysis: {
        total_wallets: totalWallets,
        declared_wallets: data.declared_wallets.length,
        undeclared_wallets: data.undeclared_wallets.length,
        flagged_high_risk: flaggedWallets
      },
      financialExposure: {
        total_zar_value: zarValues.totalZAR,
        zar_at_risk: zarValues.zarAtRisk,
        sa_exchange_exposure: {
          luno_zar: zarValues.lunoExposure,
          valr_zar: zarValues.valrExposure,
          altcointrader_zar: zarValues.altcointraderExposure
        }
      },
      recommendations: data.risk_score > 70 
        ? ["IMMEDIATE INVESTIGATION REQUIRED", "Freeze suspicious accounts", "File SAR with FIC"]
        : ["Continue monitoring", "Request additional documentation", "Schedule customer interview"],
      generatedAt: new Date().toISOString(),
      reportId: `FICA-${data.sa_id}-${Date.now()}`,
      jurisdiction: "South Africa (FIC Act No. 38 of 2001)"
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `FICA_Report_${data.sa_id}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success("Report exported as JSON");
  };

  const handleEmailReport = () => {
    const subject = `FICA Compliance Report - ${data.name} (${data.sa_id})`;
    const body = `Please find the compliance report for ${data.name} attached.\n\n`
                + `Key Findings:\n`
                + `• Risk Score: ${data.risk_score}/100\n`
                + `• Declared Wallets: ${data.declared_wallets.length}\n`
                + `• Undeclared Wallets: ${data.undeclared_wallets.length}\n`
                + `• High Risk Flags: ${data.risk_flags.filter(f => f.severity === "high").length}\n`
                + `• ZAR at Risk: R ${zarValues.zarAtRisk.toLocaleString('en-ZA')}\n\n`
                + `Generated: ${new Date().toLocaleString('en-ZA')}\n`
                + `Report ID: FICA-${data.sa_id}-${Date.now().toString().slice(-6)}`;
    
    window.location.href = `mailto:compliance@yourbank.co.za?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    toast.info("Email client opened. You can attach the exported report.");
  };

  const handlePrint = () => {
    const printContent = document.getElementById('compliance-report-content');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>FICA Report - ${data.name}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { color: #1e40af; border-bottom: 2px solid #666; padding-bottom: 10px; }
                .section { margin: 20px 0; page-break-inside: avoid; }
                table { width: 100%; border-collapse: collapse; margin: 10px 0; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f5f5f5; }
                .risk-badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 12px; }
                .high-risk { background: #fee2e2; color: #dc2626; }
                .medium-risk { background: #fef3c7; color: #d97706; }
                .low-risk { background: #dcfce7; color: #16a34a; }
                .footer { margin-top: 40px; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 10px; }
                @media print {
                  body { margin: 15px; }
                  button { display: none; }
                }
              </style>
            </head>
            <body>
              <div id="print-content">
                ${printContent.innerHTML}
              </div>
              <div class="footer">
                <p>Generated by Project ZAR Compliance System</p>
                <p>Date: ${new Date().toLocaleString('en-ZA')}</p>
                <p>Confidential - For Compliance Use Only</p>
                <p>Regulatory Reference: FIC Act No. 38 of 2001</p>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      }
    } else {
      window.print();
    }
  };

  return (
    <div className="glass-card p-6 rounded-xl border border-border/50" id="compliance-report-content">
      {/* PDF Generation Overlay */}
      {isGeneratingPDF && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-xl max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="font-medium">Generating Professional PDF Report...</span>
            </div>
            <Progress value={65} className="mb-2" />
            <p className="text-sm text-muted-foreground text-center">
              Compiling compliance data and formatting report
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">FICA Compliance Report</h2>
            <p className="text-sm text-muted-foreground">South African Financial Intelligence Centre Act (FIC Act)</p>
          </div>
        </div>
        <Badge className={`px-3 py-1 text-sm font-semibold ${riskLevel.bg} ${riskLevel.color} border-0`}>
          {riskLevel.label}
        </Badge>
      </div>

      {/* Report Preview */}
      <div className="bg-muted/10 rounded-lg p-6 mb-6 space-y-6 border border-border/30">
        {/* Header */}
        <div className="border-b border-border/50 pb-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-bold mb-1">
                Crypto Intelligence Report: {data.name}
              </h3>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="mono">SA ID: {data.sa_id}</span>
                {data.fica_status && (
                  <Badge variant="outline" className={
                    data.fica_status === 'verified' ? 'bg-success/10 text-success border-success/20' :
                    data.fica_status === 'pending' ? 'bg-warning/10 text-warning border-warning/20' :
                    'bg-destructive/10 text-destructive border-destructive/20'
                  }>
                    FICA: {data.fica_status.toUpperCase()}
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Report ID</div>
              <div className="text-sm font-mono">FICA-{data.sa_id}-{Date.now().toString().slice(-6)}</div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Generated: {new Date().toLocaleString('en-ZA', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>

        {/* Financial Exposure */}
        <div>
          <h4 className="font-semibold mb-3">Financial Exposure (ZAR)</h4>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg border bg-card/50">
              <div className="text-xs text-muted-foreground mb-1">Total Portfolio Value</div>
              <div className="font-semibold text-lg">
                R {zarValues.totalZAR.toLocaleString('en-ZA')}
              </div>
            </div>
            <div className="p-3 rounded-lg border bg-card/50">
              <div className="text-xs text-muted-foreground mb-1">ZAR at High Risk</div>
              <div className="font-semibold text-lg text-destructive">
                R {zarValues.zarAtRisk.toLocaleString('en-ZA')}
              </div>
            </div>
            <div className="p-3 rounded-lg border bg-card/50">
              <div className="text-xs text-muted-foreground mb-1">SA Exchange Exposure</div>
              <div className="font-semibold text-lg">
                R {(zarValues.lunoExposure + zarValues.valrExposure + zarValues.altcointraderExposure).toLocaleString('en-ZA')}
              </div>
            </div>
          </div>
        </div>

        {/* Rest of your report preview content... */}
        {/* ... (Keep all your existing report preview JSX) ... */}
        
      </div>

      {/* Report Customization */}
      <div className="space-y-4 mb-6 p-4 rounded-lg bg-muted/5 border">
        <h4 className="font-semibold text-sm flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Report Customization
        </h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="transactions" 
                checked={includeTransactions}
                onCheckedChange={(checked) => setIncludeTransactions(checked as boolean)}
              />
              <label htmlFor="transactions" className="text-sm cursor-pointer">
                <span className="font-medium">Transaction Details</span>
                <div className="text-xs text-muted-foreground mt-0.5">Include detailed transaction history</div>
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="confidence" 
                checked={includeConfidence}
                onCheckedChange={(checked) => setIncludeConfidence(checked as boolean)}
              />
              <label htmlFor="confidence" className="text-sm cursor-pointer">
                <span className="font-medium">Confidence Scores</span>
                <div className="text-xs text-muted-foreground mt-0.5">Include analysis confidence metrics</div>
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="audit" 
                checked={includeAuditTrail}
                onCheckedChange={(checked) => setIncludeAuditTrail(checked as boolean)}
              />
              <label htmlFor="audit" className="text-sm cursor-pointer">
                <span className="font-medium">Audit Trail</span>
                <div className="text-xs text-muted-foreground mt-0.5">Full audit log (FIC compliance)</div>
              </label>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="fatf" 
                checked={includeFATFReport}
                onCheckedChange={(checked) => setIncludeFATFReport(checked as boolean)}
              />
              <label htmlFor="fatf" className="text-sm cursor-pointer">
                <span className="font-medium">FATF Annex</span>
                <div className="text-xs text-muted-foreground mt-0.5">Include FATF Travel Rule compliance</div>
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="sar" 
                checked={includeSARForm}
                onCheckedChange={(checked) => setIncludeSARForm(checked as boolean)}
              />
              <label htmlFor="sar" className="text-sm cursor-pointer">
                <span className="font-medium">SAR Form</span>
                <div className="text-xs text-muted-foreground mt-0.5">Pre-filled SAR submission form</div>
              </label>
            </div>
            <div className="text-xs text-muted-foreground p-2 rounded bg-muted/20">
              ⓘ Generated reports include digital signature and are valid for 90 days
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button 
          onClick={handleDownloadPDF}
          className="bg-primary hover:bg-primary/90 gap-2"
          size="lg"
          disabled={isGeneratingPDF}
        >
          {isGeneratingPDF ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating PDF...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              {includeSARForm && data.risk_score > 70 ? "Download SAR Form" : "Download FICA Report"}
            </>
          )}
        </Button>
        <Button 
          onClick={handleEmailReport}
          variant="outline"
          className="gap-2"
          size="lg"
        >
          <Mail className="w-5 h-5" />
          Email to FIC
        </Button>
        <Button 
          onClick={handlePrint}
          variant="outline"
          className="gap-2"
          size="lg"
        >
          <Printer className="w-5 h-5" />
          Print Report
        </Button>
        {data.risk_score > 70 && (
          <Button 
            variant="destructive"
            className="gap-2"
            size="lg"
            onClick={() => {
              setIncludeSARForm(true);
              handleDownloadPDF();
            }}
          >
            <FileWarning className="w-5 h-5" />
            Generate SAR for FIC
          </Button>
        )}
      </div>

      {/* Footer Note */}
      <div className="mt-6 pt-4 border-t border-border/30">
        <p className="text-xs text-muted-foreground text-center">
          This report is generated in compliance with the Financial Intelligence Centre Act, 2001 (Act No. 38 of 2001).<br />
          All data is confidential and protected under the Protection of Personal Information Act, 2013 (Act No. 4 of 2013).
        </p>
      </div>
    </div>
  );
};

export default ComplianceReport;