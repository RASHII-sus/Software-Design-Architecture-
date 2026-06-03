#!/bin/bash
# ============================================================
# push_to_github.sh - Push SDA-Pro Student C project to GitHub
# Usage: bash push_to_github.sh <GITHUB_TOKEN> <REPO_URL>
# Example: bash push_to_github.sh ghp_ABC123 https://github.com/yourname/sda-pro-studentc
# ============================================================

GITHUB_TOKEN=$1
REPO_URL=$2

if [ -z "$GITHUB_TOKEN" ] || [ -z "$REPO_URL" ]; then
    echo "Usage: bash push_to_github.sh <GITHUB_TOKEN> <REPO_URL>"
    echo "Example: bash push_to_github.sh ghp_ABC123 https://github.com/yourname/sda-pro-studentc"
    exit 1
fi

# Insert token into URL
REPO_WITH_TOKEN=$(echo "$REPO_URL" | sed "s|https://|https://$GITHUB_TOKEN@|")

echo "Initializing Git repository..."
git init
git config user.email "studentc@sdapro.com"
git config user.name "Student C - SOC Platform Engineer"

echo "Staging all files..."
git add .

echo "Creating initial commit..."
git commit -m "Initial commit: SDA-Pro Student C - SOC Platform Engineer

Modules implemented:
- SOC Dashboard (MVC + Observer + Singleton + Redis Cache)
- Event Bus (Event-Driven + RabbitMQ + publish/subscribe)
- SOA Orchestrator (6-step pipeline: Ingest/Enrich/Correlate/Triage/Assign/Notify)
- Audit & Compliance (Factory + Facade + GDPR/ISO27001/SOC2)
- WebSocket real-time push (/topic/dashboard)
- JWT Security + RBAC (SOC_ANALYST, SOC_MANAGER, ADMIN)
- 12 JUnit 5 tests (7 Dashboard + 5 Audit)
- GitHub Actions CI/CD pipeline

Design Patterns: Singleton, Factory, Observer, Chain of Responsibility, Strategy, Facade
Architecture Styles: MVC, Layered, SOA, Event-Driven"

echo "Setting remote origin..."
git remote add origin "$REPO_WITH_TOKEN" 2>/dev/null || git remote set-url origin "$REPO_WITH_TOKEN"

echo "Pushing to GitHub..."
git branch -M main
git push -u origin main --force

echo ""
echo "✅ Successfully pushed to GitHub!"
echo "   Visit your repo to see the CI pipeline running."
echo "   Go to: Actions tab to see test results."
