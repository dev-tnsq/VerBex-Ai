"use client"

import { useChat } from "ai/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Send,
  Plus,
  MessageSquare,
  Wallet,
  Coins,
  TrendingUp,
  Settings,
  User,
  Copy,
  ThumbsUp,
  ThumbsDown,
  MoreHorizontal,
  Trash2,
} from "lucide-react"
import FreighterWallet from '../components/ui/FreighterWallet';
import { strategicAnalyzer } from '@/lib/strategic-analysis';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useFreighter } from "../hooks/useFreighter";
import { useEffect, useRef, useState } from "react";
import { GeminiIntentResult } from "@/lib/gemini-intent";

interface ChatThread {
  id: string;
  title: string;
  createdAt: string;
  chats: any[];
}

interface ChatMessage {
  id: string;
  message: string;
  role: string;
  timestamp: string;
  type?: string;
  geminiIntent?: any;
  blendResult?: any;
  txHash?: string;
}

export default function Web3ChatInterface() {
  const { publicKey, connected, signXDR } = useFreighter();
  const { toast } = useToast();
  const { state } = useSidebar();
  const isClient = useRef(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [chatThreads, setChatThreads] = useState<ChatThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pendingXdr, setPendingXdr] = useState<string | null>(null);
  const [pendingSummary, setPendingSummary] = useState<string | null>(null);
  const [pendingGemini, setPendingGemini] = useState<any>(null);
  const [pendingBlend, setPendingBlend] = useState<any>(null);
  const [pendingTxResult, setPendingTxResult] = useState<any>(null);
  const [signing, setSigning] = useState(false);
  const [pools, setPools] = useState<any[]>([]);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [loadingPools, setLoadingPools] = useState(false);
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [loadingThreads, setLoadingThreads] = useState(false);

  // Load chat threads when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      loadChatThreads();
    }
  }, [connected, publicKey]);

  // Load messages when thread is selected
  useEffect(() => {
    if (selectedThreadId) {
      loadChatHistory(selectedThreadId);
    }
  }, [selectedThreadId]);

  // Load chat threads from database
  const loadChatThreads = async () => {
    if (!publicKey) return;
    setLoadingThreads(true);
    try {
      const response = await fetch("/api/protocol", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: "getChatThreads",
          context: { wallet: publicKey },
        }),
      });
      const data = await response.json();
      if (data.threads) {
        setChatThreads(data.threads);
        // If no thread is selected, select the first one
        if (!selectedThreadId && data.threads.length > 0) {
          setSelectedThreadId(data.threads[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to load chat threads:", error);
      toast({ title: "Error", description: "Failed to load chat threads", variant: "destructive" });
    }
    setLoadingThreads(false);
  };

  // Load chat history for a specific thread
  const loadChatHistory = async (threadId: string) => {
    if (!publicKey) return;
    try {
      const response = await fetch("/api/protocol", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: "getChatHistory",
          context: { wallet: publicKey },
          threadId: threadId,
        }),
      });
      const data = await response.json();
      if (data.chatHistory) {
        setMessages(data.chatHistory);
      }
    } catch (error) {
      console.error("Failed to load chat history:", error);
      toast({ title: "Error", description: "Failed to load chat history", variant: "destructive" });
    }
  };

  // Create new chat thread
  const handleNewChat = async () => {
    if (!publicKey) return;
    try {
      const response = await fetch("/api/protocol", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: "newChat",
          context: { wallet: publicKey },
        }),
      });
      const data = await response.json();
      if (data.success) {
        // Reload threads to get the new one
        await loadChatThreads();
        // Select the new thread
        setSelectedThreadId(data.threadId);
        setMessages([]);
        toast({ title: "Success", description: "New chat created" });
      }
    } catch (error) {
      console.error("Failed to create new chat:", error);
      toast({ title: "Error", description: "Failed to create new chat", variant: "destructive" });
    }
  };

  // Delete chat thread
  const handleDeleteChat = async (threadId: string) => {
    if (!publicKey) return;
    try {
      const response = await fetch("/api/protocol", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: "deleteChatThread",
          context: { wallet: publicKey },
          threadId: threadId,
        }),
      });
      const data = await response.json();
      if (data.success) {
        // Reload threads
        await loadChatThreads();
        // If the deleted thread was selected, select the first available thread
        if (selectedThreadId === threadId) {
          setSelectedThreadId(null);
          setMessages([]);
        }
        toast({ title: "Success", description: "Chat deleted" });
      }
    } catch (error) {
      console.error("Failed to delete chat:", error);
      toast({ title: "Error", description: "Failed to delete chat", variant: "destructive" });
    }
  };

  // Select chat thread
  const handleSelectChat = (threadId: string) => {
    setSelectedThreadId(threadId);
  };

  // Mock pools data - in a real app, these would come from the blockchain
  useEffect(() => {
    async function fetchPools() {
      setLoadingPools(true);
      try {
        // Mock pools for demonstration - Gemini will use real pool IDs from user input
        const mockPools = [
          { 
            id: "CCLBPEYS3XFK65MYYXSBMOGKUI4ODN5S7SUZBGD7NALUQF64QILLX5B5", 
            name: "Main XLM Pool",
            description: "Primary XLM lending pool"
          },
          { 
            id: "CBLAUPFM5Q2NMJNFNXMZWPTGOHG3KDVDRN6SDEQFM4RG7FKMPV6UZ7LF", 
            name: "USDC Pool", 
            description: "USDC lending pool"
          }
        ];
        setPools(mockPools);
      } catch (e) {
        setPools([]);
      }
      setLoadingPools(false);
    }
    fetchPools();
  }, []);

  // Mock balances - in a real app, these would come from the blockchain
  useEffect(() => {
    async function fetchBalances() {
      if (!publicKey) return;
      setLoadingBalances(true);
      try {
        // Mock balances for demonstration - Gemini will work with user input
        const mockBalances = {
          XLM: 1000.50,
          USDC: 250.75,
          "native": 1000.50  // XLM native balance
        };
        setBalances(mockBalances);
      } catch (e) {
        setBalances({});
      }
      setLoadingBalances(false);
    }
    fetchBalances();
  }, [publicKey]);

  useEffect(() => { isClient.current = true; }, []);

  // Chat submit handler
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!input.trim()) return;
    setIsLoading(true);
    setPendingXdr(null);
    setPendingSummary(null);
    setPendingGemini(null);
    setPendingBlend(null);
    setPendingTxResult(null);
    
    const userMessage = { id: `${Date.now()}-${Math.floor(Math.random() * 100000)}`, message: input, role: "user", timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMessage]);
    
    try {
      // 🤖 CONVERSATIONAL AI: Send message with conversation history
      const recentHistory = messages.slice(-6).map(m => m.message); // Last 3 exchanges
      
      const requestBody = {
        command: input,
        context: { wallet: publicKey },
        history: recentHistory,
        threadId: selectedThreadId
      };
      
      console.log('[Frontend] Sending to conversational AI:', requestBody);
      
      // Call protocol API
      const res = await fetch("/api/protocol", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      
      const data = await res.json();
      console.log('[API Response]', data);
      
      // Handle errors
      if (data.error) {
        const errorMessage = { 
          id: `${Date.now()}-${Math.floor(Math.random() * 100000)}`,
          message: `❌ Error: ${data.error}`, 
          role: "assistant", 
          timestamp: new Date().toISOString()
        };
        setMessages((prev) => [...prev, errorMessage]);
        // Reload chat history to get the persisted messages from database
        if (data.threadId) {
          await loadChatHistory(data.threadId);
        }
        return;
      }
      
      setPendingGemini(data.intent);
      setPendingBlend(data.result);

      // Log the XDR process for debugging
      if (data.unsignedXDR) {
        console.log('[XDR Debug] Received unsignedXDR:', data.unsignedXDR);
        setPendingXdr(data.unsignedXDR);
      }
      if (data.xdrs) {
        console.log('[XDR Debug] Received xdrs array:', data.xdrs);
      }
      if (data.txHashes) {
        console.log('[XDR Debug] Received txHashes:', data.txHashes);
      }
      if (data.summaries) {
        console.log('[XDR Debug] Received summaries:', data.summaries);
      }
      
      // Handle conversational AI responses
      if (data.xdr) {
        // Transaction response - show for signing  
        setPendingXdr(data.xdr);
        setPendingSummary(data.summary || data.intent?.confirmation_text);
        const responseMessage = { 
          id: `${Date.now()}-${Math.floor(Math.random() * 100000)}`,
          message: `${data.intent?.confirmation_text || 'Transaction prepared for signing!'}

⚡ **Action Required**: Please review and sign the transaction to complete this operation.`, 
          role: "assistant",
          timestamp: new Date().toISOString(),
          type: 'transaction',
          geminiIntent: data.intent,
          blendResult: data.result
        };
        setMessages((prev) => [...prev, responseMessage]);
        // Reload chat history to get the persisted messages from database
        if (data.threadId) {
          await loadChatHistory(data.threadId);
        }
        // Optionally: If you maintain a separate history for Gemini, append the raw function response there, but do not show in UI.
      } else if (data.result && data.intent?.operations?.length > 0) {
        // Function call response - enhance with strategic analysis
        let enhancedText = data.intent?.confirmation_text || 'Here are the results:';
        try {
          // 🧠 STRATEGIC ENHANCEMENT: Add intelligent analysis
          enhancedText = await strategicAnalyzer.enhanceResponse(
            input,
            enhancedText,
            [data.result],
            publicKey||""
          );
        } catch (error) {
          console.error('[Strategic Enhancement Error]:', error);
          // Fallback to original response with data
          enhancedText = `${enhancedText}

📊 **Data:**
\`\`\`json
${JSON.stringify(data.result, null, 2)}
\`\`\``;
        }
        const responseMessage = { 
          id: `${Date.now()}-${Math.floor(Math.random() * 100000)}`,
          message: enhancedText,
          role: "assistant", 
          timestamp: new Date().toISOString(),
          type: 'data',
          geminiIntent: data.intent,
          blendResult: data.result
        };
        setMessages((prev) => [...prev, responseMessage]);
        // Reload chat history to get the persisted messages from database
        if (data.threadId) {
          await loadChatHistory(data.threadId);
        }
        // Optionally: If you maintain a separate history for Gemini, append the raw function response there, but do not show in UI.
      } else {
        // Pure conversational response - enhance if needed
        let responseText = data.intent?.confirmation_text || "I'm here to help! What would you like to know?";
        
        try {
          // 🧠 STRATEGIC ENHANCEMENT: Add insights to conversational responses too
          responseText = await strategicAnalyzer.enhanceResponse(
            input,
            responseText,
            data.results ? [data.results] : undefined,
            publicKey||""
          );
        } catch (error) {
          console.error('[Conversational Enhancement Error]:', error);
          // Keep original response
        }
        
        const responseMessage = { 
          id: `${Date.now()}-${Math.floor(Math.random() * 100000)}`,
          message: responseText,
          role: "assistant", 
          timestamp: new Date().toISOString(),
          type: 'conversation',
          geminiIntent: data.intent
        };
        setMessages((prev) => [...prev, responseMessage]);
        // Reload chat history to get the persisted messages from database
        if (data.threadId) {
          await loadChatHistory(data.threadId);
        }
      }
    } catch (error: any) {
      const errorMessage = { 
        id: `${Date.now()}-${Math.floor(Math.random() * 100000)}`,
        message: `❌ **Error**: ${error.message}`, 
        role: "assistant", 
        timestamp: new Date().toISOString(),
        type: 'error'
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setInput("");
    }
  };

  // Sign & Submit handler
  const handleSignAndSubmit = async () => {
    if (!pendingXdr) return;
    setSigning(true);
    try {
      // Add a "signing" message
      const signingMessage = { 
        id: `${Date.now()}-${Math.floor(Math.random() * 100000)}`,
        message: "✍️ **Signing Transaction**: Please approve the transaction in your wallet...", 
        role: "assistant", 
        timestamp: new Date().toISOString(),
        type: 'status'
      };
      setMessages((prev) => [...prev, signingMessage]);
      console.log('[XDR Debug] About to sign XDR:', pendingXdr);
      const signed = await signXDR(pendingXdr);
      let signedXdrString = '';
      if (typeof signed === 'string') {
        signedXdrString = signed;
      } else if (signed && typeof signed === 'object' && 'signedTxXdr' in signed) {
        signedXdrString = signed.signedTxXdr;
      }
      if (!signedXdrString) throw new Error("Signing failed or was cancelled by user");
      // Debug log
      console.log('[XDR Debug] Submitting signedXdr:', signedXdrString, typeof signedXdrString);
      // Add a "submitting" message
      const submittingMessage = { 
        id: `${Date.now()}-${Math.floor(Math.random() * 100000)}`,
        message: "⏳ **Submitting Transaction**: Sending transaction to Stellar network...", 
        role: "assistant", 
        timestamp: new Date().toISOString(),
        type: 'status'
      };
      setMessages((prev) => [...prev, submittingMessage]);
      // Submit to Stellar
      const res = await fetch("/api/stellar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signedXdr: signedXdrString }),
      });
      const data = await res.json();
      console.log('[XDR Debug] Stellar submit response:', data);
      setPendingTxResult(data);
      if (data.success && data.hash) {
        // Determine protocol for dynamic success message
        let protocol = null;
        if (pendingGemini && pendingGemini.operations && pendingGemini.operations.length > 0) {
          protocol = pendingGemini.operations[0].protocol;
        }
        let protocolMsg = 'Your transaction has been completed successfully!';
        if (protocol === 'Soroswap') {
          protocolMsg = 'Your Soroswap swap has been completed successfully!';
        } else if (protocol === 'Blend') {
          protocolMsg = 'Your Blend Protocol operation has been completed successfully!';
        }
        const successMessage = { 
          id: `${Date.now()}-${Math.floor(Math.random() * 100000)}`,
          message: `\n\n✅ **Transaction Successful!**\n\n🔗 **Transaction Hash**: \`${data.hash}\`\n📊 **Ledger**: ${data.ledger}\n\n🎉 ${protocolMsg}`, 
          role: "assistant", 
          timestamp: new Date().toISOString(),
          type: 'success',
          txHash: data.hash,
          txResult: data
        };
        setMessages((prev) => [...prev, successMessage]);
        toast({ title: "🎉 Transaction Successful!", description: `Hash: ${data.hash.slice(0, 16)}...` });
      } else {
        const errorMessage = { 
          id: `${Date.now()}-${Math.floor(Math.random() * 100000)}`,
          message: `❌ **Transaction Failed**\n\n**Error**: ${data.error}\n\n${data.details ? `**Details**: ${JSON.stringify(data.details, null, 2)}` : ''}`,
          role: "assistant", 
          timestamp: new Date().toISOString(),
          type: 'error'
        };
        setMessages((prev) => [...prev, errorMessage]);
        toast({ title: "❌ Transaction Failed", description: data.error || "Unknown error occurred" });
      }
      // Clear pending states
      setPendingXdr(null);
      setPendingSummary(null);
      setPendingGemini(null);
      setPendingBlend(null);
    } catch (e: any) {
      const errorMessage = { 
        id: `${Date.now()}-${Math.floor(Math.random() * 100000)}`,
        message: `❌ **Signing/Submission Error**\n\n**Error**: ${e.message}`, 
        role: "assistant", 
        timestamp: new Date().toISOString(),
        type: 'error'
      };
      setMessages((prev) => [...prev, errorMessage]);
      toast({ title: "❌ Error", description: e.message });
    }
    setSigning(false);
  };

  // Wallet connect/disconnect real-time feedback (do not auto-close modal)
  const handleWalletConnect = () => {
    toast({ title: "Wallet Connected", description: "You are now connected to your wallet." });
  };
  const handleWalletDisconnect = () => {
    toast({ title: "Wallet Disconnected", description: "You have disconnected your wallet." });
  };

  // Real new chat creation (client-only guard)
  // This function is now handled by handleNewChat

  // Real chat selection
  // This function is now handled by handleSelectChat

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  // Removed sidebarOpen and toggleSidebar logic

  // Add asset list for display
  const ASSET_LIST = [
    { name: "Stellar Lumens", contract: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC", code: "XLM", decimals: 7 },
    { name: "Dogstar", contract: "CDYZ6I4FTABFDVWIH2RSVDVIFSJF7FMA2CTUBFHWCLPSLIGO55K4HNSN", code: "XTAR", decimals: 7 },
    { name: "USDCoin", contract: "CBBHRKEP5M3NUDRISGLJKGHDHX3DA2CN2AZBQY6WLVUJ7VNLGSKBDUCM", code: "USDC", decimals: 7 },
    { name: "Ripple", contract: "CCPOB5HBFV2MGDFHR2QOFW3Y2JS7DQVJMWL7YESGSGH4AGQWVCJIPCKE", code: "XRP", decimals: 7 },
    { name: "ArgentinePeso", contract: "CAVCOKZ5XZ5GONIP2M7QJARHZMELBVPZXVTZU5AJEJTOLNWAT5R43LPO", code: "ARST", decimals: 7 },
    { name: "Aquarius", contract: "CCXQWO33QBEUDVTWDDOYLD2SYEJSWUM6DIJUX6NDAOSXNCGK3PSIWQJG", code: "AQUA", decimals: 7 },
    { name: "EURoCoin", contract: "CA34FYW2SL7VZW5E6WIPA2NOTLGG7TNAOKQLEO5YZHVUGNRFHM4HJ7WD", code: "EURC", decimals: 7 },
    { name: "Bitcoin", contract: "CAD23PIPKXXRLZ54VKAW7IGOOM4FFW6WFZZM2XPD5VC6Q4BA3FN4F32F", code: "BTC", decimals: 7 },
    { name: "BrazilianReal", contract: "CCS2TOJEO7QIWJOM7C6PZ2AKLNDP2UJQIVKGUE6KFS5ULRCN6G7GHITY", code: "BRL", decimals: 7 },
    { name: "wunpyr", contract: "CBSC4KEC3ZFSV33LLDUBISDIO6AWWOETQOFXFVUNESZJIL47N6SDFBQP", code: "WUNP", decimals: 7 },
    { name: "wuntro", contract: "CC5BEKXQJRY7TUD5TBQT7UBOAXU7DKCKXR7BSPFO23OHFABNJCE27UZ4", code: "WUNT", decimals: 7 },
    { name: "pyrzim", contract: "CA34VPNNRRVH5FMFVXWMQVEDMTOMLZESEZ5LE4724OSBHFB5HIRRHQ7G", code: "PYRZ", decimals: 7 },
    { name: "nylfyx", contract: "CDHNUGDN5ODFN25ADDSDQIOJPQSHFLH3IBFEVMMPYNQKG5Y2UZ5MV4ZW", code: "NYLF", decimals: 7 },
  ];
  function getAssetMeta(contract:any) {
    return ASSET_LIST.find(a => a.contract === contract) || { name: contract, code: contract, decimals: 7 };
  }
  function formatAmount(amount:any, decimals:any) {
    if (!amount) return amount;
    try {
      return (Number(amount) / Math.pow(10, decimals)).toLocaleString(undefined, { maximumFractionDigits: decimals });
    } catch {
      return amount;
    }
  }

  return (
    <div className="flex min-h-screen bg-retro font-pixel">
      <Sidebar collapsible="icon" className="sidebar-retro border-r pixel-border shadow-lg">
        <SidebarHeader>
              <div className="flex items-center gap-3">
            <div className="w-10 h-10 pixel-border bg-retro flex items-center justify-center shadow-md">
                <img src="/logo.jpg" alt="Verbex AI Logo" className="w-15 h-10" />
                </div>
            {state === "expanded" && (
                <div>
                <h1 className="sidebar-title">Verbex AI</h1>
                <p className="sidebar-subtitle">Future of DeFi</p>
              </div>
            )}
            </div>
        </SidebarHeader>
        <SidebarContent>
            <Button
              onClick={handleNewChat}
            className="w-full button-retro mb-4"
            >
              <Plus className="w-4 h-4 mr-2 neon" />
            {state === "expanded" && "New Chat"}
            </Button>
          <SidebarMenu>
            <SidebarMenuItem className="sidebar-menu-item">
                          {state === "expanded" && <h3 className="text-xs font-semibold neon px-2 mb-3 uppercase tracking-wider">Recent Chats</h3>}
            </SidebarMenuItem>
          {!connected && state === "expanded" && (
            <SidebarMenuItem className="sidebar-menu-item">
              <div className="px-2 py-2 text-xs neon opacity-70">
                Connect wallet to see chats
              </div>
            </SidebarMenuItem>
          )}
          {loadingThreads && state === "expanded" && (
            <SidebarMenuItem className="sidebar-menu-item">
              <div className="px-2 py-2 text-xs neon opacity-70">
                Loading chats...
          </div>
            </SidebarMenuItem>
          )}
          {connected && !loadingThreads && chatThreads.length === 0 && state === "expanded" && (
            <SidebarMenuItem className="sidebar-menu-item">
              <div className="px-2 py-2 text-xs neon opacity-70">
                No chats yet. Start a conversation!
            </div>
            </SidebarMenuItem>
          )}
          {chatThreads.map((thread) => (
              <SidebarMenuItem key={thread.id} className={`sidebar-menu-item ${selectedThreadId === thread.id ? 'active' : ''}`}>
                <SidebarMenuButton
                  isActive={selectedThreadId === thread.id}
                  onClick={() => handleSelectChat(thread.id)}
                  className={`flex items-center gap-3 sidebar-menu-button transition-colors px-2 py-2 ${selectedThreadId === thread.id ? 'active' : ''}`}
                  >
                  <MessageSquare className="w-4 h-4 flex-shrink-0 neon" />
                  {state === "expanded" && <span className="truncate text-sm">{thread.title}</span>}
                  {selectedThreadId === thread.id && state === "expanded" && (
                    <Trash2 className="w-4 h-4 neon opacity-0 group-hover:opacity-100 ml-auto flex-shrink-0" onClick={() => handleDeleteChat(thread.id)} />
                    )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarSeparator />
        <SidebarFooter>
          <div className="flex items-center gap-3 p-3 pixel-border bg-retro shadow-inner mt-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-retro neon text-sm">
                  <User className="w-4 h-4 neon" />
                </AvatarFallback>
              </Avatar>
            {state === "expanded" && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold neon truncate">
                  {connected && publicKey ? (
                    <span className="font-mono">{publicKey.slice(0, 6)}...{publicKey.slice(-4)}</span>
                  ) : (
                    <span className="neon">Not Connected</span>
                  )}
                </p>
                <p className="text-xs neon mt-0.5">
                  {connected ? "Wallet Connected" : "Connect your wallet"}
                </p>
              </div>
            )}
              <Settings className="w-4 h-4 neon" />
          </div>
        </SidebarFooter>
      </Sidebar>
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b pixel-border bg-retro">
          <div className="flex items-center gap-3">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 neon" />
              <h2 className="text-lg font-semibold neon">DeFi Dashboard</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Status Indicator */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-retro pixel-border">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs neon">Wallet Status</span>
            </div>
            <Dialog open={walletModalOpen} onOpenChange={setWalletModalOpen}>
              <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="neon button-retro wallet">
              <Wallet className="w-4 h-4 neon" />
            </Button>
              </DialogTrigger>
             <DialogContent className="max-w-md w-full modal-retro">
               <DialogTitle className="modal-title">
                  <VisuallyHidden>Wallet Connection</VisuallyHidden>
                </DialogTitle>
               <DialogDescription className="modal-description">
                  Connect your Stellar wallet to interact with Web3 features. Your address and status will appear below.
                </DialogDescription>
                <FreighterWallet onConnect={handleWalletConnect} onDisconnect={handleWalletDisconnect} />
              </DialogContent>
            </Dialog>
            <Button variant="ghost" size="sm" className="neon button-retro">
              <MoreHorizontal className="w-4 h-4 neon" />
            </Button>
          </div>
        </div>
        {/* Messages */}
        <ScrollArea className="flex-1">
          <div className="p-6">
            <div className="space-y-6 max-w-4xl mx-auto">
              {(!connected) ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-none pixel-border bg-retro flex items-center justify-center mx-auto mb-4">
                    <Wallet className="w-8 h-8 neon" />
                  </div>
                  <h3 className="text-xl font-semibold neon mb-2">Please connect your wallet to use the dashboard.</h3>
                  <p className="neon mb-6">Connect your wallet to access DeFi features, manage your assets, and interact with the blockchain.</p>
                </div>
              ) : !selectedThreadId && connected ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-none pixel-border bg-retro flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 neon" />
                  </div>
                  <h3 className="text-xl font-semibold neon mb-2">Select a chat or start a new conversation</h3>
                  <p className="neon mb-6">
                    Choose an existing chat from the sidebar or create a new one to begin.
                  </p>
                </div>
              ) : messages.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-none pixel-border bg-retro flex items-center justify-center mx-auto mb-4">
                    <Coins className="w-8 h-8 neon" />
                  </div>
                  <h3 className="text-xl font-semibold neon mb-2">Welcome to Verbex DeFi Dashboard</h3>
                  <p className="neon mb-6">
                    Manage your assets, swap tokens, provide liquidity, and track your DeFi activity on Stellar.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                    <Card 
                      className="p-4 bg-retro pixel-border hover:bg-green-900/30 cursor-pointer transition-colors"
                      onClick={() => setInput("Lend 100 XLM to the main pool")}
                    >
                      <p className="text-sm neon">💰 Lend 100 XLM to the main pool</p>
                    </Card>
                    <Card 
                      className="p-4 bg-retro pixel-border hover:bg-green-900/30 cursor-pointer transition-colors"
                      onClick={() => setInput("Swap 50 XLM for USDC using Soroswap")}
                    >
                      <p className="text-sm neon">🔄 Swap 50 XLM for USDC using Soroswap</p>
                    </Card>
                    <Card 
                      className="p-4 bg-retro pixel-border hover:bg-green-900/30 cursor-pointer transition-colors"
                      onClick={() => setInput("Add liquidity to the XLM/USDC pool on Soroswap")}
                    >
                      <p className="text-sm neon">💧 Add liquidity to the XLM/USDC pool on Soroswap</p>
                    </Card>
                    <Card 
                      className="p-4 bg-retro pixel-border hover:bg-green-900/30 cursor-pointer transition-colors"
                      onClick={() => setInput("Show me my LP positions on Soroswap")}
                    >
                      <p className="text-sm neon">📊 Show me my LP positions on Soroswap</p>
                    </Card>
                  </div>
                </div>
              )}
              {messages.map((msg: ChatMessage, i: number) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`pixel-border p-4 max-w-[80%] ${msg.role === "user" ? "bg-retro neon ml-auto" : "bg-retro neon"}`}>
                    <div className="whitespace-pre-wrap">
                      {msg.message?.split('\n').map((line: string, lineIndex: number) => {
                        // Handle markdown-style formatting for better UX
                        let formattedLine = line;
                        
                        // Bold text **text**
                        if (formattedLine.includes('**')) {
                          const parts = formattedLine.split(/(\*\*[^*]+\*\*)/);
                          return (
                            <div key={lineIndex} className="mb-1">
                              {parts.map((part, partIndex) => {
                                if (part.startsWith('**') && part.endsWith('**')) {
                                  return <span key={partIndex} className="font-bold neon">{part.slice(2, -2)}</span>;
                                }
                                return part;
                              })}
                            </div>
                          );
                        }
                        
                        // Code blocks
                        if (formattedLine.startsWith('```')) {
                          return <div key={lineIndex} className="font-mono text-xs bg-slate-700 p-2 rounded mb-1">{line}</div>;
                        }
                        
                        // Code inline `code`
                        if (formattedLine.includes('`')) {
                          const parts = formattedLine.split(/(`[^`]+`)/);
                          return (
                            <div key={lineIndex} className="mb-1">
                              {parts.map((part, partIndex) => {
                                if (part.startsWith('`') && part.endsWith('`')) {
                                  return <code key={partIndex} className="bg-slate-700 px-1 rounded text-sm font-mono">{part.slice(1, -1)}</code>;
                                }
                                return part;
                              })}
                            </div>
                          );
                        }
                        
                        return <div key={lineIndex} className="mb-1">{line}</div>;
                      })}
                    </div>
                    {msg.timestamp && (
                      <div className="text-xs opacity-50 mt-2 neon">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </div>
                    )}
                    {/* Show additional debug info for transaction messages if needed */}
                    {msg.type === 'transaction' && msg.geminiIntent && (
                      <details className="mt-2 text-xs">
                        <summary className="cursor-pointer neon">Show Gemini Analysis</summary>
                        <pre className="mt-1 text-xs bg-slate-700 p-2 rounded overflow-auto">{JSON.stringify(msg.geminiIntent, null, 2)}</pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}

              {pendingXdr && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] bg-retro text-green-400 pixel-border font-pixel p-4 shadow-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 bg-green-400 neon pixel-border animate-pulse"></div>
                      <div className="text-sm font-bold neon">Transaction Ready for Signature</div>
                    </div>
                    <div className="mb-4 p-3 bg-retro pixel-border text-green-200">
                      Please sign this transaction with your wallet.
                    </div>
                    <details className="mb-4">
                      <summary className="cursor-pointer neon text-xs hover:text-green-300">View Transaction XDR</summary>
                      <pre className="text-xs whitespace-pre-wrap break-all mt-2 bg-retro pixel-border p-2 text-green-300 overflow-auto max-h-32">{pendingXdr}</pre>
                    </details>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={handleSignAndSubmit}
                        disabled={signing || !connected}
                        className="flex-1 button-retro neon bg-retro text-green-300 border-2 border-green-400 pixel-border font-pixel py-2 px-4 text-base shadow-green-glow hover:bg-green-900 hover:text-green-200 transition"
                      >
                        {signing ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-green-300 border-t-transparent rounded-none animate-spin neon"></div>
                            Signing...
                          </div>
                        ) : (
                          "✍️ Sign & Submit Transaction"
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setPendingXdr(null);
                          setPendingSummary(null);
                          setPendingGemini(null);
                          setPendingBlend(null);
                        }}
                        className="button-retro neon bg-retro text-red-400 border-2 border-red-500 pixel-border font-pixel py-2 px-4 text-base hover:bg-red-900 hover:text-red-200 transition"
                      >
                        Cancel
                      </button>
                    </div>
                    {!connected && (
                      <div className="mt-2 text-xs neon bg-yellow-900/20 p-2 pixel-border">
                        ⚠️ Connect your wallet to sign transactions
                      </div>
                    )}
                  </div>
                </div>
              )}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl p-4 max-w-[80%] bg-retro text-green-400 border-2 border-green-500 pixel-border shadow-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-green-400 neon rounded-full animate-bounce shadow-green-glow"></div>
                      <div className="w-2 h-2 bg-green-400 neon rounded-full animate-bounce shadow-green-glow" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-green-400 neon rounded-full animate-bounce shadow-green-glow" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
        {/* Input */}
        <div className="p-6 border-t pixel-border bg-retro">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
           <div className="input-area-retro">
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={connected ? (selectedThreadId ? "Try: 'Lend 100 XLM to pool', 'Swap 50 XLM for USDC using Soroswap', 'Add liquidity to XLM/USDC pool', or 'Show me my LP positions'" : "Select a chat or create a new one to start...") : "Connect your wallet to interact with Blend & Soroswap DeFi..."}
               className="input-retro"
                disabled={isLoading || !connected || !selectedThreadId}
              />
             <button
                type="submit"
                disabled={isLoading || !input.trim() || !connected || !selectedThreadId}
               className="send-icon-btn"
               aria-label="Send"
              >
               <Send />
             </button>
            </div>
          <div className="mt-2 text-center w-full">
              <div className="mt-2 flex flex-wrap justify-center gap-1">
                <button
                  onClick={() => setInput("Hello")}
                className="text-xs px-2 py-1 button-retro"
                >
                  Say hi
                </button>
                <button
                  onClick={() => setInput("Get pool details for CCLBPEYS3XFK65MYYXSBMOGKUI4ODN5S7SUZBGD7NALUQF64QILLX5B5")}
                className="text-xs px-2 py-1 button-retro"
                >
                  Pool data
                </button>
                <button
                  onClick={() => setInput("Swap 100 XLM for USDC using Soroswap")}
                className="text-xs px-2 py-1 button-retro"
                >
                  Soroswap swap
                </button>
                <button
                  onClick={() => setInput("Add liquidity to the XLM/USDC pool on Soroswap")}
                className="text-xs px-2 py-1 button-retro"
                >
                  Add liquidity
                </button>
                <button
                  onClick={() => setInput("What can you do?")}
                className="text-xs px-2 py-1 button-retro"
                >
                  What can you do?
                </button>
                <button
                  onClick={() => setInput("Check my XLM balance")}
                className="text-xs px-2 py-1 button-retro"
                >
                  Check balance
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
