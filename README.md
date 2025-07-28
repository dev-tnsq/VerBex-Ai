# 🤖 Verbex AI - Blend Protocol Assistant

A ChatGPT-like agentic AI assistant for interacting with Blend Protocol on Stellar using natural language.

## ✨ Features

- **Natural Language DeFi**: Interact with Blend Protocol using plain English
- **Real AI Integration**: Powered by Google Gemini 1.5 Pro
- **Stellar Blockchain**: Full integration with Stellar network and Soroban smart contracts
- **Secure Transactions**: All transactions are signed by your wallet, never by our backend
- **Agentic Flow**: AI automatically decides which operations to perform based on your intent

## 🚀 Quick Start

1. **Clone and install**:
   ```bash
   git clone <repository>
   cd "Verbex Ai"
   npm install --legacy-peer-deps
   ```

2. **Setup environment**:
   ```bash
   npm run setup
   # Edit .env and add your GOOGLE_GENERATIVE_AI_API_KEY
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Open http://localhost:3000** and start chatting!

## 💬 Example Commands

- `"Lend 100 XLM to the main pool"`
- `"Show me my USDC balance"`
- `"What are the current network fees?"`
- `"Get details for pool CCLBPEYS3XFK65MYYXSBMOGKUI4ODN5S7SUZBGD7NALUQF64QILLX5B5"`
- `"Withdraw 50 XLM from my position"`

## 🏗️ Architecture

```
User Input (Natural Language)
       ↓
Gemini AI (Intent Parsing)
       ↓
Blend MCP (Protocol Operations)
       ↓
Stellar Network (Transaction Execution)
```

### Components:
- **Frontend**: Next.js 14 with real-time chat UI
- **AI Layer**: Google Gemini for intent parsing and parameter extraction
- **Protocol Layer**: Blend MCP service for DeFi operations
- **Blockchain Layer**: Stellar SDK for transaction handling

## 🔧 Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test-integration` - Test core components
- `npm run setup` - Create .env file from template

## 📚 Learn More

- [Blend Protocol Documentation](https://docs.blend.capital/)
- [Stellar Documentation](https://developers.stellar.org/)
- [Soroban Smart Contracts](https://soroban.stellar.org/)

## ⚠️ Disclaimer

This is experimental software running on Stellar testnet. Always verify transaction details before signing. Not intended for mainnet use without thorough testing.

---

Built with ❤️ for the Stellar ecosystem