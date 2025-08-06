# Node.js TypeScript Module Loading Fix

## Problem
You're getting this error with Node.js v23.10.0:
```
Error [ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING]: Stripping types is currently unsupported for files under node_modules, for "file:///Users/tanishqmaheshwari/code/blockchain/VerbexAi/Mcp/node_modules/passkey-kit/src/index.ts"
```

This is a known issue with newer Node.js versions and TypeScript packages.

## Solution 1: Use Node.js v18 (Recommended)

The most reliable solution is to use Node.js v18, which doesn't have this issue:

```bash
# Install Node.js v18 using nvm
nvm install 18
nvm use 18

# Or install directly
# Download from: https://nodejs.org/dist/v18.20.4/

# Verify version
node --version
# Should show: v18.x.x

# Clean and reinstall
rm -rf node_modules package-lock.json yarn.lock
npm install
# or
yarn install

# Build and start
npm run build
npm start
```

## Solution 2: Use TypeScript Compilation

Update your build process to compile TypeScript properly:

```bash
# Clean previous build
rm -rf dist

# Build with TypeScript
npm run build
# or
yarn build

# Start the compiled JavaScript
npm start
# or
yarn start
```

## Solution 3: Update package.json Scripts

Update your `package.json` scripts:

```json
{
  "scripts": {
    "build": "tsc --project tsconfig.json",
    "start": "node --experimental-specifier-resolution=node dist/server.js",
    "dev": "ts-node --esm src/server.ts",
    "clean": "rm -rf dist",
    "rebuild": "npm run clean && npm run build"
  }
}
```

## Solution 4: Use ts-node for Development

For development, use ts-node instead:

```bash
# Install ts-node globally if not already installed
npm install -g ts-node

# Run directly with ts-node
npx ts-node --esm src/server.ts

# Or add to package.json
{
  "scripts": {
    "dev": "ts-node --esm src/server.ts",
    "start": "node dist/server.js"
  }
}
```

## Solution 5: Environment Variable Fix

Set this environment variable before running:

```bash
# Set environment variable
export NODE_OPTIONS="--experimental-specifier-resolution=node"

# Then run
yarn start
```

## Solution 6: Update to Node.js v20 (Alternative)

If you want to use a newer Node.js version:

```bash
# Install Node.js v20
nvm install 20
nvm use 20

# Clean and reinstall
rm -rf node_modules package-lock.json yarn.lock
npm install

# Build and start
npm run build
npm start
```

## Recommended Approach

**Use Solution 1 (Node.js v18)** as it's the most stable:

```bash
# 1. Install Node.js v18
nvm install 18
nvm use 18

# 2. Clean everything
rm -rf node_modules package-lock.json yarn.lock dist

# 3. Reinstall dependencies
npm install

# 4. Build the project
npm run build

# 5. Start the server
npm start
```

## Verification

After applying any solution, verify it works:

```bash
# Check Node.js version
node --version

# Check if build works
npm run build

# Check if server starts
npm start

# Should see:
# MCP HTTP server running on port 3001
# MCP server started successfully
```

## Troubleshooting

If you still have issues:

1. **Clear npm cache**:
   ```bash
   npm cache clean --force
   ```

2. **Delete node_modules and reinstall**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Check TypeScript version**:
   ```bash
   npx tsc --version
   ```

4. **Verify passkey-kit installation**:
   ```bash
   npm list passkey-kit
   ```

## Environment Variables

Make sure your `.env.local` file is set up correctly:

```env
# Network Configuration
SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
NETWORK_PASSPHRASE=Test SDF Network ; September 2015
WALLET_WASM_HASH=ecd990f0b45ca6817149b6175f79b32efb442f35731985a084131e8265c4cd90

# Passkey Kit Configuration
PASSKEY_TIMEOUT_SECONDS=30
CHALLENGE_TIMEOUT_MS=300000
MAX_RETRIES=3

# Launchtube Configuration
LAUNCHTUBE_URL=https://testnet.launchtube.xyz
LAUNCHTUBE_JWT=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI4YTA5NDMwMTA5MjE4OGQ3YmNkOTBiNTllNzA1ZmI5ZmE1ZjRjNzgyZTI3NTMyNTQxYzVhZGJmMTQyNzBjNTMyIiwiZXhwIjoxNzUwMzUwNzUyLCJjcmVkaXRzIjoxMDAwMDAwMDAwLCJpYXQiOjE3NDMwOTMxNTJ9.dbx3vhtVu4HIwJBWNFbEFZb50no7Sus8QIDWtfI3dHc

# App Configuration
APP_NAME=VerbexAI DeFi
RP_ID=localhost

# Server Configuration
MCP_SERVER_PORT=3001
FRONTEND_BASE_URL=http://localhost:3000

# Next.js Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_MCP_SERVER_URL=http://localhost:3001
```

## Quick Fix Commands

Run these commands in order:

```bash
# 1. Switch to Node.js v18
nvm install 18
nvm use 18

# 2. Clean everything
rm -rf node_modules package-lock.json yarn.lock dist

# 3. Reinstall
npm install

# 4. Build
npm run build

# 5. Start
npm start
```

This should resolve the TypeScript module loading issue and get your Passkey Kit MCP server running properly. 