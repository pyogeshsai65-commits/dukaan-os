# DukaanOS Mobile

This is the React Native / Expo mobile version of the current DukaanOS MVP.

## Included

- Dashboard
- Sales
- Paid vs Udhaar sale
- Customer ledger
- Receive payment
- Purchases
- Inventory search
- Add/delete products
- Recent transaction history
- Low-stock warning
- Persistent local storage with AsyncStorage

## Run on an Android phone

1. Install Node.js LTS.
2. Install Expo Go on the Android phone.
3. Open PowerShell in this folder.
4. Run:

```powershell
npm install
npx expo start
```

5. Scan the QR code from Expo Go. The phone and computer should normally be on the same Wi-Fi. If connection fails, try:

```powershell
npx expo start --tunnel
```

## Notes

This MVP stores data locally on the phone. It is not yet a cloud-synced multi-device application.
