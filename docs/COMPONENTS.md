# Component Guide

## Component Structure

Project ZAR uses a hierarchical component structure organized by feature:

```
src/components/
├── analysis/           # Wallet analysis components
├── dashboard/          # Dashboard widgets
├── reports/            # Report generation
└── ui/                 # Base UI components (shadcn/ui)
```

## UI Components (shadcn/ui)

These are the foundational components used throughout the app.

### Button

```typescript
import { Button } from '@/components/ui/button';

<Button variant="default">Primary Button</Button>
<Button variant="outline">Outline Button</Button>
<Button variant="secondary">Secondary Button</Button>
<Button variant="destructive">Danger Button</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button disabled>Disabled</Button>
```

### Card

```typescript
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    Card content goes here
  </CardContent>
</Card>
```

### Badge

```typescript
import { Badge } from '@/components/ui/badge';

<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Destructive</Badge>
```

### Input

```typescript
import { Input } from '@/components/ui/input';

<Input placeholder="Search..." />
<Input type="email" placeholder="Email" />
<Input disabled />
```

### Switch

```typescript
import { Switch } from '@/components/ui/switch';

const [enabled, setEnabled] = useState(false);

<Switch checked={enabled} onCheckedChange={setEnabled} />
```

## Dashboard Components

### KPICards

Displays key performance indicators.

**Location**: `src/components/dashboard/KPICards.tsx`

**Props**:
```typescript
interface Props {
  stats: DashboardStats;
  loading?: boolean;
}

interface DashboardStats {
  totalCustomers: number;
  highRiskCustomers: number;
  mediumRiskCustomers: number;
  lowRiskCustomers: number;
  totalWallets: number;
  undeclaredWallets: number;
  averageRiskScore: number;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
  };
}
```

**Usage**:
```typescript
<KPICards 
  stats={dashboardStats} 
  loading={isLoading} 
/>
```

### RiskDistributionChart

Pie chart showing risk distribution.

**Location**: `src/components/dashboard/RiskDistributionChart.tsx`

**Props**:
```typescript
interface Props {
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
  };
  totalCustomers?: number;
}
```

**Usage**:
```typescript
<RiskDistributionChart 
  riskDistribution={stats.riskDistribution}
  totalCustomers={stats.totalCustomers}
/>
```

### LiveMarketPrices

Table of live cryptocurrency prices.

**Location**: `src/components/dashboard/LiveMarketPrices.tsx`

**Props**:
```typescript
interface Props {
  marketPrices: MarketPrice[];
  onRefresh: () => Promise<void>;
  loading?: boolean;
  lastUpdate: Date;
  error?: string | null;
}

interface MarketPrice {
  pair: string;
  pair_display: string;
  last_trade: number;
  bid: number;
  ask: number;
  change: number;
  trend: 'up' | 'down';
  volume: string;
  timestamp: number;
}
```

**Usage**:
```typescript
<LiveMarketPrices 
  marketPrices={prices}
  onRefresh={fetchPrices}
  lastUpdate={lastUpdated}
  error={error}
/>
```

### RecentAlertsTable

Table showing recent risk alerts.

**Location**: `src/components/dashboard/RecentAlertsTable.tsx`

**Props**:
```typescript
interface Props {
  alerts?: Array<{
    id: string;
    type: string;
    customer: string;
    wallet: string;
    riskScore: number;
    timestamp: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}
```

**Usage**:
```typescript
<RecentAlertsTable alerts={dashboardStats?.recentAlerts} />
```

### DashboardSidebar

Navigation sidebar.

**Location**: `src/components/dashboard/DashboardSidebar.tsx`

**Props**:
```typescript
interface Props {
  lastUpdated: string;
}
```

**Usage**:
```typescript
<DashboardSidebar lastUpdated={getTimeAgo()} />
```

## Creating New Components

### Basic Component Template

```typescript
import { FC, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MyComponentProps {
  title: string;
  children: ReactNode;
  isLoading?: boolean;
}

export const MyComponent: FC<MyComponentProps> = ({ 
  title, 
  children, 
  isLoading = false 
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
};
```

### Component with State

```typescript
import { FC, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SearchComponentProps {
  onSearch: (query: string) => void;
}

export const SearchComponent: FC<SearchComponentProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    onSearch(query);
  };

  return (
    <div className="flex gap-2">
      <Input 
        placeholder="Search..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <Button onClick={handleSearch}>Search</Button>
    </div>
  );
};
```

### Component with API Call

```typescript
import { FC, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DataComponentProps {
  id: string;
}

export const DataComponent: FC<DataComponentProps> = ({ id }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/data/${id}`);
        if (!response.ok) throw new Error('Failed to fetch');
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data</CardTitle>
      </CardHeader>
      <CardContent>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </CardContent>
    </Card>
  );
};
```

## Component Best Practices

### 1. Use Proper TypeScript Types

```typescript
// ✅ Good
interface ButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export const MyButton: FC<ButtonProps> = ({ onClick, disabled }) => {
  return <button onClick={onClick} disabled={disabled} />;
};

// ❌ Bad
export const MyButton = ({ onClick, disabled }) => {
  return <button onClick={onClick} disabled={disabled} />;
};
```

### 2. Memoize Components

```typescript
import { memo, FC } from 'react';

interface ExpensiveComponentProps {
  data: string;
}

export const ExpensiveComponent = memo<FC<ExpensiveComponentProps>>(
  ({ data }) => {
    return <div>{data}</div>;
  }
);

ExpensiveComponent.displayName = 'ExpensiveComponent';
```

### 3. Use useCallback for Handlers

```typescript
import { useCallback } from 'react';

export const SearchComponent = () => {
  const handleSearch = useCallback((query: string) => {
    // Expensive operation
  }, []);

  return <input onChange={(e) => handleSearch(e.target.value)} />;
};
```

### 4. Extract Logic into Custom Hooks

```typescript
// hooks/useWalletData.ts
export const useWalletData = (address: string) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWalletData(address).then(setData).finally(() => setLoading(false));
  }, [address]);

  return { data, loading };
};

// components/WalletInfo.tsx
export const WalletInfo: FC<{ address: string }> = ({ address }) => {
  const { data, loading } = useWalletData(address);
  
  if (loading) return <div>Loading...</div>;
  return <div>{JSON.stringify(data)}</div>;
};
```

## Component Styling

All components use Tailwind CSS. Important classes:

```typescript
// Layout
className="flex items-center justify-between"
className="grid grid-cols-2 md:grid-cols-4 gap-4"
className="space-y-4"

// Sizing
className="w-full h-10"
className="w-1/2 h-1/2"

// Responsive
className="text-sm md:text-base lg:text-lg"
className="p-4 md:p-6 lg:p-8"

// Colors
className="text-primary"
className="bg-destructive/10 text-destructive"
className="border border-border/50"

// Interactive
className="hover:bg-muted/50"
className="cursor-pointer transition-colors"
className="disabled:opacity-50 disabled:cursor-not-allowed"
```

## Testing Components

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('calls onClick handler', async () => {
    const handleClick = jest.fn();
    render(<MyComponent onClick={handleClick} />);
    
    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

## Component File Structure

```
src/components/
├── dashboard/
│   ├── KPICards.tsx
│   ├── RiskDistributionChart.tsx
│   ├── LiveMarketPrices.tsx
│   ├── RecentAlertsTable.tsx
│   ├── DashboardSidebar.tsx
│   └── index.ts                # Export all
├── analysis/
│   ├── WalletSearch.tsx
│   ├── RiskScore.tsx
│   ├── Portfolio.tsx
│   └── index.ts
├── reports/
│   ├── ReportGenerator.tsx
│   ├── PDFExport.tsx
│   └── index.ts
├── ui/                         # shadcn/ui components
│   ├── button.tsx
│   ├── card.tsx
│   ├── badge.tsx
│   └── ...
└── index.ts                    # Main export
```

## Common Patterns

### Loading State

```typescript
{isLoading ? (
  <div className="flex items-center justify-center py-8">
    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
  </div>
) : (
  <div>{content}</div>
)}
```

### Error State

```typescript
{error ? (
  <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
    <p className="text-destructive font-medium">Error</p>
    <p className="text-sm text-destructive/80">{error}</p>
  </div>
) : (
  <div>{content}</div>
)}
```

### Empty State

```typescript
{data.length === 0 ? (
  <div className="text-center py-8">
    <p className="text-muted-foreground">No data available</p>
  </div>
) : (
  <div>{content}</div>
)}
```