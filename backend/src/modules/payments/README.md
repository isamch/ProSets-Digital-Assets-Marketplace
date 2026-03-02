# Payments Module

This module handles payment processing using Stripe Checkout for the ProSets marketplace.

## Features

- ✅ Stripe Checkout Session creation
- ✅ Server-side price calculation (security)
- ✅ Asset ownership validation
- ✅ Duplicate purchase prevention
- ✅ Webhook handling for payment events
- ✅ Order and earnings creation
- ✅ Platform fee calculation (10%)

## Security Features

- **Price Validation**: All prices calculated from database, never trust frontend
- **Asset Validation**: Verify assets exist and are active
- **Ownership Check**: Prevent users from buying their own assets
- **Duplicate Prevention**: Check if user already owns assets
- **Webhook Verification**: Stripe signature verification for webhooks

## API Endpoints

### Protected Endpoints (Authenticated Users)

#### POST /payments/create-checkout-session
Create a Stripe Checkout session for purchasing assets

**Body:**
```json
{
  "assetIds": ["asset-id-1", "asset-id-2"],
  "successUrl": "https://yourapp.com/success?session_id={CHECKOUT_SESSION_ID}",
  "cancelUrl": "https://yourapp.com/cancel"
}
```

**Response:**
```json
{
  "statusCode": 201,
  "message": "Checkout session created successfully",
  "data": {
    "sessionId": "cs_test_...",
    "checkoutUrl": "https://checkout.stripe.com/pay/cs_test_..."
  }
}
```

#### GET /payments/session/:sessionId
Get checkout session details

#### POST /payments/handle-success?session_id=cs_test_...
Handle successful payment (usually called from success URL)

### Public Endpoints (Webhooks)

#### POST /payments/webhook/stripe
Stripe webhook endpoint for payment events

## Payment Flow

1. **User selects assets** to purchase
2. **Frontend calls** `POST /payments/create-checkout-session`
3. **Backend validates** assets and calculates prices from database
4. **Stripe Checkout Session** is created with metadata
5. **User is redirected** to Stripe Checkout
6. **User completes payment** on Stripe
7. **Stripe sends webhook** to `/payments/webhook/stripe`
8. **Backend processes webhook** and creates order
9. **User is redirected** to success URL

## Environment Variables

```env
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

## Webhook Events Handled

- `checkout.session.completed` - Creates order when payment is successful
- `payment_intent.succeeded` - Additional processing for successful payments
- `payment_intent.payment_failed` - Handle failed payments

## Database Operations

When payment is successful, the system:

1. **Creates Order** with unique order number
2. **Creates OrderItems** for each purchased asset
3. **Creates Earnings** records for sellers with platform fee (10%)
4. **Updates payment status** to SUCCEEDED

## Usage Examples

### Create Checkout Session
```typescript
const checkoutData = {
  assetIds: ['asset-1', 'asset-2'],
  successUrl: 'https://myapp.com/success?session_id={CHECKOUT_SESSION_ID}',
  cancelUrl: 'https://myapp.com/cancel'
};

const response = await fetch('/payments/create-checkout-session', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(checkoutData)
});

const { data } = await response.json();
// Redirect user to data.checkoutUrl
window.location.href = data.checkoutUrl;
```

### Handle Success Page
```typescript
// On success page, extract session_id from URL
const urlParams = new URLSearchParams(window.location.search);
const sessionId = urlParams.get('session_id');

if (sessionId) {
  // Process the successful payment
  await fetch(`/payments/handle-success?session_id=${sessionId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
}
```

## Error Handling

The module handles various error scenarios:

- **Asset not found**: Returns 404 if assets don't exist or are inactive
- **Own asset purchase**: Prevents users from buying their own assets
- **Duplicate purchase**: Prevents buying already owned assets
- **Invalid session**: Handles invalid or expired Stripe sessions
- **Webhook verification**: Validates Stripe webhook signatures

## Platform Fee Structure

- **Platform Fee**: 10% of asset price
- **Seller Earning**: 90% of asset price
- **Example**: $10 asset = $1 platform fee + $9 seller earning