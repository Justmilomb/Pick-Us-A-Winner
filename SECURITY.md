# Security System Documentation

## Overview

This document describes the security measures implemented to protect the Giveaway Engine from abuse and unauthorized access.

## Protection Layers

### 1. Rate Limiting

All API endpoints have rate limiting applied:

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| Global (all /api) | 100 requests | 15 minutes |
| Instagram Comments | 5 requests | 1 hour |
| Giveaway Creation | 3 requests | 1 hour |
| Email Sending | 10 requests | 1 hour |
| Image Generation | 20 requests | 1 hour |

### 2. Credit System

Expensive operations (Instagram API calls) require credits:

- **Free Credits:** 2 per IP address (lifetime)
- **Purchased Credits:** Added via payment tokens

**Credit Flow:**
1. User checks credits: `GET /api/credits`
2. If no credits, user must purchase and receive a token
3. User redeems token: `POST /api/credits/redeem`
4. User can now make API calls

### 3. Usage Tracking

Every IP is tracked for:
- Total requests
- Instagram API calls
- Giveaways created
- Emails sent
- Images generated
- Suspicious activity flags

Data is stored in `security-data.json`.

### 4. Automatic Blocking

IPs are automatically blocked if:
- They exceed 50 requests (suspicious threshold: 10)
- Block duration: 24 hours
- Blocks are lifted automatically after expiry

### 5. Admin Protection

Admin endpoints require the `x-admin-key` header:

```bash
curl -H "x-admin-key: YOUR_ADMIN_KEY" http://localhost:5000/api/analytics
```

Protected endpoints:
- `GET /api/analytics` - View all giveaway stats
- `POST /api/admin/generate-token` - Generate purchase tokens
- `GET /api/admin/security` - View security statistics

## API Endpoints

### Public Endpoints

#### Check Credits
```
GET /api/credits
```
Returns:
```json
{
  "credits": 7,
  "freeCreditsRemaining": 2,
  "hasCredits": true
}
```

#### Redeem Token
```
POST /api/credits/redeem
Content-Type: application/json

{"token": "PAY_xxx-xxx-xxx"}
```
Returns:
```json
{
  "success": true,
  "creditsAdded": 10,
  "totalCredits": 12
}
```

#### Validate Instagram URL (Free)
```
POST /api/instagram/validate
Content-Type: application/json

{"url": "https://instagram.com/p/ABC123/"}
```
Does NOT consume credits.

#### Fetch Instagram Comments (Costs 1 Credit)
```
POST /api/instagram/comments
Content-Type: application/json

{"url": "https://instagram.com/p/ABC123/"}
```
**Requires credits.** Returns 402 if no credits available.

Demo mode (free):
```json
{"url": "...", "demo": true}
```

### Admin Endpoints

#### Generate Purchase Token
```
POST /api/admin/generate-token
x-admin-key: YOUR_ADMIN_KEY
Content-Type: application/json

{"credits": 10}
```
Returns:
```json
{
  "token": "PAY_xxx-xxx-xxx",
  "credits": 10
}
```

#### View Security Stats
```
GET /api/admin/security
x-admin-key: YOUR_ADMIN_KEY
```
Returns:
```json
{
  "totalTrackedIPs": 42,
  "blockedIPs": 2,
  "suspiciousIPs": 5,
  "totalInstagramCalls": 156,
  "totalPurchaseTokens": 20,
  "usedPurchaseTokens": 15
}
```

## Configuration

### Environment Variables

```env
# Required for admin endpoints
ADMIN_API_KEY=your_secure_random_key_here
```

### Adjusting Limits

Edit `server/security.ts` and modify the `CONFIG` object:

```typescript
const CONFIG = {
  GLOBAL_RATE_LIMIT: 100,
  INSTAGRAM_RATE_LIMIT: 5,
  FREE_CREDITS_PER_IP: 2,
  CREDITS_PER_PURCHASE: 10,
  // ... etc
};
```

## Best Practices

1. **Keep ADMIN_API_KEY secret** - Never commit it to version control
2. **Monitor security stats** - Check `/api/admin/security` regularly
3. **Review blocked IPs** - Check `security-data.json` for false positives
4. **Backup security data** - Include `security-data.json` in backups

## Integration with Payment

To integrate with a payment provider:

1. User completes payment
2. Your payment webhook calls `/api/admin/generate-token`
3. Return the token to the user
4. User redeems token via `/api/credits/redeem`

Example Stripe webhook handler:
```javascript
app.post('/webhook/stripe', async (req, res) => {
  const event = req.body;
  if (event.type === 'checkout.session.completed') {
    // Generate token
    const response = await fetch('/api/admin/generate-token', {
      method: 'POST',
      headers: {
        'x-admin-key': process.env.ADMIN_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ credits: 10 })
    });
    const { token } = await response.json();
    // Send token to customer via email
  }
});
```

---

*Security system implemented by Mark on 2026-01-28*
