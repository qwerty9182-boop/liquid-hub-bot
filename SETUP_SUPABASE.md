# Supabase Setup for LIQUID HUB

This guide explains how to move the LIQUID HUB product catalog to Supabase.

## 1. Create a Supabase Project

1. Open [Supabase](https://supabase.com/).
2. Sign in or create an account.
3. Click **New project**.
4. Choose an organization.
5. Enter a project name, for example:

```text
liquid-hub
```

6. Create a database password and save it somewhere safe.
7. Choose the closest region.
8. Wait until Supabase finishes creating the project.

## 2. Open SQL Editor

1. Open the Supabase project.
2. In the left menu, open **SQL Editor**.
3. Click **New query**.

## 3. Create the Products Table

Copy and run the SQL from:

```text
supabase/migrations/001_create_products.sql
```

This creates the `products` table, indexes, and automatic `updated_at` updates.

## 4. Add Initial Products

Open a new SQL query and run:

```text
supabase/seed.sql
```

This inserts the current LIQUID HUB products.

You can run the seed again later: existing rows with the same `id` will be updated, not duplicated.

## 5. Get SUPABASE_URL

1. In Supabase, open **Project Settings**.
2. Open **API**.
3. Copy **Project URL**.

It looks like:

```text
https://xxxxxxxxxxxx.supabase.co
```

Add it to Railway as:

```env
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
```

## 6. Get Service Role Key

1. In Supabase, open **Project Settings**.
2. Open **API**.
3. Copy the **service_role** key.

Add it to Railway as:

```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Important: never put `SUPABASE_SERVICE_ROLE_KEY` into Cloudflare, frontend files, GitHub, or `config.js`.

## 7. Add Railway Variables

Open Railway project -> **Variables** and add:

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

The backend needs these variables to load products and validate orders.

## 8. Add a New Product

Open Supabase -> **Table Editor** -> `products` -> **Insert row**.

Fill at least:

- `name`
- `price`
- `in_stock`

Recommended fields:

- `brand`
- `description`
- `category`
- `image_url`
- `sort_order`

## 9. Change a Price

Open the product row and edit:

```text
price
```

The Mini App will see the new price after the short backend cache expires, usually within 30-60 seconds.

## 10. Hide a Product

Set:

```text
in_stock = false
```

The product will disappear from the Mini App and cannot be ordered.

## 11. Set Quantity

Use:

```text
stock_quantity
```

Leave it empty for unlimited/unknown stock.

Set it to a number to limit how many units can be ordered.

## 12. Change Product Order

Edit:

```text
sort_order
```

Lower numbers appear first.

Example:

```text
10, 20, 30, 40
```

This leaves room to insert products between existing ones later.

## 13. Add an Image

Put a public image URL into:

```text
image_url
```

The URL must be accessible publicly from the browser.

## 14. Test

1. Deploy the Railway backend.
2. Open:

```text
https://YOUR-RAILWAY-DOMAIN/api/products
```

You should see:

```json
{
  "success": true,
  "products": []
}
```

3. Open the Telegram Mini App.
4. Confirm that products load.
5. Change a price in Supabase.
6. Wait 30-60 seconds.
7. Reopen or reload the Mini App and confirm the price changed.
8. Place a test order and confirm the manager receives the recalculated total.
