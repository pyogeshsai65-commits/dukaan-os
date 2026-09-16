# DukaanOS

DukaanOS is a mobile shop-management app I’m building for small retailers in India.

The idea is simple: keep the everyday work of a shop — stock, sales, purchases, customer udhaar, collections and reports — in one place instead of relying on notebooks and disconnected tools.

## Current Status

DukaanOS is an active work in progress.

### Working

- Dashboard with sales, purchases, stock value, profit and udhaar summaries
- Product and inventory management
- Sales with Paid and Udhaar options
- Multi-product sales
- Purchases and stock updates
- Customer management and credit ledger
- Payment collection and reversal
- Transaction history
- Monthly reports and PDF export
- Archive / restore and Recycle Bin
- Add Stock / Remove Stock adjustments
- Supabase email authentication
- Supabase shop and membership integration
- Encrypted local data storage
- Gemini 3.5 Flash AI Assistant

### Supabase

Supabase is now part of the application architecture.

The app uses Supabase for authentication and shop/membership data, while the main business workflow is designed to work locally first.

The local data layer already has the pieces needed for reliable synchronization, including operation IDs, timestamps and business events. The Supabase client and authenticated API layer are also in place.

The next step is completing the automatic synchronization of the local business data with Supabase, including handling changes made while offline and reconciling them when the app comes back online.

In short:

- **Supabase integration:** working
- **Local-first business data:** working
- **Automatic business-data sync:** in progress

## AI Assistant

The AI Assistant is connected to Gemini 3.5 Flash through a Supabase Edge Function.

The app sends the user's question together with relevant business information such as sales, purchases, products, stock, customers, udhaar balances, recent transactions and business summaries.

The request goes through the `gemini-chat` Edge Function, which keeps the Gemini API key on the server side.

```text
DukaanOS App
     ↓
aiService.js
     ↓
Supabase Edge Function
     ↓
Gemini 3.5 Flash
```

The assistant is currently read-only. It can analyse the business data and answer questions, but it cannot create sales, change stock, collect payments or modify records.

## Architecture

DukaanOS follows a local-first approach.

Business operations are handled locally and persisted on the device. The application also maintains an operation/event model so that changes can be identified and processed reliably.

Supabase provides the cloud/backend side of the project, including authentication, shop membership and the server-side AI integration.

The longer-term goal is to make the same business data available across devices while keeping the app usable when there is no internet connection.

## Security

- Supabase client credentials are provided through environment variables.
- The public Supabase anon key is used by the mobile application.
- Service-role credentials are not included in the app.
- Local business snapshots are encrypted using AES-256-GCM.
- The encryption key is stored using Expo SecureStore.
- The Gemini API key is kept as a Supabase Edge Function secret.
- `.env` files and Supabase temporary files are excluded from Git.

Do not commit API keys, service-role credentials or real customer data.

## Tech Stack

- React Native
- Expo SDK 57
- JavaScript
- Supabase
- Gemini 3.5 Flash
- AsyncStorage
- Expo SecureStore
- Expo Crypto
- `@noble/ciphers`
- Expo Camera
- Expo Print
- Expo Sharing

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

## Running Locally

Install dependencies:

```bash
npm install
```

Create a `.env` file:

```text
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Start Expo:

```bash
npx expo start
```

For a tunnel:

```bash
npx expo start --tunnel
```

## Gemini Edge Function

The Gemini integration lives at:

```text
supabase/functions/gemini-chat/index.ts
```

The Gemini API key should be configured as a Supabase Edge Function secret rather than exposed to the mobile application.

Deploy with:

```bash
supabase secrets set GEMINI_API_KEY=your_gemini_api_key
supabase functions deploy gemini-chat
```

## Development

Some useful checks:

```bash
npx expo export --platform android
npx expo-doctor
```

Android preview build:

```bash
npx eas build --platform android --profile preview
```

## Project History

The project started as a shop-management MVP and has gradually been refactored into a more structured React Native application.

Recent work includes the local-first business operation model, Supabase integration, authentication and shop membership, and the Gemini AI integration.

The cloud-sync layer is the next major backend step.

## Status

DukaanOS is not finished yet.

The core shop-management workflow works locally, Supabase is integrated, and the Gemini assistant is working end-to-end. I’m continuing to build out the cloud synchronization and multi-device side of the application.

## License

No open-source license has been specified yet.
