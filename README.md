# Meta Labs Research Site

Next.js storefront and COA library with Square checkout and active-product sync.

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Key Features

1. Active product catalog with deduped compounds and variant options.
2. Inventory-aware variant model (`stockQuantity`, `backorder`, `restockDate`).
3. Out-of-stock handling with notify request capture.
4. Square checkout integration.
5. COA aggregation with source-site priority plus Janoshik fallback for missing catalog compounds.
6. Health endpoint and uptime check script.
7. Legal policy pages (`/legal/terms`, `/legal/privacy`, `/legal/shipping-returns`).
8. Research-use gate acknowledgment required before checkout.
9. USPS service-alert block on home page (live parse with fallback link).
10. Order Hub dashboard at `/order-hub` with status cards, filters, and revenue.
11. Admin Orders Management at `/admin/orders` with COGS inputs and tax CSV exports.
12. FAQ page at `/faq` for policies, checkout, and operations support.

## Current Inventory Source

The storefront list is currently pinned to the products in:

1. `C:\\Users\\justi\\Downloads\\price_generator.xlsx`

Generated output:

1. `data/products.json`

## Product Data Sync

Sync products from source feed:

```bash
npm run products:sync
```

Defaults:

1. `PRODUCT_SCOPE=active` (only currently active/listed source products)
2. `FORCE_OUT_OF_STOCK=true` (keeps all variants out-of-stock until manually changed)

Output file:

1. `data/products.json`

## Operational Scripts

1. `npm run build` - Production build
2. `npm run start` - Run production server
3. `npm run monitor:uptime` - Hit `/api/health` and log result
4. `npm run coas:janoshik` - Refresh Janoshik COA payload
5. `npm run coas:site` - Refresh site COA payload

## API Endpoints

1. `POST /api/checkout` - Create Square checkout link
2. `POST /api/notify` - Save out-of-stock notification requests
3. `GET /api/health` - Runtime and catalog health snapshot

## Environment

See `.env.example` for full list.

Core variables:

1. `NEXT_PUBLIC_SITE_URL`
2. `SQUARE_ACCESS_TOKEN`
3. `SQUARE_LOCATION_ID`
4. `SQUARE_ENVIRONMENT`
5. `PRODUCT_SCOPE`
6. `FORCE_OUT_OF_STOCK`
7. `ENABLE_FILE_LOGS`
8. `UPTIME_MONITOR_URL`
9. `ORDER_HUB_ACCESS_KEY` (required for `/order-hub` and `/admin/orders`)
10. `ORDER_HUB_AUTH_TTL_SECONDS` (admin login cookie duration in seconds; default 900)

Admin tax endpoints:

1. `POST /api/admin/orders/cogs` - Save per-order COGS value
2. `GET /api/admin/orders/export-csv?scope=paid|all` - Download CSV for tax paperwork

Order filtering:

1. `ORDER_HUB_HIDE_SAMPLE_ORDERS=true` hides likely sample/test orders from dashboards
2. Optional local exclusions file: `data/order-exclusions.json`
3. Supported keys in `data/order-exclusions.json`:
4. `orderIds` or `paymentIds`: Square payment IDs to hide
5. `customerEmails`: customer emails to hide
6. `displayIds`: visible Order IDs (for example `RDR-XXXX` or `#RDR-XXXX`) to hide
7. `displayIdPrefixes`: Order ID prefixes to hide in bulk (for example `RDR-`)

## Production Cutover

Use:

1. `docs/production-checkout-cutover.md`
