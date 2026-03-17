# Plant Manager V2

AI-powered local plant discovery and planning platform. Browse plants by region and supplier, upload inventory via CSV/Excel, and chat with an AI assistant for plant recommendations.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL via Prisma 7
- **Auth**: Clerk
- **AI**: Anthropic Claude
- **Hosting**: Vercel

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in all values:

```bash
cp .env.example .env.local
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | From [Clerk dashboard](https://dashboard.clerk.com) |
| `CLERK_SECRET_KEY` | From [Clerk dashboard](https://dashboard.clerk.com) |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |
| `ANTHROPIC_API_KEY` | From [Anthropic console](https://console.anthropic.com) |

### 3. Set up the database

```bash
npx prisma migrate dev --name init
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploying to Vercel

### Step 1: Create a PostgreSQL database

[Neon](https://neon.tech) is recommended — it has a generous free tier and integrates directly with Vercel.

1. Create a Neon project at [neon.tech](https://neon.tech)
2. Copy the connection string (use the **pooled** connection string for Vercel)

### Step 2: Create the initial database migration

With `DATABASE_URL` set in your `.env.local`, generate and apply the migration:

```bash
npx prisma migrate dev --name init
```

This creates `prisma/migrations/` — **commit this folder to git**.

### Step 3: Configure Clerk for production

1. In your Clerk dashboard, create a **production** instance
2. Add your Vercel deployment URL to the allowed origins
3. Copy the production `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`

### Step 4: Push to GitHub

Ensure `prisma/migrations/` is committed and push to GitHub.

### Step 5: Deploy on Vercel

1. Import your GitHub repo at [vercel.com/new](https://vercel.com/new)
2. Add all environment variables from `.env.example` (using production values)
3. Vercel will automatically use `vercel.json` — the build command runs `prisma migrate deploy` before `next build`

> **Note**: The Vercel build command is set in `vercel.json` as `npx prisma migrate deploy && npm run build`.

### Admin access

To grant a user admin access, set `role: "admin"` in their Clerk `publicMetadata` via the Clerk dashboard → Users → select user → Metadata.
