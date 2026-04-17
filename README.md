# CardCraft AI

AI-powered flashcard generator with spaced repetition.

CardCraft AI helps learners turn study material into reviewable flashcards, organize content into decks, and retain knowledge using a spaced repetition workflow inspired by the SM-2 algorithm. It combines AI-assisted card generation with a lightweight study experience built for fast iteration and daily review.

## ✨ Features

- AI flashcard generation from text/PDF
- Spaced repetition (SM-2 algorithm)
- Deck management
- Study mode
- User authentication

## 🛠️ Tech Stack

- Next.js 16
- TypeScript
- Prisma + PostgreSQL
- NextAuth.js
- OpenAI API
- shadcn/ui

## 📋 Prerequisites

Before running the project locally, make sure you have:

- Node.js 18+
- PostgreSQL database
- OpenAI API key

It is also recommended to have `npm` and a running local or hosted PostgreSQL instance available before starting setup.

## 🚀 Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy the environment template:

   ```bash
   cp .env.example .env
   ```

4. Set up your environment variables in `.env`
5. Run database migrations:

   ```bash
   npx prisma migrate dev
   ```

6. Start the development server:

   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000)

## ⚙️ Environment Variables

Create a `.env` file in the project root and define the following variables:

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string used by Prisma for all application data, including users, decks, cards, and study sessions. |
| `NEXTAUTH_URL` | Yes | Base URL of the application used by NextAuth.js. Use `http://localhost:3000` for local development and your production domain in deployment. |
| `NEXTAUTH_SECRET` | Yes | Secret used to sign and encrypt authentication tokens. Generate a long random string for both development and production. |
| `OPENAI_API_KEY` | Yes | API key used to generate flashcards from study content through the OpenAI API. |

Example:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cardcraft_ai"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace-with-a-long-random-secret"
OPENAI_API_KEY="sk-..."
```

## 📝 Usage

Once the app is running, the typical workflow is:

1. Open the home page and create a new deck or choose an existing one.
2. Paste your study notes or source text into the flashcard generator.
3. Generate AI-powered flashcards and review the draft cards.
4. Edit cards as needed before saving them to a deck.
5. Open a deck to manage cards and review progress.
6. Start a study session to review due cards.
7. Mark cards based on recall quality so the spaced repetition scheduler can determine the next review date.

### Authentication

The project is configured with NextAuth.js and a credentials-based auth route. In the current codebase, when no session is present, the app falls back to a local demo learner profile so core deck and study flows remain usable during development.

### Study Workflow

CardCraft AI stores review history and updates each card's interval, ease factor, repetition count, and next review time after every study action. This allows the app to surface due cards and create a repeatable spaced repetition loop.

## 🚢 Deployment

CardCraft AI can be deployed to Vercel with PostgreSQL and the required environment variables configured.

### Recommended Vercel Setup

1. Push the repository to GitHub, GitLab, or Bitbucket.
2. Import the project into Vercel.
3. Vercel will detect the project as Next.js automatically. The repository includes `vercel.json` with explicit install and build commands:

   ```json
   {
     "framework": "nextjs",
     "installCommand": "npm install",
     "buildCommand": "npm run build"
   }
   ```

4. Add the required environment variables in the Vercel project settings:
   - `DATABASE_URL`
   - `NEXTAUTH_URL`
   - `NEXTAUTH_SECRET`
   - `OPENAI_API_KEY`
5. Set `NEXTAUTH_URL` to your production domain, for example `https://your-domain.vercel.app`.
6. Run Prisma migrations against the production database:

   ```bash
   npx prisma migrate deploy
   ```

7. Deploy the project.

### One-Click Vercel Checklist

- `npm install` runs automatically on Vercel, and `postinstall` triggers `prisma generate`.
- `npm run build` is used as the production build command.
- `build`, `start`, and `lint` scripts are present in `package.json`.
- `.vercelignore` excludes local env files, `node_modules`, and the Next.js cache from uploads.
- `next.config.ts` stays empty for Vercel's default Next.js runtime. Do not set `output: "standalone"` unless you are building a Docker image outside Vercel.

### Deployment Notes

- Make sure your PostgreSQL database is reachable from Vercel.
- Use a strong production value for `NEXTAUTH_SECRET`.
- Confirm that your OpenAI billing and API access are active before enabling AI generation in production.
- If you use a managed database provider such as Neon, Supabase, or Vercel Postgres, update `DATABASE_URL` accordingly.
- Vercel recommends storing environment variables in Project Settings instead of committing them to `vercel.json`.

## License

This project is private unless you choose to add an open-source license.
