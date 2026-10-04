# 🐰 Casey — DIY Phone Case Studio

Design-your-own phone case, Canva-style. A **storefront** where customers design
their case and send it to you (no checkout — you follow up to sort printing and
delivery), plus an **admin dashboard** to control the front page, curate the case
gallery, and manage that inbox and orders.

> **Design it. Print it. Love it.** — 100% you, 100% Casey 💗

## What's in the box

| Folder         | What it is                        | Stack                                   |
| -------------- | ---------------------------------- | --------------------------------------- |
| `storefront/`  | Customer-facing design site (web)  | Vite · React · TypeScript               |
| `admin/`       | Admin dashboard (web)              | Vite · React · TypeScript               |
| `supabase/`    | Database schema + seed             | Postgres (Supabase)                     |

Both apps run **fully in local/demo mode with no backend** so you can try
everything immediately. Add Supabase keys to switch on live design submissions,
accounts, and orders.

---

## 1. Run the storefront

```bash
cd storefront
npm install
npm run dev          # open the printed http://localhost:5173
```

Home page (gallery, phone picker) → Editor (canvas: backgrounds, stickers, text,
photo upload, drag / resize / rotate) → **Send to Casey** (collects name/email/
phone + the design, no payment).

## 2. Run the admin dashboard

```bash
cd admin
npm install
npm run dev          # open the printed http://localhost:5173 (or next free port)
```

Runs in **demo mode** with sample data out of the box. Pages: Overview · Front Page
editor · Customer Designs (storefront submissions needing follow-up show at the
top) · Gallery (template management) · Orders (with status control).

## 3. Connect the backend (optional, when you're ready)

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run `supabase/schema.sql` then `supabase/seed.sql`.
3. Add credentials to `storefront/.env` and `admin/.env` (copy from each
   `.env.example`).
4. Make yourself an admin: sign up in the dashboard, then in Supabase SQL run:
   ```sql
   insert into admins (user_id, email)
   select id, email from auth.users where email = 'you@email.com';
   ```

Once connected: storefront submissions land in **Designs** (with contact info and
a new/contacted/done status), templates are managed in **Gallery**, and edits in
**Front Page** drive what customers see.

## Deploying

Both apps build and deploy together as a single Cloudflare Worker, with admin
served at `/admin`:

```bash
npm run deploy        # from the repo root
```

## Roadmap / next steps

- 🧑‍🎨 Admin: manage sticker packs / templates / catalog from the dashboard
- 🎟️ QR pickup codes for the in-mall Casey machine
- 📦 Wire the dashboard up to a real order/fulfillment source

---

Made with 💗 — Love. Print. Stan. Repeat.
