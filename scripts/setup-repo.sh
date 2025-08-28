#!/bin/bash

# Inti Repository Setup Script
# This script helps set up the initial git repository

echo "🚀 Setting up Inti repository..."

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install git first."
    exit 1
fi

# Initialize git repository if not already initialized
if [ ! -d ".git" ]; then
    echo "📁 Initializing git repository..."
    git init
fi

# Add all files
echo "📝 Adding files to git..."
git add .

# Create initial commit
echo "💾 Creating initial commit..."
git commit -m "feat: initial commit - Inti swap chatbot

- Add Next.js 14 application with TypeScript
- Implement chat interface with natural language processing
- Integrate 1Click SDK for cross-chain swaps
- Add WalletConnect v2 and RainbowKit integration
- Implement real-time price fetching from CoinGecko
- Add cyberpunk/neon theme with Tailwind CSS
- Set up comprehensive documentation and CI/CD workflows"

echo "✅ Repository setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Create a GitHub repository"
echo "2. Add the remote origin: git remote add origin <your-repo-url>"
echo "3. Push to GitHub: git push -u origin main"
echo "4. Set up environment variables in your deployment platform"
echo ""
echo "🔧 Available scripts:"
echo "- npm run dev: Start development server"
echo "- npm run build: Build for production"
echo "- npm run lint: Run ESLint"
echo "- npm test: Run tests"
echo ""
echo "📚 Documentation:"
echo "- README.md: Project overview and setup"
echo "- CONTRIBUTING.md: How to contribute"
echo "- CHANGELOG.md: Version history"
echo "- SECURITY.md: Security policy"
