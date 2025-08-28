# Inti - Intent-Based Swap Chatbot

A modern, intelligent chatbot interface for cryptocurrency swaps with 1-click SDK integration.

## 🚀 Features

- **Intent-Based Swapping**: Natural language processing for swap requests
- **1-Click SDK Integration**: Seamless blockchain interactions
- **Real-time Chat Interface**: Modern, responsive chat UI
- **Multi-Chain Support**: Ethereum, Polygon, BSC, and more
- **Wallet Integration**: MetaMask, WalletConnect, and other popular wallets
- **Price Feeds**: Real-time cryptocurrency price data
- **Transaction History**: Complete swap history and analytics

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Headless UI, Framer Motion
- **Blockchain**: Ethers.js, Wagmi, Viem, RainbowKit
- **Swap SDK**: [1Click SDK TypeScript](https://github.com/defuse-protocol/one-click-sdk-typescript) for cross-chain swaps
- **Wallet Integration**: WalletConnect v2, MetaMask, RainbowKit
- **Chat**: Real-time chat interface with natural language processing
- **AI/ML**: Intent recognition for swap requests
- **Testing**: Jest, React Testing Library

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd inti-swap-chatbot
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
       Edit `.env.local` with your configuration:
    ```env
    # WalletConnect Configuration
    NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_wallet_connect_project_id
    
    # 1Click SDK Configuration
    NEXT_PUBLIC_1CLICK_API_URL=https://1click.chaindefuser.com
    NEXT_PUBLIC_1CLICK_JWT_TOKEN=your_jwt_token_here
    
    # RPC URLs
    NEXT_PUBLIC_ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your_api_key
    NEXT_PUBLIC_POLYGON_RPC_URL=https://polygon-rpc.com
    NEXT_PUBLIC_ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
    NEXT_PUBLIC_OPTIMISM_RPC_URL=https://mainnet.optimism.io
    ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗 Project Structure

```
inti-swap-chatbot/
├── app/                    # Next.js 13+ app directory
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # Reusable components
│   ├── ui/               # Base UI components
│   ├── chat/             # Chat-related components
│   ├── wallet/           # Wallet integration components
│   └── swap/             # Swap-related components
├── lib/                  # Utility libraries
│   ├── web3.ts          # Web3 configuration
│   ├── chat.ts          # Chat functionality
│   └── utils.ts         # General utilities
├── types/               # TypeScript type definitions
├── hooks/               # Custom React hooks
├── styles/              # Additional styles
└── public/              # Static assets
```

## 🔧 Configuration

### Blockchain Networks

The application supports multiple blockchain networks. Configure them in `lib/web3.ts`:

```typescript
export const supportedChains = [
  {
    id: 1,
    name: 'Ethereum',
    network: 'ethereum',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: ['https://eth-mainnet.g.alchemy.com/v2/...'] } },
  },
  // Add more chains...
]
```

### 1Click SDK Configuration

The application uses the [1Click SDK TypeScript](https://github.com/defuse-protocol/one-click-sdk-typescript) for cross-chain swaps. Configure it in `lib/web3.ts`:

```typescript
// Initialize the SDK
OpenAPI.BASE = process.env.NEXT_PUBLIC_1CLICK_API_URL
OpenAPI.TOKEN = process.env.NEXT_PUBLIC_1CLICK_JWT_TOKEN

// Get a quote
const quote = await OneClickService.getQuote(quoteRequest)
```

### Wallet Configuration

Configure wallet connections in `lib/web3.ts`:

```typescript
const { connectors } = getDefaultWallets({
  appName: 'Inti Swap Chatbot',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,
  chains,
})
```

## 🧪 Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📦 Building for Production

```bash
# Build the application
npm run build

# Start the production server
npm start
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy automatically on push

### Other Platforms

The application can be deployed to any platform that supports Next.js:

- Netlify
- AWS Amplify
- DigitalOcean App Platform
- Railway

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [Link to docs]
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discord**: [Join our community](https://discord.gg/your-server)

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Blockchain integration with [Wagmi](https://wagmi.sh/)
- Icons from [Heroicons](https://heroicons.com/)

---

**Made with ❤️ by Gaston Cartier**
