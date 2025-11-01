# Database Seeding Instructions

This project includes a seed script to populate your Convex database with event data from the CSV and TXT files in the `/assets` folder.

## How It Works

The seeding process is split into two parts:

1. **`lib/seed-data.ts`** - Parses the CSV and TXT files, extracts artist data
2. **`convex/http.ts`** - HTTP endpoint that receives the parsed data
3. **`convex/seedMutation.ts`** - Internal mutation that inserts data into the database

## Prerequisites

1. Make sure Convex is running: `pnpm dev:backend` or `pnpm convex dev`
2. Make sure you have `tsx` installed: `pnpm add -D tsx`
3. Ensure your `.env.local` has `NEXT_PUBLIC_CONVEX_URL` set

## Running the Seed Script

```bash
pnpm seed
```

This will:
- Parse `assets/ticketmaster.csv` and `assets/artist_bios.txt`
- Send the parsed data to your Convex HTTP endpoint at `/seed`
- Create:
  - 5 categories (Concerts, Sports, Arts & Theater, Comedy, Family)
  - 8 venues (one in each Pakistani city)
  - 21 artists with their bios
  - ~52 events (2-3 per artist in different cities)
  - ~156 ticket types (3 per event: General, VIP, Premium)

## What Gets Created

### Categories
- Concerts
- Sports
- Arts & Theater
- Comedy
- Family

### Venues
One venue in each city:
- Arts Council (Karachi)
- Neon Square (Lahore)
- National Arts Council (Islamabad)
- Chenab Club (Faisalabad)
- Multan Cricket Stadium (Multan)
- Uptown Sports Arena (Peshawar)
- Anwar Club (Sialkot)
- Quetta Stadium (Quetta)

### Artists
21 artists from the CSV including:
- Tate McRae (Pop)
- Demi Lovato (Pop)
- Paul McCartney (Pop)
- The O'Jays (R&B)
- The Spinners (R&B)
- Lady A (Country)
- Billy Joel (Pop)
- Childish Gambino (Hip-Hop)
- keshi (Alternative)
- New Kids On the Block (Pop)
- Phoenix Suns (Basketball)
- Golden State Warriors (Basketball)
- Portland Trail Blazers (Basketball)
- Sacramento Kings (Basketball)
- Hamilton (Musical Theatre - multiple productions)
- Harry Potter and the Cursed Child (Drama)
- Cats: The Jellicle Ball (Musical Theatre)
- Sarah Millican (Stand-Up)
- Joe Gatto (Stand-Up)

### Events
- 2-3 events per artist across different cities
- Event dates: 30-180 days in the future
- Ticket prices: 2,000-13,000 PKR
- First 5 artists are featured
- 30% of events have presale access (code: NEXUS2025)

### Ticket Types (per event)
- **General Admission** - Base price, 500 tickets
- **VIP Package** - 2.5x base price, 100 tickets (includes Meet & Greet, Merchandise, Bar Access)
- **Premium Seating** - 1.5x base price, 200 tickets (includes Reserved Seating, Express Entry)

## Re-running the Seed Script

⚠️ **Warning**: Running the seed script multiple times will create duplicate data. If you want to re-seed:

1. Clear your Convex database first (from the Convex dashboard)
2. Run `pnpm seed` again

## Troubleshooting

### "NEXT_PUBLIC_CONVEX_URL environment variable is not set"
Make sure your `.env.local` file has:
```
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

### "Failed to seed database"
- Ensure Convex is running (`pnpm dev:backend`)
- Check the Convex dashboard logs for errors
- Verify your schema is up to date

### "Cannot find module 'tsx'"
Run: `pnpm add -D tsx`

