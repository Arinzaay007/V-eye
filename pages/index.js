const nextConfig = { reactStrictMode: true }
module.exports = nextConfig
```
- `.gitignore` → paste:
```
node_modules
.next
.env.local
```

**Step 2 — Deploy to Vercel**

1. Go to [vercel.com](https://vercel.com) → sign in with GitHub
2. Click **Add New Project**
3. Import your `veye` repo
4. Click **Deploy** — Vercel auto-detects Next.js

**Step 3 — Add environment variables**

After deploy, go to Vercel → your project → **Settings → Environment Variables** and add:
```
NEXT_PUBLIC_SUPABASE_URL      → your Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY → your Supabase anon key (not service role)
