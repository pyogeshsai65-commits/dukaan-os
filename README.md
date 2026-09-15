# DukaanOS

DukaanOS is an AI-assisted retail management application for small Indian retailers and shopkeepers. It brings daily shop operations—stock, sales, purchases, customer credit, collections, and reporting—into one practical mobile workspace.

## Overview

Small retailers often manage inventory and **udhaar** (customer credit) across notebooks, memory, and disconnected tools. DukaanOS provides a single mobile workflow while remaining useful offline-first.

Local business state is persisted on the device, while Supabase provides authentication, shop membership, and the secure boundary for the AI assistant.

The project is an active product foundation and portfolio project. Financial data remains local-first in the current implementation; a complete cloud synchronization layer for business records is not yet implemented.

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

The AI Assistant is powered by **Gemini 3.5 Flash**.

It receives a bounded business context assembled by the mobile app and can answer questions about:

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
