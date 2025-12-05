# Troubleshooting Guide

## Quick Diagnostics

Before troubleshooting, gather information:
```bash
# Check Node version
node --version

# Check npm version
npm --version

# Check current environment
echo $VITE_AWS_API_ENDPOINT

# Test internet connectivity
ping 8.8.8.8

# Check available disk space
df -h
```

---

## Installation Issues

### Issue: npm install fails

**Error**:
```
npm ERR! peer dep missing: react@18
npm ERR! peer dep missing: react-dom@18
```

**Solutions**:

Option 1 - Legacy peer deps:
```bash
npm install --legacy-peer-deps
```

Option 2 - Clear cache and retry:
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

Option 3 - Use npm 7+:
```bash
npm install -g npm@latest
npm install
```

---

### Issue: Module not found errors

**Error**:
```
Cannot find module '@/components/dashboard'
Module not found: 'react-router-dom'
```

**Solutions**:

1. Check path aliases in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

2. Reinstall dependencies:
```bash
rm -rf node_modules
npm install
```

3. Restart dev server:
```bash
# Stop server (Ctrl+C)
# Restart
npm run dev
```

---

### Issue: Port already in use

**Error**:
```
EADDRINUSE: address already in use :::5173
```

**Solutions**:

macOS/Linux:
```bash
# Find process
lsof -i :5173

# Kill process
kill -9 <PID>

# Or use different port
npm run dev -- --port 3000
```

Windows:
```bash
# Find process
netstat -ano | findstr :5173

# Kill process
taskkill /PID <PID> /F

# Or use different port
npm run dev -- --port 3000
```

---

## Runtime Errors

### Issue: "Failed to load customer data"

**Symptoms**: Red error banner on dashboard

**Causes**:
1. AWS API endpoint unreachable
2. API key invalid or expired
3. Network connectivity issue
4. API Gateway not deployed

**Diagnostics**:
```bash
# 1. Check endpoint configuration
cat .env | grep VITE_AWS_API_ENDPOINT

# 2. Test endpoint with curl
curl -X POST https://your-endpoint.execute-api.us-east-1.amazonaws.com/dev/customers \
  -H "Content-Type: application/json" \
  -d '{"query":"","query_type":"get_customers"}'

# 3. Check network connectivity
ping 8.8.8.8
curl https://www.google.com

# 4. Verify AWS credentials
aws sts get-caller-identity
```

**Solutions**:
1. Verify `.env` has correct `VITE_AWS_API_ENDPOINT`
2. Ensure API Gateway is deployed and active
3. Check Lambda functions are configured
4. Review CloudWatch logs for errors:
   ```bash
   aws logs tail /aws/lambda/customers-api --follow
   ```

---

### Issue: Market prices not updating

**Symptoms**: "No data available" or prices stuck at old values

**Causes**:
1. Luno API rate limit exceeded
2. Network timeout
3. Invalid Luno API key
4. Service temporarily down

**Diagnostics**:
```bash
# 1. Test Luno API directly
curl https://6duobrslvyityfkazhdl2e4cpu0qqacs.lambda-url.us-east-1.on.aws/ \
  -H "Content-Type: application/json" \
  -d '{}'

# 2. Check API status
curl https://www.luno.com/api/1/status

# 3. View browser console for errors
# F12 → Console tab → Look for red errors

# 4. Check rate limits
# Look for 429 (Too Many Requests) errors
```

**Solutions**:
1. Wait 60 seconds and refresh
2. Check Luno status at https://www.luno.com/status
3. Verify Luno API key is valid
4. Restart the app:
   ```bash
   # Stop dev server (Ctrl+C)
   npm run dev
   ```

---

### Issue: Search returns no results

**Symptoms**: Customer search finds nothing even after import

**Causes**:
1. Customer data not imported
2. Search filter too specific
3. Database sync delay
4. XML import failed silently

**Solutions**:

1. Check if data imported:
```bash
# Go to Data Import page
# Try importing sample XML again
# Check for success message
```

2. Try broader search:
```
Instead of "john.doe@company.com"
Try just "john"
```

3. Do hard refresh:
```bash
# Ctrl+Shift+Delete (Windows/Linux)
# Cmd+Shift+Delete (Mac)
# Clear browsing data for last hour
```

4. Check browser console:
```
F12 → Console tab
Look for API errors or failed requests
```

5. Verify data in database:
```bash
# Use AWS Console
# Go to S3 or DynamoDB
# Confirm customer data exists
```

---

## Performance Issues

### Issue: Page loads slowly (>5 seconds)

**Symptoms**: Dashboard takes long to load, UI feels sluggish

**Causes**:
1. Large customer dataset (1000+)
2. Slow internet connection
3. Unoptimized API responses
4. Browser memory leak

**Diagnostics**:
```bash
# 1. Check network tab
# F12 → Network → Reload
# Look for large requests or slow responses

# 2. Monitor performance
# F12 → Performance → Record → Reload → Stop
# Analyze flame chart

# 3. Check memory usage
# F12 → Memory tab
# Take heap snapshot, look for large objects

# 4. Check bundle size
npm run build
npm install -g webpack-bundle-analyzer
npm run build -- --analyze
```

**Solutions**:

1. Reduce customer dataset:
```typescript
// In Dashboard.tsx
const MAX_CUSTOMERS = 100; // Limit for testing
const filtered = customers.slice(0, MAX_CUSTOMERS);
```

2. Enable component memoization:
```typescript
import { memo } from 'react';
export const KPICards = memo(({ stats }) => {
  return <div>{/* ... */}</div>;
});
```

3. Clear browser cache:
```bash
# F12 → Application → Clear storage
# Or Ctrl+Shift+Delete
```

4. Test with different browser:
```bash
# Try Chrome, Firefox, Safari
# See if issue persists
```

---

### Issue: Animations are stuttering

**Symptoms**: Smooth animations appear choppy, jank observed

**Causes**:
1. Low frame rate
2. Too many re-renders
3. Heavy computations on main thread
4. GPU acceleration disabled

**Solutions**:

1. Check frame rate:
```bash
# F12 → Rendering → Rendering stats
# Should see 60 fps
```

2. Reduce animations:
```typescript
// In tailwind.config.ts
module.exports = {
  theme: {
    animation: {
      // Remove heavy animations
    }
  }
};
```

3. Use `will-change` CSS property:
```css
.animated-element {
  will-change: transform;
}
```

---

## Browser Issues

### Issue: TypeScript errors in IDE

**Symptoms**: Red squiggles, "Cannot find module" in VS Code

**Solutions**:

1. Restart TypeScript server:
```
VS Code: Ctrl+Shift+P
Type: "TypeScript: Restart TS Server"
Press Enter
```

2. Regenerate types:
```bash
npm install
```

3. Check tsconfig.json:
```bash
cat tsconfig.json | grep -A5 '"paths"'
```

4. Clear cache:
```bash
rm -rf node_modules .vite dist
npm install
npm run dev
```

---

### Issue: CSS not loading

**Symptoms**: Page appears unstyled, no colors or spacing

**Causes**:
1. Tailwind CSS not compiled
2. CSS import missing from main.tsx
3. Build cache issue

**Solutions**:

1. Verify CSS import in `src/main.tsx`:
```typescript
import './index.css'
```

2. Rebuild CSS:
```bash
npm run dev
```

3. Clear build artifacts:
```bash
rm -rf dist node_modules
npm install
npm run dev
```

4. Check Tailwind config:
```bash
cat tailwind.config.ts
```

---

### Issue: Hot reload not working

**Symptoms**: Page doesn't update when files change

**Solutions**:

1. Stop and restart server:
```bash
# Ctrl+C
npm run dev
```

2. Clear node_modules:
```bash
rm -rf node_modules
npm install
npm run dev
```

3. Check file watcher limit (Linux):
```bash
# Increase watch limit
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

---

## API Issues

### Issue: 401 Unauthorized errors

**Error**:
```json
{
  "error": "Unauthorized",
  "message": "Invalid API key"
}
```

**Solutions**:

1. Verify API key:
```bash
# Check .env file
cat .env | grep API_KEY
```

2. Test API directly:
```bash
# Etherscan
curl "https://api.etherscan.io/api?module=account&action=balance&address=0x...&apikey=YOUR_KEY"

# Luno
curl -H "Authorization: Bearer YOUR_KEY" https://api.luno.com/...
```

3. Regenerate API key:
- Etherscan: https://etherscan.io/apis
- Luno: https://www.luno.com/settings/api

---

### Issue: Rate limiting (429 errors)

**Error**:
```json
{
  "error": "Too many requests",
  "status": 429
}
```

**Solutions**:

1. Wait before retrying:
```bash
# Wait 60 seconds
# Then refresh the page
```

2. Check request frequency:
```typescript
// In hooks/useCustomers.ts
// Increase polling interval from 30s to 60s
const POLL_INTERVAL = 60000;
```

3. Reduce API calls:
```typescript
// Add request debouncing
import { debounce } from 'lodash';

const debouncedSearch = debounce((query) => {
  fetchCustomers(query);
}, 500);
```

---

## Database Issues

### Issue: "Database connection error"

**Error**:
```
Failed to connect to database
Timeout waiting for connection
```

**Solutions**:

1. Check AWS credentials:
```bash
aws sts get-caller-identity
```

2. Verify security group:
```bash
aws ec2 describe-security-groups --group-ids sg-xxxxx
```

3. Test database connection:
```bash
# If using RDS
mysql -h your-db-host -u username -p

# If using DynamoDB
aws dynamodb list-tables
```

---

## Memory Issues

### Issue: "Out of memory" errors

**Error**:
```
FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed
```

**Solutions**:

1. Increase Node memory:
```bash
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

2. Check for memory leaks:
```bash
# Run memory profiler
node --inspect-brk node_modules/.bin/vite build

# Visit chrome://inspect in Chrome
```

3. Optimize dependencies:
```bash
# Check bundle size
npm run build
npx webpack-bundle-analyzer dist/stats.json
```

---

## Debug Mode

Enable detailed logging:

```typescript
// Create utils/debug.ts
export const DEBUG = process.env.VITE_DEBUG === 'true';

export const log = (title: string, data: any) => {
  if (DEBUG) {
    console.log(`[${title}]`, data);
  }
};
```

Usage:
```bash
VITE_DEBUG=true npm run dev
```

---

## Getting Help

If issue persists:

1. **Check logs**:
```bash
# Browser console
F12 → Console

# Server logs
npm run dev
```

2. **Search documentation**:
   - [INSTALLATION.md](INSTALLATION.md)
   - [API.md](API.md)
   - [FAQ.md](FAQ.md)

3. **Contact support**:
   - Email: support@yourcompany.com
   - Phone: +27-123-456-7890

4. **Report bug**:
   - GitHub Issues (if using GitHub)
   - Include error message, steps to reproduce, browser/OS info

---

**Last Updated**: December 2025