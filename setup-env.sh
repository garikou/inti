#!/bin/bash

echo "🔧 Setting up Inti environment variables..."
echo ""

# Check if .env.local already exists
if [ -f ".env.local" ]; then
    echo "⚠️  .env.local already exists. Backing up to .env.local.backup"
    cp .env.local .env.local.backup
fi

# Create .env.local from example
if [ -f "env.example" ]; then
    cp env.example .env.local
    echo "✅ Created .env.local from env.example"
else
    echo "❌ env.example not found. Creating basic .env.local..."
    cat > .env.local << EOF
# WalletConnect Configuration
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_wallet_connect_project_id_here

# 1Click SDK Configuration
NEXT_PUBLIC_1CLICK_API_URL=https://1click.chaindefuser.com
NEXT_PUBLIC_1CLICK_JWT_TOKEN=your_jwt_token_here

# RPC URLs for different chains
NEXT_PUBLIC_ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your_api_key
NEXT_PUBLIC_POLYGON_RPC_URL=https://polygon-rpc.com
NEXT_PUBLIC_ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
NEXT_PUBLIC_OPTIMISM_RPC_URL=https://mainnet.optimism.io
EOF
    echo "✅ Created basic .env.local"
fi

echo ""
echo "📝 Next steps:"
echo "1. Edit .env.local and replace the placeholder values:"
echo "   - NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: Get from https://cloud.walletconnect.com/"
echo "   - NEXT_PUBLIC_1CLICK_JWT_TOKEN: Request from https://docs.google.com/forms/d/e/1FAIpQLSdrSrqSkKOMb_a8XhwF0f7N5xZ0Y5CYgyzxiAuoC2g4a2N68g/viewform"
echo ""
echo "2. Restart your development server:"
echo "   npm run dev"
echo ""
echo "3. Test the application - it will now show previews instead of errors!"
