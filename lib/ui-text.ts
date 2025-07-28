export const UI_TEXT = {
  // Main Assistant Interface
  assistant: {
    name: "Verbex AI",
    tagline: "Your Intelligent DeFi Companion",
    subtitle: "Navigate Stellar DeFi with confidence across Blend, Soroswap, and DeFindex",
    
    // Welcome Messages
    welcome: {
      title: "Welcome to the Future of DeFi",
      message: "I'm Verbex AI, your personal DeFi advisor. I'll help you optimize yields, manage risk, and navigate Stellar's ecosystem with ease.",
      cta: "Connect your wallet to get started"
    },
    
    // Status Messages
    status: {
      connecting: "Establishing secure connection...",
      connected: "🟢 Connected and ready",
      processing: "Processing your request...",
      signing: "Please sign the transaction in your wallet",
      success: "Transaction completed successfully!",
      error: "Something went wrong. Let's try again.",
      offline: "Currently offline. Please check your connection."
    }
  },

  // Chat Interface
  chat: {
    placeholder: "Ask me anything about DeFi... (e.g., 'Show my portfolio', 'Find best yields', 'Swap 100 USDC to XLM')",
    sendButton: "Send",
    newChat: "New Conversation",
    clearChat: "Clear History",
    
    // Quick Actions
    quickActions: {
      title: "Quick Actions",
      items: [
        "Show my portfolio",
        "Find best yields",
        "Optimize my positions",
        "Check lending rates",
        "Analyze risk exposure",
        "Compare protocol yields"
      ]
    },
    
    // Example Queries
    examples: {
      title: "Try asking me:",
      portfolio: "Show my complete DeFi portfolio",
      trading: "Swap 1000 USDC to XLM with best rate",
      lending: "Lend 500 USDC to highest APY pool",
      strategy: "Create a DeFindex vault for medium risk",
      analysis: "Analyze my portfolio risk and diversification",
      optimization: "Rebalance my portfolio for better yields"
    }
  },

  // Protocol Information
  protocols: {
    blend: {
      name: "Blend Protocol",
      description: "Advanced lending and borrowing with competitive rates",
      features: ["Supply assets to earn yield", "Borrow against collateral", "Claim lending rewards", "Real-time rate optimization"],
      riskLevel: "Low to Medium"
    },
    soroswap: {
      name: "Soroswap",
      description: "Stellar's premier AMM for seamless token swaps and liquidity",
      features: ["Best route optimization", "Provide liquidity for fees", "Multi-hop swaps", "Real-time price discovery"],
      riskLevel: "Medium"
    },
    defindex: {
      name: "DeFindex",
      description: "Automated yield strategies with professional portfolio management",
      features: ["Auto-compounding vaults", "Diversified strategies", "Risk-adjusted returns", "Set-and-forget investing"],
      riskLevel: "Medium to High"
    }
  },

  // Transaction Flow
  transactions: {
    preparation: {
      title: "Transaction Ready",
      description: "I've prepared your transaction. Please review the details below:",
      warning: "Always verify transaction details before signing"
    },
    signing: {
      title: "Sign Transaction",
      description: "Please approve this transaction in your wallet to proceed",
      note: "This transaction is secure and your private keys never leave your wallet"
    },
    success: {
      title: "Success!",
      description: "Your transaction has been submitted successfully",
      viewExplorer: "View on Explorer"
    },
    error: {
      title: "Transaction Failed",
      description: "Don't worry, your funds are safe. Let's try again or explore alternatives",
      retry: "Try Again",
      support: "Get Help"
    }
  },

  // DeFindex Specific
  defindex: {
    createVault: {
      title: "Create DeFindex Vault",
      description: "Set up your automated yield-generating strategy",
      assetLabel: "Select Asset",
      strategyLabel: "Select Strategy",
      initialDepositLabel: "Initial Deposit (Optional)",
      nameLabel: "Vault Name (Optional)",
      buttonText: "Create Vault",
      successMessage: "Your vault has been created successfully!",
      strategies: {
        blendFixed: "Blend Fixed Income (Low Risk)",
        blendYieldblox: "Blend YieldBlox (Medium Risk)",
        lpStrategy: "Liquidity Provider (Medium-High Risk)",
        multiStrategy: "Multi-Asset Strategy (High Risk)"
      }
    },
    deposit: {
      title: "Deposit to Vault",
      description: "Add funds to your yield-generating vault",
      assetLabel: "Asset",
      amountLabel: "Amount to Deposit",
      buttonText: "Deposit Funds",
      successMessage: "Your deposit has been processed successfully!"
    },
    withdraw: {
      title: "Withdraw from Vault",
      description: "Withdraw funds from your yield-generating vault",
      amountLabel: "Amount to Withdraw",
      buttonText: "Withdraw Funds",
      successMessage: "Your withdrawal has been processed successfully!"
    }
  }
};

export default UI_TEXT;
