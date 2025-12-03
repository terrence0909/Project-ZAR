import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, FileText, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import jsPDF from "jspdf";

interface GenerateReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReportGenerated: (report: { title: string; type: string; date: string; status: string }) => void;
}

const reportTypes = [
  { value: "risk-analysis", label: "Risk Analysis" },
  { value: "compliance", label: "Compliance Report" },
  { value: "analytics", label: "Transaction Analytics" },
  { value: "market", label: "Market Trends" },
];

export const GenerateReportDialog = ({ open, onOpenChange, onReportGenerated }: GenerateReportDialogProps) => {
  const [reportType, setReportType] = useState<string>("");
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!reportType || !dateRange.from) {
      toast.error("Please select report type and date range");
      return;
    }

    setIsGenerating(true);
    
    // Simulate report generation
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const typeLabel = reportTypes.find((t) => t.value === reportType)?.label || "Report";
    const title = `${typeLabel} - ${format(dateRange.from, "MMM yyyy")}`;

    // Generate PDF
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(26, 54, 93);
    doc.rect(0, 0, 210, 40, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text("PROJECT ZAR", 20, 25);
    doc.setFontSize(12);
    doc.text(typeLabel, 20, 35);

    // Report info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text(`Report Period: ${format(dateRange.from, "MMM d, yyyy")}${dateRange.to ? ` - ${format(dateRange.to, "MMM d, yyyy")}` : ""}`, 20, 55);
    doc.text(`Generated: ${format(new Date(), "MMM d, yyyy HH:mm")}`, 20, 65);

    // Content section
    doc.setFontSize(16);
    doc.text("Executive Summary", 20, 85);
    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    
    const summaryText = reportType === "risk-analysis" 
      ? "This report provides a comprehensive analysis of cryptocurrency exposure risks across customer portfolios."
      : reportType === "compliance"
      ? "This compliance report details regulatory adherence and AML/KYC status for monitored accounts."
      : reportType === "analytics"
      ? "Transaction analytics summary including volume trends, patterns, and anomaly detection results."
      : "Market trends analysis covering price movements, volatility metrics, and correlation data.";
    
    doc.text(summaryText, 20, 95, { maxWidth: 170 });

    // Sample metrics
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text("Key Metrics", 20, 120);
    
    doc.setFontSize(11);
    doc.text("• Total Customers Analyzed: 2,547", 25, 135);
    doc.text("• High-Risk Accounts: 127 (5%)", 25, 145);
    doc.text("• Total Crypto Exposure: R892.3M", 25, 155);
    doc.text("• Average Portfolio Crypto %: 12.4%", 25, 165);
    doc.text("• Alerts Generated: 89", 25, 175);
    doc.text("• Compliance Score: 94.2%", 25, 185);

    // Footer
    doc.setFontSize(9);
    doc.setTextColor(128, 128, 128);
    doc.text("Confidential - PROJECT ZAR Banking Compliance Dashboard", 20, 280);
    doc.text(`Page 1 of 1`, 180, 280);

    // Save PDF
    doc.save(`${title.replace(/\s+/g, "_")}.pdf`);

    onReportGenerated({
      title,
      type: typeLabel,
      date: format(new Date(), "yyyy-MM-dd"),
      status: "completed",
    });

    setIsGenerating(false);
    onOpenChange(false);
    setReportType("");
    setDateRange({ from: undefined, to: undefined });
    toast.success(`${title} generated and downloaded`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] glass-card border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Generate Report
          </DialogTitle>
          <DialogDescription>
            Configure and generate a new compliance report
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Report Type</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                {reportTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateRange.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? format(dateRange.from, "PPP") : "Select start date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.from}
                  onSelect={(date) => setDateRange((prev) => ({ ...prev, from: date }))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>End Date (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateRange.to && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.to ? format(dateRange.to, "PPP") : "Select end date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.to}
                  onSelect={(date) => setDateRange((prev) => ({ ...prev, to: date }))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate & Download"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
