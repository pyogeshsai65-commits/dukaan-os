# DukaanOS

DukaanOS is an AI-assisted retail management application for small Indian retailers and shopkeepers. It brings daily shop operations—stock, sales, purchases, customer credit, collections, and reporting—into one practical mobile workspace.

## Implementation Status

### Fully implemented / working

- Dashboard summaries for sales, purchases, stock value, profit, and udhaar
- Inventory search and product management
- Sales with paid and udhaar payment modes
- Purchases and stock updates
- Customer management
- Udhaar / credit ledger and customer balances
- Payment collection and payment reversal
- Transaction history
- Monthly business reports and PDF export
- Archive and restore for products
- Recycle Bin with restore and 15-day purge
- Add Stock and Remove Stock inventory adjustments
- Supabase email authentication
- Supabase shop and membership management
- Gemini 3.5 Flash AI Assistant through a Supabase Edge Function
- Encrypted local snapshot persistence

### In progress

- The AI Assistant is currently read-only and uses business context supplied by the mobile app.
- Barcode and expiry utilities are present as supporting functionality rather than a complete barcode/expiry management workflow.
- Cloud synchronization of business records is not implemented in the current repository.

### Planned

- Complete cloud synchronization for financial and operational business records
- Multi-device synchronization and conflict resolution for business data

## Overview

Small retailers often manage inventory and **udhaar** (customer credit) across notebooks, memory, and disconnected tools. DukaanOS provides a single mobile workflow while remaining useful offline-first.

Local business state is persisted on the device. Supabase currently provides authentication, shop membership, and the server-side boundary used by the AI Assistant. Business records such as sales, inventory, purchases, and udhaar are not currently synchronized to Supabase.

The project is an active work-in-progress. The current business-data architecture is local-first, with encrypted device snapshots and a separate Supabase-backed authentication and AI integration.

## Key Features

- Dashboard with sales, purchases, stock value, profit, and udhaar summaries
- Inventory search and product management
- Sales with paid and udhaar payment modes
- Purchases and stock updates
- Customer management
- Udhaar / credit ledger and customer balances
- Payment collection and payment reversal
- Transaction history
- Monthly business reports and PDF export
- Archive and restore for products
- Recycle Bin with restore and 15-day purge
- Add Stock and Remove Stock inventory adjustments
- Barcode and expiry-related utilities
- Supabase email authentication
- Supabase shop and membership management
- Read-only Gemini 3.5 Flash AI Assistant through a Supabase Edge Function
- Encrypted local snapshot persistence

## AI Assistant

The AI Assistant is powered by **Gemini 3.5 Flash** and is implemented as a live end-to-end request flow.

The mobile app assembles a bounded business context containing shop information, summary values, products, customers, and recent transactions. `src/services/aiService.js` sends the user's question and that context to the `gemini-chat` Supabase Edge Function. The Edge Function calls Gemini 3.5 Flash using the server-side `GEMINI_API_KEY` secret and returns the generated response to the mobile app.

It can answer questions about:

- Sales and purchases
- Inventory and product prices
- Customers and udhaar balances
- Payments and transactions
- Profit and business summaries

Example questions:

> How much did I sell today?

> Which products have low stock?

> How much does Ramesh owe me?

> What is my total profit?

The assistant is **read-only**. It cannot create, edit, delete, sell, purchase, collect payment, or otherwise mutate DukaanOS data.

The request path is:

```text
Mobile App
    ↓
src/services/aiService.js
    ↓
Supabase Edge Function: gemini-chat
    ↓
Gemini 3.5 Flash
```

The Edge Function currently has JWT verification disabled in `supabase/config.toml`. This is an important deployment boundary to review before using the function with sensitive production business data; the mobile client and CORS configuration should not be treated as authorization by themselves.

## Architecture

### Mobile application

- React Native / Expo application
- Business operations are performed locally
- Business state is persisted as encrypted snapshots on the device
- Transaction and inventory operations are represented in local application services

### Supabase

- Supabase Auth provides email authentication and persisted client sessions.
- Supabase is used for shop and membership integration.
- The `gemini-chat` Edge Function provides the server-side boundary for Gemini requests.
- The repository does not currently contain a business-record synchronization schema, synchronization worker, or conflict-resolution implementation.

### AI request flow

```text
Mobile App
    ↓
src/services/aiService.js
    ↓
Supabase Edge Function: gemini-chat
    ↓
Gemini 3.5 Flash
```

The Gemini API key is kept as a Supabase Edge Function secret and is not stored in the mobile application.

## Data and Security Notes

- The Expo client reads `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` from environment configuration.
- The Supabase client uses the public/anon key; the service-role key is not part of the mobile client configuration.
- Local business snapshots use AES-256-GCM encryption with a device-local key stored through Expo SecureStore.
- Gemini credentials are kept server-side in the Supabase Edge Function environment.
- `.env` and Supabase temporary files are excluded from version control through `.gitignore`.
- Do not commit API keys, service-role credentials, or real customer/shop data.

## Project Structure

```text
DukaanOS/
├── App.js
├── src/
│   ├── components/
│   ├── screens/
│   ├── services/
│   ├── store/
│   └── utils/
├── supabase/
│   ├── config.toml
│   └── functions/
│       └── gemini-chat/
├── assets/
├── app.json
├── eas.json
└── package.json
```

## Tech Stack

- React Native
- Expo SDK 57
- JavaScript
- Supabase JS client, Auth, and Edge Functions
- Gemini 3.5 Flash
- AsyncStorage
- Expo SecureStore
- Expo Crypto
- `@noble/ciphers` for AES-GCM encryption
- Expo Camera, Print, Sharing, and Safe Area utilities

## Setup

Install dependencies:

```bash
npm install
```

Create a local `.env` with the public Supabase client configuration:

```text
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Do not put `GEMINI_API_KEY` in the Expo client environment. Configure it as a Supabase Edge Function secret instead.

Start the app:

```bash
npx expo start
```

For a tunnel connection when local network discovery is unavailable:

```bash
npx expo start --tunnel
```

## Gemini Edge Function

The AI endpoint is implemented at:

```text
supabase/functions/gemini-chat/index.ts
```

Configure the Gemini secret in the Supabase project and deploy the function with the Supabase CLI:

```bash
supabase secrets set GEMINI_API_KEY=your_gemini_api_key
supabase functions deploy gemini-chat
```

The deployed function currently uses `gemini-3.5-flash` and accepts POST requests containing a user message and bounded business context.

## Development Checks

Useful checks include:

```bash
npx expo export --platform android
npx expo-doctor
```

For an Android preview build through EAS:

```bash
npx eas build --platform android --profile preview
```

## Project Status

DukaanOS is an active work-in-progress. The application has a functional local-first retail workflow and a working Gemini AI integration, while cloud synchronization and other future capabilities remain separate implementation work.

## Product Scope

The project is being developed as a practical retail-management application and as a hands-on software project. The implementation status above is intended to distinguish working functionality from work that is still planned.

## License

No open-source license has been specified for this repository.
