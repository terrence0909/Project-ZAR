import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Search, ShieldCheck, TrendingUp, FileCheck, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_BASE_URL;

const Index = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);

  const validateInput = (value: string) => {
    if (!value) {
      setIsValid(null);
      return;
    }
    
    // Validate wallet address (0x followed by 40 hex characters)
    const walletRegex = /^0x[a-fA-F0-9]{40}$/;
    // Validate SA ID (13 digits)
    const saIdRegex = /^\d{13}$/;
    
    setIsValid(walletRegex.test(value) || saIdRegex.test(value));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    validateInput(value);
  };

  const handleAnalyze = async () => {
    if (!query.trim()) {
      toast.error("Please enter a wallet address or SA ID number");
      return;
    }

    if (isValid === false) {
      toast.error("Invalid format. Please enter a valid wallet address or SA ID number");
      return;
    }

    setIsValidating(true);
    
    try {
      // Determine query type
      const queryType = /^\d{13}$/.test(query) ? "sa_id" : "wallet_address";
      
      // Call your Lambda API
      const response = await fetch(`${API_URL}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: query.trim(), 
          query_type: queryType 
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success("Analysis complete");
        // Pass the results data through navigation state
        navigate("/results", { state: { results: data } });
      }
    } catch (error) {
      console.error("Search failed:", error);
      toast.error("Search failed. Please try again.");
    } finally {
      setIsValidating(false);
    }
  };

  const exampleQueries = [
    { label: "Wallet Address", value: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b" },
    { label: "SA ID Number", value: "9001015800081" }
  ];

  return (
    <main className="min-h-screen gradient-bg">
      {/* Navigation */}
      <nav className="border-b border-border/50 bg-glass backdrop-blur-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-foreground">Project ZAR</h2>
          <div className="flex gap-2">
            <Link to="/dashboard">
              <Button variant="outline" size="sm">
                <TrendingUp className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <Link to="/data-import">
              <Button variant="outline" size="sm">
                <Upload className="mr-2 h-4 w-4" />
                Data Import
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in-up">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Crypto Wallet Intelligence
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Instantly analyze wallet ownership, risk, and compliance status
          </p>

          {/* Search Card */}
          <div className="glass-card p-8 rounded-2xl space-y-6 animate-scale-in" style={{ animationDelay: "0.2s" }}>
            <div className="relative">
              <Input
                type="text"
                placeholder="Enter wallet address, SA ID number, or customer ID"
                value={query}
                onChange={handleInputChange}
                className={`h-14 pr-12 text-base mono bg-muted/50 border-border focus:border-primary transition-colors ${
                  isValid === true ? "border-success" : isValid === false ? "border-danger" : ""
                }`}
                onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
              />
              {isValid !== null && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  {isValid ? (
                    <ShieldCheck className="w-5 h-5 text-success" />
                  ) : (
                    <span className="text-danger text-xl">⚠</span>
                  )}
                </div>
              )}
            </div>

            <Button
              onClick={handleAnalyze}
              disabled={isValidating}
              className="w-full h-12 text-lg bg-primary hover:bg-primary/90 hover:scale-[1.02] transition-all hover-lift"
            >
              {isValidating ? (
                <>
                  <span className="animate-pulse">Analyzing...</span>
                </>
              ) : (
                <>
                  <Search className="mr-2 w-5 h-5" />
                  Analyze Wallet
                </>
              )}
            </Button>

            <div className="text-sm text-muted-foreground">
              <p className="mb-3">Try these examples:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {exampleQueries.map((example, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setQuery(example.value);
                      validateInput(example.value);
                    }}
                    className="px-4 py-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors text-xs mono"
                  >
                    {example.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Info Section */}
          <p className="text-muted-foreground text-sm">
            Enter a wallet address or SA ID to begin comprehensive risk analysis
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 pb-20">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          <div className="glass-card p-6 rounded-xl hover-lift">
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Risk Assessment</h3>
            <p className="text-sm text-muted-foreground">
              Comprehensive risk scoring with behavior analysis and pattern detection
            </p>
          </div>

          <div className="glass-card p-6 rounded-xl hover-lift">
            <div className="w-12 h-12 rounded-lg bg-warning/20 flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-warning" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Portfolio Discovery</h3>
            <p className="text-sm text-muted-foreground">
              Identify declared and undeclared wallets with confidence scoring
            </p>
          </div>

          <div className="glass-card p-6 rounded-xl hover-lift">
            <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center mb-4">
              <FileCheck className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Compliance Reports</h3>
            <p className="text-sm text-muted-foreground">
              Generate audit-ready reports with transaction analysis and recommendations
            </p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Index;