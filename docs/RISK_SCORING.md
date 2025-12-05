# Risk Scoring Algorithm

## Overview

Project ZAR uses a sophisticated multi-factor risk scoring system to assess cryptocurrency wallet and customer compliance risk. Scores range from 0-100, with higher scores indicating greater risk.

## Score Classification

| Range | Level | Color | Action |
|-------|-------|-------|--------|
| 0-30 | Low | 🟢 Green | Monitor regularly |
| 31-70 | Medium | 🟡 Amber | Enhanced monitoring |
| 71-100 | High | 🔴 Red | Immediate review required |

## Calculation Formula

```
Risk Score = (F1 × W1 + F2 × W2 + F3 × W3 + F4 × W4) / 100

Where:
F1 = Transaction Pattern Score (Weight: 25%)
F2 = Wallet History Score (Weight: 20%)
F3 = Compliance Flag Score (Weight: 35%)
F4 = Mixer/Tumbler Score (Weight: 20%)
```

## Risk Factors

### 1. Transaction Pattern Score (25%)

Analyzes transaction behavior for suspicious patterns.

**Metrics**:
- Transaction frequency
- Transaction size distribution
- Temporal patterns (time between transactions)
- Velocity (transactions per day)

**Calculation**:
```
Pattern Score = (Velocity × 0.3 + Frequency × 0.3 + Size Distribution × 0.4)

High Velocity (>50 tx/day): +15 points
Unusual Timing (concentrated at specific hours): +10 points
Extreme Sizes (>1000 ETH): +15 points
Bimodal Distribution (very high and very low): +10 points
```

**Example**:
- 5 transactions per day = Low velocity = 5 points
- 200 transactions per day = High velocity = 20 points (capped)

### 2. Wallet History Score (20%)

Evaluates the age and activity history of the wallet.

**Metrics**:
- Account age
- Total transactions
- Time since last activity
- Transaction consistency

**Calculation**:
```
History Score = (Age × 0.2 + Activity Level × 0.4 + Recency × 0.4)

New Account (<1 month): +20 points
Young Account (1-6 months): +10 points
Mature Account (>2 years): 0 points
Inactive (>6 months): +15 points
```

**Example**:
- Account created 30 days ago: 20 points
- Account created 2 years ago with recent activity: 5 points

### 3. Compliance Flag Score (35%)

Detects known compliance risks and red flags.

**Risk Flags**:

| Flag | Points | Description |
|------|--------|-------------|
| Undeclared Wallet | 25 | Wallet not in customer profile |
| Sanctioned Entity | 50 | Connected to sanctions list |
| High-Risk Jurisdiction | 20 | Activity from high-risk countries |
| Scam List Match | 45 | Address on known scam/phishing list |
| Stolen Funds | 40 | Connected to theft or fraud |
| Wash Trading | 20 | Suspicious circular transactions |
| Pump & Dump | 25 | Participation in scheme |
| KYC Pending | 15 | Customer not fully verified |

**Example**:
- Undeclared wallet + KYC pending = 25 + 15 = 40 points

### 4. Mixer/Tumbler Score (20%)

Identifies use of privacy mixing services.

**Detection Methods**:
- Known mixer contract addresses
- Multi-hop transactions to mixers
- Deposit/withdrawal patterns matching mixer behavior
- Time-delayed withdrawals (classic mixer pattern)

**Scoring**:
```
Direct Mixer Use: +30 points
Multi-hop to Mixer: +20 points
Withdrawal from Mixer: +15 points
Frequent Mixer Access: +40 points (capped)
```

**Example**:
- Direct deposit to Tornado Cash: 30 points
- Regular deposits followed by delayed withdrawals: 25 points

## Risk Flag Detection

### Automated Checks

```typescript
interface RiskFlags {
  undeclaredWallet: boolean;
  sanctionedEntity: boolean;
  highRiskJurisdiction: boolean;
  mixerUsage: boolean;
  scamListMatch: boolean;
  stolenFunds: boolean;
  washTrading: boolean;
  pumpAndDump: boolean;
}

// Detection logic
const detectRiskFlags = (wallet: Wallet): RiskFlags => {
  return {
    undeclaredWallet: !wallet.declared,
    sanctionedEntity: checkSanctionsList(wallet.address),
    highRiskJurisdiction: checkJurisdiction(wallet.owner),
    mixerUsage: detectMixerPatterns(wallet.transactions),
    scamListMatch: checkScamDatabase(wallet.address),
    stolenFunds: checkTheftReports(wallet.address),
    washTrading: detectWashTrading(wallet.transactions),
    pumpAndDump: detectPumpDump(wallet.tokens)
  };
};
```

## Score Modifiers

### Positive Modifiers (Lower Risk)

- Long account history (-5 points)
- KYC verified (-10 points)
- Business account (-5 points)
- Regular audit trail (-3 points)

### Negative Modifiers (Higher Risk)

- New account (+5 points)
- Low transaction volume (+3 points)
- Unusual geographic origin (+5 points)
- Multiple flag triggers (+10 points each flag after first)

## Aggregation Logic

### Customer Risk Score

For customers with multiple wallets:

```
Customer Score = Weighted Average of Wallet Scores

Where weights are based on:
1. Balance proportion (50%)
2. Activity level (30%)
3. Declared status (20%)

Example:
Wallet A: Score 20, Balance 10 ETH (66%)
Wallet B: Score 60, Balance 5 ETH (34%)

Customer Score = (20 × 0.66) + (60 × 0.34) = 33.6 ≈ 34
```

## Real-Time Updates

Risk scores are recalculated when:
- New transaction detected
- Wallet marked as undeclared
- Customer KYC status changes
- Sanctioned list updated
- New risk flag triggered

## Risk Score Examples

### Example 1: Legitimate Business Account

```
Account Age: 3 years old (-5)
Transaction Pattern: Regular, small amounts (5)
Compliance: KYC verified, declared (-10)
Mixer Usage: None (0)

Total: -10 + 5 - 10 + 0 = -5 → 0 (minimum)

Risk Level: Low 🟢
```

### Example 2: Suspicious New Account

```
Account Age: 10 days old (20)
Transaction Pattern: Irregular, large amounts (20)
Compliance: Undeclared, KYC pending (25 + 15)
Mixer Usage: Direct deposit to mixer (30)

Total: 20 + 20 + 40 + 30 = 110 → 100 (capped)

Risk Level: High 🔴
```

### Example 3: Mixed Profile Account

```
Account Age: 6 months (10)
Transaction Pattern: Normal frequency (8)
Compliance: Declared, KYC verified (-10)
Mixer Usage: Multi-hop to mixer (20)

Total: 10 + 8 - 10 + 20 = 28 → 28

Risk Level: Low 🟢 (just below threshold)
```

## Configuration

Risk thresholds can be configured via environment variables:

```env
# Risk score thresholds
VITE_RISK_THRESHOLD_HIGH=70
VITE_RISK_THRESHOLD_MEDIUM=30

# Factor weights (must sum to 100)
VITE_RISK_WEIGHT_PATTERN=25
VITE_RISK_WEIGHT_HISTORY=20
VITE_RISK_WEIGHT_COMPLIANCE=35
VITE_RISK_WEIGHT_MIXER=20

# Modifier adjustments
VITE_RISK_MODIFIER_KYC_VERIFIED=-10
VITE_RISK_MODIFIER_NEW_ACCOUNT=5
```

## Alert Triggers

Alerts are automatically generated when:

1. **Score increases by >20 points** - Risk deterioration alert
2. **New mixer usage detected** - Compliance alert
3. **Sanctioned entity connection** - Critical alert
4. **KYC verification expires** - Administrative alert
5. **Undeclared wallet discovered** - Investigation alert

## Performance Impact

Risk scoring is optimized for real-time calculation:

- Single wallet: ~50ms
- Customer (5 wallets): ~300ms
- Batch processing (100 customers): ~20s

## Limitations

Current system limitations:

1. **Blockchain-only**: Doesn't track off-chain activities
2. **Ethereum-focused**: Limited multi-chain support
3. **Historical data**: Only analyzes last 2 years
4. **False positives**: May flag legitimate privacy users
5. **Evolving tactics**: New mixing techniques not yet detected

## Future Improvements

- Machine learning risk prediction
- Cross-chain transaction tracking
- Real-time threat intelligence feeds
- Behavioral analysis enhancements
- DeFi protocol risk scoring
- Token risk assessment

## References

- [AML Best Practices](https://www.fatf-gafi.org/)
- [Sanctions Compliance](https://ofac.treasury.gov/)
- [Chainalysis Risk Framework](https://www.chainalysis.com/)
- [Elliptic Risk Scoring](https://www.elliptic.co/)