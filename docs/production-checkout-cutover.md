# Square Production Cutover Checklist

Use this checklist when switching from Square Sandbox to live checkout.

## 1. Pre-Cutover

1. Confirm your Square account has completed business verification.
2. Confirm the production location is active in Square Dashboard.
3. Confirm bank payout settings are complete.
4. Confirm tax, shipping, and policy pages are live on your site.

## 2. Environment Variables

Set these values in your production environment:

1. `SQUARE_ACCESS_TOKEN` = production token (not sandbox token)
2. `SQUARE_LOCATION_ID` = production location ID
3. `SQUARE_ENVIRONMENT=production`
4. `SQUARE_API_VERSION=2024-11-20` (or current approved version)
5. `NEXT_PUBLIC_SITE_URL` = your live domain URL

## 3. Smoke Tests

1. Run `npm run build` and ensure no errors.
2. Start the app in production mode and verify:
   - `/api/health` returns `status: "ok"`
   - Product detail pages render all active variants
   - Out-of-stock items block checkout with status `409`
3. Complete one live low-value test order.
4. Verify order appears in Square Dashboard.
5. Verify refund path works on the test order.

## 4. Monitoring

1. Enable periodic health checks:
   - `npm run monitor:uptime`
2. Watch app log output and `data/logs/app.log` for checkout or notify errors.
3. Set an alert when `/api/health` fails.

## 5. Rollback Plan

If checkout fails after cutover:

1. Switch `SQUARE_ENVIRONMENT` back to `sandbox`.
2. Restore sandbox `SQUARE_ACCESS_TOKEN` and `SQUARE_LOCATION_ID`.
3. Redeploy.
4. Re-run smoke tests.
