# Tempo Dashboard

Modern stablecoin payment dashboard built on Tempo blockchain with Next.js, TypeScript, and ShadCN UI.

## 🎯 Project Overview

This is a Proof of Concept (POC) web dashboard for sending and receiving stablecoin payments on Tempo testnet. Built to evaluate Tempo's capabilities for Rho Banking, with a focus on invoice reconciliation via on-chain memos.

**Status:** Phase 1-5 Complete ✅ Dashboard Layout & Authentication Working

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router) + TypeScript
- **Styling:** Tailwind CSS + ShadCN UI
- **Blockchain:** Wagmi + Viem + Tempo.ts
- **State Management:** TanStack Query + React hooks
- **Theme:** next-themes (dark mode support)
- **Network:** Tempo Testnet only (no real money)

## 📦 What's Set Up

### Core Infrastructure
- ✅ Next.js 14 with TypeScript, App Router, ESLint
- ✅ Tailwind CSS with ShadCN UI components
- ✅ Wagmi configured for Tempo testnet with WebAuthn
- ✅ Tempo.ts integration for passkey authentication
- ✅ TanStack Query for data fetching
- ✅ Dark mode support with next-themes
- ✅ Environment variables for Tempo testnet
- ✅ Token constants (pathUSD, AlphaUSD, BetaUSD, ThetaUSD)
- ✅ Error handling with user-friendly messages
- ✅ Toast notifications with Sonner

### Authentication & UX
- ✅ Passkey authentication (WebAuthn) - no seed phrases
- ✅ Sign up with new passkey
- ✅ Sign in with existing passkey
- ✅ Auto-reconnection on page refresh
- ✅ Browser compatibility checks
- ✅ Graceful error handling with toast notifications
- ✅ Loading states and redirects

### Dashboard Layout
- ✅ Protected dashboard routes with auth guard
- ✅ Responsive navbar with wallet address
- ✅ Navigation to Send, Receive, Transactions, Settings
- ✅ Theme toggle (light/dark mode)
- ✅ Wallet dropdown menu with sign out
- ✅ Main dashboard with placeholder stats and quick actions

### Files Created
```
dashboard/
├── app/
│   ├── layout.tsx                # Root layout with providers
│   ├── page.tsx                  # Landing page with auth
│   ├── providers.tsx             # Wagmi + Query + Theme providers
│   ├── globals.css               # Global styles with dark mode
│   └── dashboard/                # Dashboard routes
│       ├── layout.tsx            # Dashboard layout with navbar
│       ├── page.tsx              # Main dashboard
│       ├── send/page.tsx         # Send payment page
│       ├── receive/page.tsx      # Receive payment page
│       ├── transactions/page.tsx # Transaction history
│       └── settings/page.tsx     # Settings page
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx            # Dashboard navigation
│   │   └── ThemeToggle.tsx       # Dark mode toggle
│   ├── wallet/
│   │   └── ConnectionHandler.tsx # Wagmi connection manager
│   └── ui/                       # ShadCN components
│       ├── button.tsx
│       ├── card.tsx
│       ├── dropdown-menu.tsx
│       ├── sonner.tsx            # Toast notifications
│       └── ...
├── lib/
│   ├── constants.ts              # Tempo config, token addresses
│   ├── wagmi.ts                  # Wagmi + WebAuthn config
│   ├── errors.ts                 # Error parsing utilities
│   └── utils.ts                  # Utilities (from ShadCN)
├── next.config.ts                # Next.js configuration
└── .env.local                    # Environment variables
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Access to Tempo testnet

### Installation
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000 (or 3001 if 3000 is in use)
```

### Build for Production
```bash
npm run build
npm start
```

## 🔧 Configuration

### Next.js Configuration
The `next.config.ts` file sets Turbopack's root directory to fix routing issues when the dashboard is in a subdirectory of a monorepo structure.

### Environment Variables
See `.env.local` for Tempo testnet configuration:
- Tempo RPC URL
- Chain ID (42429)
- Token contract addresses
- Block explorer URL
- Fee sponsor URL

### Tempo Testnet Tokens
- **pathUSD:** `0x20c0000000000000000000000000000000000000`
- **AlphaUSD:** `0x20c0000000000000000000000000000000000001`
- **BetaUSD:** `0x20c0000000000000000000000000000000000002`
- **ThetaUSD:** `0x20c0000000000000000000000000000000000003`

## 📝 Implementation Progress

**Completed (Steps 1-5):**
- ✅ Landing page with authentication UI
- ✅ Passkey authentication (WebAuthn via Tempo.ts)
- ✅ Wallet connection state management
- ✅ Dashboard layout with protected routes
- ✅ Navigation and theme support

**Next (Step 6):**
- 🚧 Display token balances (AlphaUSD, pathUSD, etc.)
- 🚧 Add testnet faucet integration
- 🚧 Build send payment form
- 🚧 Implement receive page with QR codes
- 🚧 Create transaction history ledger

See the full plan for details.

## 🧪 Development

```bash
# Run development server with hot reload
npm run dev

# Type check
npm run lint

# Build and verify
npm run build
```

## 🎨 UI Components

Using ShadCN UI components (installed):
- Button, Card, Input, Dialog
- Select, Form, Label
- Sonner (toast notifications)

Add more components as needed:
```bash
npx shadcn@latest add [component-name]
```

## 🔗 Resources

- [Tempo Docs](https://docs.tempo.xyz)
- [Next.js Docs](https://nextjs.org/docs)
- [ShadCN UI](https://ui.shadcn.com)
- [Wagmi Docs](https://wagmi.sh)
- [Viem Docs](https://viem.sh)

## ⚠️ Important Notes

- **Testnet only** - No real money involved
- Test tokens have $0 value
- For evaluation purposes only
- Not production-ready

## 📄 License

MIT
