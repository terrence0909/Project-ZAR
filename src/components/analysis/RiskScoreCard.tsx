import { useEffect, useState } from "react";

interface RiskScoreCardProps {
  data: {
    risk_score: number;
    behavior_score: number;
    transaction_score: number;
    association_score: number;
    confidence: number;
    risky_transactions: number;
    high_risk_connections: number;
  };
}

const RiskScoreCard = ({ data }: RiskScoreCardProps) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = data.risk_score / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      setAnimatedScore(Math.min(Math.round(increment * currentStep), data.risk_score));
      
      if (currentStep >= steps) {
        clearInterval(timer);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [data.risk_score]);

  const getRiskLevel = (score: number) => {
    if (score <= 30) return { label: "Low Risk", color: "success", glow: "0 0 40px rgba(45, 90, 61, 0.6)" };
    if (score <= 70) return { label: "Medium Risk", color: "warning", glow: "0 0 40px rgba(184, 134, 11, 0.6)" };
    return { label: "High Risk", color: "danger", glow: "0 0 40px rgba(200, 90, 58, 0.6)" };
  };

  const risk = getRiskLevel(animatedScore);
  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  return (
    <div className="glass-card p-8 rounded-2xl">
      <div className="grid lg:grid-cols-[auto_1fr] gap-8 items-center">
        {/* Circular Risk Score */}
        <div className="flex flex-col items-center">
          <div className="relative w-52 h-52">
            <svg className="transform -rotate-90 w-52 h-52">
              <circle
                cx="104"
                cy="104"
                r="90"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                className="text-muted/30"
              />
              <circle
                cx="104"
                cy="104"
                r="90"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className={`text-${risk.color} transition-all duration-1000 ease-out`}
                style={{ 
                  filter: `drop-shadow(${risk.glow})`,
                }}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <div className={`text-5xl font-bold text-${risk.color}`}>
                {animatedScore}
              </div>
              <div className="text-2xl text-muted-foreground">/100</div>
            </div>
          </div>
          <div className={`mt-4 text-xl font-semibold text-${risk.color}`}>
            {risk.label}
          </div>
          <p className="text-sm text-muted-foreground mt-2 text-center max-w-xs">
            This wallet shows {risk.label.toLowerCase()} activity patterns
          </p>
        </div>

        {/* Score Breakdown & Quick Stats */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Score Breakdown</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex justify-between items-center">
                <span>Behavior Score:</span>
                <span className="font-mono font-medium text-foreground">{data.behavior_score}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Transaction Score:</span>
                <span className="font-mono font-medium text-foreground">{data.transaction_score}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Association Score:</span>
                <span className="font-mono font-medium text-foreground">{data.association_score}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-danger/10 border border-danger/30 rounded-lg p-4">
              <div className="text-2xl font-bold text-danger">{data.risky_transactions}</div>
              <div className="text-sm text-muted-foreground">Risky Transactions</div>
            </div>
            <div className="bg-danger/10 border border-danger/30 rounded-lg p-4">
              <div className="text-2xl font-bold text-danger">{data.high_risk_connections}</div>
              <div className="text-sm text-muted-foreground">High-Risk Connections</div>
            </div>
            <div className="bg-success/10 border border-success/30 rounded-lg p-4">
              <div className="text-2xl font-bold text-success">{data.confidence}%</div>
              <div className="text-sm text-muted-foreground">Clustering Confidence</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskScoreCard;
