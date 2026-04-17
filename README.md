# CardCraft AI

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/sauernichelper/cardcraft-ai&env=DATABASE_URL,NEXTAUTH_SECRET,NEXTAUTH_URL,OPENAI_API_KEY&project-name=cardcraft-ai&repository-name=cardcraft-ai)

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

### Deploy with Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fsauernichelper%2Fcardcraft-ai&project-name=cardcraft-ai&repository-name=cardcraft-ai)

### Recommended Vercel Setup

1. Import the GitHub repository into Vercel.
2. Confirm the framework preset is `Next.js`.
3. Add the production environment variables in Vercel Project Settings:
   - `DATABASE_URL`
   - `NEXTAUTH_URL`
   - `NEXTAUTH_SECRET`
   - `OPENAI_API_KEY`
4. Set `NEXTAUTH_URL` to the production domain that Vercel will serve, for example `https://cardcraft-ai.vercel.app`.
5. Run production migrations against the production database:

   ```bash
   npx prisma migrate deploy
   ```

6. If you want GitHub Actions to be the only deployment path, keep the repository `vercel.json` setting `git.deploymentEnabled` disabled so Vercel does not create duplicate Git-based deployments alongside the workflow.

### One-Click Vercel Checklist

- `npm install` runs automatically on Vercel, and `postinstall` triggers `prisma generate`.
- `npm run build` is used as the production build command.
- `build`, `start`, and `lint` scripts are present in `package.json`.
- `.vercelignore` excludes local env files, `node_modules`, and the Next.js cache from uploads.
- `vercel.json` pins the primary execution region to `iad1`, extends the flashcard generation API timeout, adds baseline security headers, and disables duplicate Git auto-deploys.
- `next.config.ts` stays empty for Vercel's default Next.js runtime. Do not set `output: "standalone"` unless you are building a Docker image outside Vercel.

### GitHub Actions Production Deployment

This repository includes `.github/workflows/deploy.yml` for production deployments on every push to `main`.

Add these GitHub repository secrets before enabling the workflow:

- `VERCEL_TOKEN`: personal or team token with access to the target Vercel project
- `VERCEL_ORG_ID`: Vercel team or personal account ID
- `VERCEL_PROJECT_ID`: Vercel project ID

The workflow installs dependencies, runs `npm run lint`, and then deploys to the Vercel production environment using `BetaHuhn/deploy-to-vercel-action@v1`.

### Manual Vercel CLI Deployment

For a one-time manual setup:

```bash
chmod +x scripts/vercel-setup.sh
./scripts/vercel-setup.sh
```

To upload the required production variables from your local shell into Vercel and deploy immediately:

```bash
export DATABASE_URL="postgresql://..."
export NEXTAUTH_URL="https://cardcraft-ai.vercel.app"
export NEXTAUTH_SECRET="replace-with-a-long-random-secret"
export OPENAI_API_KEY="sk-..."

./scripts/vercel-setup.sh --deploy
```

If you prefer the raw Vercel CLI flow instead of the helper script:

```bash
npx vercel link
npx vercel env add DATABASE_URL production
npx vercel env add NEXTAUTH_URL production
npx vercel env add NEXTAUTH_SECRET production
npx vercel env add OPENAI_API_KEY production
npx vercel pull --yes --environment=production
npx vercel build --prod
npx vercel deploy --prebuilt --prod
```

### Deployment Notes

- Make sure your PostgreSQL database is reachable from Vercel.
- Use a strong production value for `NEXTAUTH_SECRET`.
- Store application secrets in Vercel Project Settings or add them with `vercel env add`; do not commit secrets to `vercel.json`, workflow files, or `.env.example`.
- The GitHub Actions workflow only needs `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` in GitHub. Application runtime secrets stay in Vercel.
- Confirm that your OpenAI billing and API access are active before enabling AI generation in production.
- If you use a managed database provider such as Neon, Supabase, or Vercel Postgres, update `DATABASE_URL` accordingly.
- Vercel recommends storing environment variables in Project Settings instead of committing them to `vercel.json`.

## License

This project is private unless you choose to add an open-source license.
