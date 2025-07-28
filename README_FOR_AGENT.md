# Verbex AI + Blend MCP + Gemini Agentic DeFi Flow

## Overview
This project enables users to interact with Blend Protocol on Stellar using natural language, in a ChatGPT-like agentic flow. The system uses Gemini (LLM) to parse user intent, routes to Blend MCP functions, and lets users sign transactions with their wallet.

---

## Code Structure

- `app/page.tsx` — Main frontend chat UI. Handles user input, fetches pools/balances, sends context to Gemini, displays Gemini/Blend/XDR/transaction results, and manages wallet signing.
- `app/api/protocol/route.ts` — Protocol router API. Receives user command/context, calls Gemini for intent parsing, maps Gemini's action to BlendService, and returns XDR or data for the frontend.
- `app/api/stellar/submit.ts` — API endpoint to submit a signed XDR to Stellar testnet.
- `lib/gemini-intent.ts` — Gemini system prompt and intent parser. Defines the JSON contract, prompt, and (stub or real) Gemini API call.
- `BlendMcp/src/services/blend.service.ts` — BlendService class. Implements all Blend MCP actions (lend, withdraw, etc.), now supporting web flow (returns unsigned XDR for user signature if no privateKey is provided).
---

## End-to-End Flow

1. **User enters a DeFi command** in the chat UI (e.g., "Lend 100 XLM to Blend pool").

3. **Frontend sends** `{ command, context }` to `/api/protocol`.
4. **Backend (`/api/protocol`)**:
   - Calls Gemini with the system prompt and context.
   - Gemini outputs a JSON intent: which Blend action to call, with what parameters.
   - The router maps the action to the correct BlendService method and calls it.
   - If the action is a transaction, BlendService returns an unsigned XDR (web flow).
5. **Frontend receives the XDR** and prompts the user to sign with their wallet.
6. **User signs the XDR**; frontend submits the signed XDR to `/api/stellar/submit`.
7. **Backend submits the signed XDR** to Stellar testnet and returns the transaction result.
8. **Frontend displays the result** in the chat, step-by-step, like ChatGPT.

---

## Key Principles

- **No hardcoding:** All pool IDs, asset IDs, and user addresses come from real context, not hardcoded values.
- **Agentic flow:** Gemini decides which Blend function to call, using only the context provided.
- **User-signed transactions:** All on-chain actions are signed by the user, never by a backend key.
- **Composable:** Easy to add more Blend actions or extend to other protocols (Soroswap, DeFindex, etc.).

---

## How to Extend

- Update the Gemini system prompt in `lib/gemini-intent.ts` if you add new actions.
- Add more context fields (vaults, positions, etc.) as needed.
- For production, replace the Gemini stub with a real Gemini API call.

---

## Example Gemini System Prompt (Blend Only)

(See `lib/gemini-intent.ts` for the full prompt.)

---

## Troubleshooting

- If Gemini returns no actionable intent, check that the context includes real pools and balances.
- If you see 404s for `/api/blend/pools` or `/api/blend/balances`, implement those endpoints.
- If Blend MCP returns an error, check that the poolId and other parameters are valid and real.

---

## Summary
This system is designed for a true agentic, ChatGPT-like DeFi experience: the user just types, Gemini interprets, Blend MCP executes, and the user signs—all in a secure, composable, and extensible flow. 