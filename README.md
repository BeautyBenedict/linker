# Linker — Decentralized File Sharing on Shelbynet

A clean, modern decentralized file sharing web app built with Next.js, TypeScript, Tailwind CSS, and the Shelby Protocol.

## Features
- 🔗 Connect Petra wallet (Shelbynet / Aptos Testnet)
- 📤 Drag & drop file upload to Shelby decentralized storage
- 📁 View all your uploaded files (name, size, date)
- ⬇️ Download files
- 🔗 Copy shareable links for any file
- 🌑 Dark, modern UI

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Requirements
- Node.js 18+
- [Petra Wallet](https://petra.app) browser extension
- Petra must be set to **Testnet** (Shelbynet runs on Aptos Testnet)

## Project Structure

```
app/
  layout.tsx           # Root layout (fonts + providers)
  globals.css          # Global styles
  page.tsx             # Main app page
  providers.tsx        # QueryClient + Wallet + ShelbyClient providers
  components/
    WalletSelector.tsx # Petra wallet connect/disconnect UI
    UploadZone.tsx     # Drag & drop file upload area
    FileCard.tsx       # Individual file row (download + copy link)
    Toast.tsx          # Toast notification system
```

## Notes
- The app uses `Network.TESTNET` which corresponds to Shelbynet.
- Blobs (files) are stored on-chain via `@shelby-protocol/sdk`.
- Shareable links are formatted as `https://shelby.xyz/blob/<address>/<filename>` — adjust if your gateway differs.