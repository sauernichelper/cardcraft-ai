#!/bin/bash

# CardCraft AI - Setup Script
# Dieses Skript startet PostgreSQL und Ollama für lokale Entwicklung

set -e

echo "🚀 CardCraft AI Setup"
echo "====================="
echo ""

# Prüfe ob Docker installiert ist
if ! command -v docker &> /dev/null; then
    echo "❌ Docker nicht gefunden. Bitte installiere Docker first:"
    echo "   https://docs.docker.com/get-docker/"
    exit 1
fi

echo "✅ Docker gefunden"

# Prüfe ob Docker Compose installiert ist
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose nicht gefunden. Bitte installiere Docker Compose."
    exit 1
fi

echo "✅ Docker Compose gefunden"
echo ""

# Starte Container
echo "🐳 Starte PostgreSQL und Ollama..."
docker-compose up -d

echo ""
echo "⏳ Warte auf Datenbank..."
sleep 5

# Prüfe ob PostgreSQL läuft
until docker-compose exec -T postgres pg_isready -U cardcraft > /dev/null 2>&1; do
    echo "   Warte auf PostgreSQL..."
    sleep 2
done

echo "✅ PostgreSQL läuft!"
echo ""

# Ollama Modell herunterladen
echo "🤖 Lade Ollama Modell (llama3.2)..."
docker-compose exec -T ollama ollama pull llama3.2 || echo "⚠️  Modell-Download übersprungen (später manuell möglich)"

echo ""
echo "✅ Setup abgeschlossen!"
echo ""
echo "📋 Verbindungsdaten:"
echo "   PostgreSQL: postgres://cardcraft:cardcraft_secret@localhost:5432/cardcraft"
echo "   Ollama:     http://localhost:11434"
echo ""
echo "🔧 Für Vercel Deployment:"
echo "   DATABASE_URL=postgres://cardcraft:cardcraft_secret@YOUR_SERVER_IP:5432/cardcraft"
echo "   OLLAMA_URL=http://YOUR_SERVER_IP:11434"
echo ""
echo "🛑 Zum Stoppen: docker-compose down"
echo "🔄 Zum Neustarten: docker-compose restart"
echo ""
