# 🧠 CardCraft AI

> AI-powered flashcard generator with spaced repetition learning

CardCraft AI transforms your lecture notes, PDFs, and study materials into high-quality flashcards automatically. Using the proven SM-2 spaced repetition algorithm, it optimizes your long-term retention and makes studying more efficient.

## ✨ Features

- **🤖 AI Flashcard Generation** - Paste text or upload PDFs, let AI create exam-relevant flashcards
- **🔄 Spaced Repetition** - Built-in SM-2 algorithm for optimal review scheduling
- **📚 Deck Management** - Organize cards into decks by subject
- **🎴 Study Mode** - Flip cards, rate your knowledge, track progress
- **👤 User Authentication** - Secure login with NextAuth
- **🎯 Smart Scheduling** - Cards automatically appear when you need to review them

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL + Prisma ORM
- **Authentication:** NextAuth.js v5
- **AI:** OpenAI API (GPT-5.2)
- **UI:** shadcn/ui + Tailwind CSS
- **PDF Parsing:** pdf-parse

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL database (local or cloud)
- OpenAI API key

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/sauernichelper/cardcraft-ai.git
   cd cardcraft-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your credentials:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/cardcraft"
   NEXTAUTH_SECRET="your-secret-here"
   NEXTAUTH_URL="http://localhost:3000"
   OPENAI_API_KEY="sk-your-openai-key"
   ```

4. **Set up the database**
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)**

## ⚙️ Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Random string for JWT encryption |
| `NEXTAUTH_URL` | Your app URL (http://localhost:3000 for dev) |
| `OPENAI_API_KEY` | Your OpenAI API key |

## 📝 Usage

1. **Create a Deck** - Click "New Deck" and give it a title
2. **Generate Cards** - Paste your lecture notes and click "Generate"
3. **Review Cards** - Edit any cards before saving
4. **Study** - Go to study mode to review cards due today
5. **Rate Yourself** - "Know" or "Don't Know" affects when you see the card next

## 🚢 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project on [Vercel](https://vercel.com)
3. Add environment variables in dashboard
4. Add PostgreSQL database (Vercel Postgres or Supabase)
5. Deploy!

### Docker

```dockerfile
# Dockerfile coming soon
```

## 🗺️ Roadmap

- [x] Text-to-flashcards AI generation
- [x] Spaced repetition (SM-2)
- [ ] PDF upload support
- [ ] Anki import/export
- [ ] Learning statistics dashboard
- [ ] Local LLM support (Ollama)
- [ ] Mobile app (PWA)

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines first.

## 📄 License

MIT License - see LICENSE file

---

Built with ❤️ by the CardCraft AI team
