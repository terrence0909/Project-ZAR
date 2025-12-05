# Installation & Setup Guide

## System Requirements

- **Node.js**: 18.0.0 or higher
- **npm**: 9.0.0 or higher
- **Git**: 2.40.0 or higher
- **RAM**: Minimum 4GB recommended
- **Disk Space**: 500MB minimum
- **OS**: Windows, macOS, or Linux

## Step-by-Step Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/project-zar.git
cd project-zar
```

### 2. Install Dependencies

```bash
npm install
```

If you encounter peer dependency warnings, use:
```bash
npm install --legacy-peer-deps
```

### 3. Environment Setup

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
VITE_ETHERSCAN_API_KEY=your_key_here
VITE_LUNO_API_KEY=your_key_here
VITE_AWS_API_ENDPOINT=https://your-endpoint.execute-api.us-east-1.amazonaws.com/dev
```

### 4. Start Development Server

```bash
npm run dev
```

Output will show:
```
  VITE v5.0.0  ready in 234 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

### 5. Open in Browser

Navigate to `http://localhost:5173/`

## Available Commands

```bash
# Development
npm run dev          # Start dev server with hot reload

# Building
npm run build        # Create production build
npm run preview      # Preview production build locally

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # Check TypeScript types

# Cleanup
npm run clean        # Remove dist and node_modules
```

## Getting API Keys

### Etherscan API Key

1. Go to https://etherscan.io/apis
2. Create a free account or login
3. Create a new API key
4. Copy the API key
5. Add to `.env`:
   ```env
   VITE_ETHERSCAN_API_KEY=your_key
   ```

### Luno API Key

1. Go to https://www.luno.com/api
2. Login or create account
3. Generate API key in settings
4. Copy API key and secret
5. Add to `.env`:
   ```env
   VITE_LUNO_API_KEY=your_key
   ```

### AWS API Endpoint

1. Deploy Lambda functions (see [DEPLOYMENT.md](DEPLOYMENT.md))
2. Get API Gateway endpoint URL
3. Add to `.env`:
   ```env
   VITE_AWS_API_ENDPOINT=https://xxxxx.execute-api.us-east-1.amazonaws.com/dev
   ```

## Project Structure

```
project-zar/
├── src/
│   ├── components/
│   │   ├── analysis/        # Wallet analysis UI
│   │   ├── dashboard/       # Dashboard widgets
│   │   ├── reports/         # Report components
│   │   └── ui/              # shadcn/ui components
│   ├── pages/
│   │   ├── Index.tsx        # Home page
│   │   ├── Dashboard.tsx    # Main dashboard
│   │   ├── Customers.tsx    # Customer list
│   │   ├── Settings.tsx     # Settings page
│   │   └── ...
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility functions
│   ├── App.tsx              # Root component
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
├── docs/                    # Documentation
├── public/                  # Static assets
├── .env.example             # Environment template
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript config
├── vite.config.ts           # Vite config
└── tailwind.config.ts       # Tailwind config
```

## Troubleshooting

### Issue: `npm install` fails

**Error**: `npm ERR! peer dep missing`

**Solutions**:
```bash
# Option 1: Legacy peer deps
npm install --legacy-peer-deps

# Option 2: Clear npm cache
npm cache clean --force
npm install

# Option 3: Update npm
npm install -g npm@latest
npm install
```

### Issue: Port 5173 already in use

**Error**: `EADDRINUSE: address already in use :::5173`

**Solutions**:
```bash
# Option 1: Use different port
npm run dev -- --port 3000

# Option 2: Kill process using port
# macOS/Linux:
lsof -ti:5173 | xargs kill -9

# Windows:
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### Issue: Module not found errors

**Error**: `Cannot find module '@/components/...'`

**Solution**: Check `tsconfig.json` has correct path alias:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Issue: TypeScript errors in IDE

**Error**: Red squiggly lines in VS Code

**Solution**:
```bash
# Restart TypeScript server:
# VS Code: Ctrl+Shift+P → "TypeScript: Restart TS Server"

# Or reinstall types:
npm install
```

### Issue: API calls returning 401

**Error**: `Unauthorized - Invalid API key`

**Solution**:
1. Verify `.env` file has correct API keys
2. Check API key hasn't expired
3. Test API key:
   ```bash
   curl -H "X-API-Key: your_key" https://api.etherscan.io/api?module=account&action=balance
   ```
4. Regenerate key if needed

### Issue: Hot reload not working

**Error**: Page doesn't refresh when files change

**Solution**:
```bash
# Stop server (Ctrl+C)
# Clear node_modules
rm -rf node_modules

# Reinstall
npm install

# Restart
npm run dev
```

## Browser Compatibility

| Browser | Minimum Version | Status |
|---------|-----------------|--------|
| Chrome | 90+ | ✅ Supported |
| Firefox | 88+ | ✅ Supported |
| Safari | 14+ | ✅ Supported |
| Edge | 90+ | ✅ Supported |
| Mobile Safari | 14+ | ✅ Supported |
| Chrome Mobile | 90+ | ✅ Supported |

## Development Tools

### Recommended VS Code Extensions

1. **ES7+ React/Redux/React-Native snippets**
   - Install: `dsznajder.es7-react-js-snippets`

2. **TypeScript Vue Plugin**
   - Install: `Vue.volar`

3. **Tailwind CSS IntelliSense**
   - Install: `bradlc.vscode-tailwindcss`

4. **Prettier**
   - Install: `esbenp.prettier-vscode`

5. **ESLint**
   - Install: `dbaeumer.vscode-eslint`

### Setup VS Code

Create `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}
```

## Next Steps

1. Read [CONFIGURATION.md](CONFIGURATION.md) to customize settings
2. Check [API.md](API.md) to understand available endpoints
3. Review [COMPONENTS.md](COMPONENTS.md) to learn the component structure
4. Start building! 🚀