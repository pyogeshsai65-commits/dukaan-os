# DukaanOS

DukaanOS is an AI-assisted retail management application for small Indian retailers and shopkeepers. It brings stock, sales, purchases, customer credit, collections, and reporting into one mobile workspace.

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
- Supabase email authentication with persisted client sessions
- Supabase shop and membership integration
- Gemini 3.5 Flash AI Assistant through a Supabase Edge Function
- Encrypted local snapshot persistence

### In progress

- The business-data layer is local-first. Each business operation is persisted locally through the DukaanOS storage/domain layer, with operation IDs and event records providing the foundation for reliable synchronization.
- A reusable authenticated API client and Supabase integration are present, but the current public repository does not contain a complete local-to-Supabase business-record sync worker or a documented automatic cloud reconciliation flow.
- The AI Assistant is read-only and receives bounded business context from the mobile app.
- Barcode and expiry utilities are present as supporting functionality rather than a complete barcode/expiry management workflow.

### Planned

- Complete automatic synchronization of financial and operational business records to Supabase
- Multi-device synchronization and documented conflict-resolution behavior

## Overview

Small retailers often manage inventory and **udhaar** (customer credit) across notebooks, memory, and disconnected tools. DukaanOS provides a single mobile workflow while remaining useful offline-first.

Supabase is connected to the application for authentication, shop/membership integration, and the server-side AI boundary. The mobile app currently keeps operational business state locally and persists it as encrypted snapshots. The codebase also contains the operation/event model and API-client foundation intended to support cloud synchronization.

The project is an active work-in-progress. This README distinguishes the Supabase cloud backend integration that is currently present from the separate automatic business-record synchronization layer that is not yet verifiable in the public repository.

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

The mobile app assembles bounded business context containing shop information, summary values, products, customers, and recent transactions. `src/services/aiService.js` sends the user's question and that context to the `gemini-chat` Supabase Edge Function. The Edge Function calls Gemini using the server-side `GEMINI_API_KEY` secret and returns the generated response to the mobile app.

It can answer questions about:

- Sales and purchases
- Inventory and product prices
- Customers and udhaar balances
- Payments and transactions
- Profit and business summaries

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

The Edge Function currently has JWT verification disabled in `supabase/config.toml`. This should be reviewed before broad production exposure; a mobile client key and CORS configuration are not authorization by themselves.

## Cloud / Supabase Architecture

### Mobile application

- React Native / Expo application
- Business operations run locally first
- Business state is persisted as encrypted device snapshots
- Domain operations are serialized through a command queue
- Operation IDs are supported for duplicate-operation protection
- Business events are retained locally as part of the operation model

### Supabase

- Supabase Auth provides email authentication and persisted client sessions.
- Supabase is used for shop and membership integration.
- `src/services/supabaseClient.js` initializes the public Supabase client.
- `src/services/apiClient.js` provides an authenticated HTTP client with timeout and retry handling.
- The `gemini-chat` Edge Function provides the server-side boundary for Gemini requests.
- The public repository does not currently expose a complete business-record sync worker, sync endpoint implementation, or conflict-resolution implementation that would justify describing automatic local-to-cloud synchronization as fully implemented.

This distinction matters: **Supabase integration is implemented; complete automatic synchronization of the local business database is still separate work in the public codebase.**

## Data and Security Notes

- The Expo client reads `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` from environment configuration.
- The mobile client uses the public/anon Supabase key; service-role credentials are not part of the client configuration.
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

## Project History

The Git history shows the backend work as a sequence rather than a single undocumented change: Supabase client bootstrap, authentication foundation, shop membership foundation, a checkpoint explicitly named `Checkpoint before cloud sync`, and the later Supabase/Gemini integration commit. The public main branch currently contains the resulting Supabase integration and local-first operation architecture, but not enough code to verify a completed automatic business-record cloud-sync pipeline.

## Project Status

DukaanOS is an active work-in-progress. The current repository contains a functional local-first retail workflow, Supabase authentication/shop integration, and a working Gemini AI integration. Automatic cloud synchronization of the operational business dataset remains a distinct implementation area unless additional sync code or deployment details are added to the repository.

## License

No open-source license has been specified for this repository.
