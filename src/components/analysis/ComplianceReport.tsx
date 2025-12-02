import { FileText, Download, Mail, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { toast } from "sonner";

interface ComplianceReportProps {
  data: {
    name: string;
    sa_id: string;
    declared_wallets: any[];
    undeclared_wallets: any[];
    risk_score: number;
    risk_flags: any[];
  };
}

const ComplianceReport = ({ data }: ComplianceReportProps) => {
  const [includeTransactions, setIncludeTransactions] = useState(true);
  const [includeConfidence, setIncludeConfidence] = useState(true);
  const [includeAuditTrail, setIncludeAuditTrail] = useState(true);

  const handleDownloadPDF = () => {
    toast.success("Generating PDF report...");
  };

  const handleEmailReport = () => {
    toast.success("Email dialog opened");
  };

  const handlePrint = () => {
    window.print();
  };

  const totalWallets = data.declared_wallets.length + data.undeclared_wallets.length;
  const flaggedWallets = [...data.declared_wallets, ...data.undeclared_wallets].filter(
    w => w.risk_score > 70
  ).length;

  return (
    <div className="glass-card p-6 rounded-xl">
      <div className="flex items-center gap-2 mb-6">
        <FileText className="w-5 h-5 text-primary" />
        <h2 className="text-2xl font-bold">Compliance Report</h2>
      </div>

      {/* Report Preview */}
      <div className="bg-muted/20 rounded-lg p-6 mb-6 space-y-4">
        <div className="border-b border-border/50 pb-4">
          <h3 className="text-lg font-bold mb-2">
            Crypto Intelligence Report: {data.name}
          </h3>
          <p className="text-sm text-muted-foreground mono">SA ID: {data.sa_id}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Generated: {new Date().toLocaleString()}
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Executive Summary</h4>
          <div className="text-sm space-y-2 text-muted-foreground">
            <p>
              Analysis of customer {data.name} ({data.sa_id}) reveals a portfolio of {totalWallets} wallets 
              with an overall risk score of {data.risk_score}/100.
            </p>
            <div className="grid md:grid-cols-3 gap-4 my-3">
              <div className="bg-card/50 p-3 rounded">
                <div className="text-xs text-muted-foreground">Declared Assets</div>
                <div className="font-semibold">{data.declared_wallets.length} wallet(s)</div>
              </div>
              <div className="bg-card/50 p-3 rounded">
                <div className="text-xs text-muted-foreground">Undeclared Found</div>
                <div className="font-semibold text-warning">{data.undeclared_wallets.length} wallet(s)</div>
              </div>
              <div className="bg-card/50 p-3 rounded">
                <div className="text-xs text-muted-foreground">Wallets Flagged</div>
                <div className="font-semibold text-danger">{flaggedWallets} of {totalWallets}</div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Key Findings</h4>
          <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
            <li>{data.undeclared_wallets.length} undeclared wallets discovered through clustering analysis</li>
            <li>{data.risk_flags.filter(f => f.severity === "high").length} high-risk flags identified</li>
            <li>{data.risk_flags.filter(f => f.severity === "medium").length} medium-risk patterns detected</li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Recommendations</h4>
          <p className="text-sm text-muted-foreground">
            {data.risk_score > 70 
              ? "Immediate investigation recommended due to high-risk activity patterns and undeclared assets."
              : "Continue monitoring for suspicious activity. Review undeclared wallets with customer."}
          </p>
        </div>
      </div>

      {/* Customization Options */}
      <div className="space-y-3 mb-6">
        <h4 className="font-semibold text-sm">Report Options</h4>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="transactions" 
              checked={includeTransactions}
              onCheckedChange={(checked) => setIncludeTransactions(checked as boolean)}
            />
            <label htmlFor="transactions" className="text-sm text-muted-foreground cursor-pointer">
              Include transaction details (detailed report)
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="confidence" 
              checked={includeConfidence}
              onCheckedChange={(checked) => setIncludeConfidence(checked as boolean)}
            />
            <label htmlFor="confidence" className="text-sm text-muted-foreground cursor-pointer">
              Include confidence scores (transparency)
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="audit" 
              checked={includeAuditTrail}
              onCheckedChange={(checked) => setIncludeAuditTrail(checked as boolean)}
            />
            <label htmlFor="audit" className="text-sm text-muted-foreground cursor-pointer">
              Include audit trail (compliance requirement)
            </label>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button 
          onClick={handleDownloadPDF}
          className="bg-primary hover:bg-primary/90"
        >
          <Download className="w-4 h-4 mr-2" />
          Download PDF Report
        </Button>
        <Button 
          onClick={handleEmailReport}
          variant="outline"
        >
          <Mail className="w-4 h-4 mr-2" />
          Email Report
        </Button>
        <Button 
          onClick={handlePrint}
          variant="outline"
        >
          <Printer className="w-4 h-4 mr-2" />
          Print Report
        </Button>
      </div>
    </div>
  );
};

export default ComplianceReport;
