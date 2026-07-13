# Digital Mandir - Frontend (React Native / Expo)

React Native mobile app for Digital Mandir using Expo.

## Quick Start

### First Time Setup
```bash
# Windows
.\setup.bat

# macOS/Linux
bash setup.sh
```

This will:
- Create `.env` file
- Install dependencies
- Set up Expo CLI
- Clear caches

### Start Development

**Terminal 1 - Backend:**
```bash
cd ../backend
npm run start:dev
```

**Terminal 2 - Frontend:**
```bash
# Windows
.\start-dev.bat

# macOS/Linux
bash start-dev.sh
```

Then press:
- `w` for Web
- `i` for iOS Simulator
- `a` for Android Emulator
- Scan QR for Physical Device (Expo Go)

---

## Configuration

### .env Variables

**Backend API:**
- Local: `http://localhost:3000/api`
- Android Emulator: `http://10.0.2.2:3000/api`
- Physical Device: `http://192.168.X.X:3000/api` (find IP with `ipconfig`)

**Google Sign-In:**
- Web Client ID: Already configured
- iOS Client ID: Add if needed
- Android Client ID: Add if needed

### Find Your Local IP (Windows)
```cmd
ipconfig
```

Look for "IPv4 Address" under your network adapter

---

## Project Structure

```
frontend/
├── src/
│   ├── screens/        # Screen components
│   ├── components/     # Reusable components
│   ├── services/       # API & auth services
│   ├── hooks/          # Custom hooks
│   └── types/          # TypeScript types
├── android/            # Native Android code
├── assets/             # Images, icons, fonts
├── plugins/            # Expo plugins
├── app.json            # Expo configuration
├── metro.config.js     # Metro bundler config
├── .env                # Environment variables
└── tsconfig.json       # TypeScript config
```

---

## Common Tasks

### Run on Web
```bash
# Start dev server, then press 'w'
.\start-dev.bat    # Windows
bash start-dev.sh  # macOS/Linux
```

### Run on Android Emulator
```bash
# Ensure emulator is running, then press 'a'
.\start-dev.bat
```

### Run on Physical Device
```bash
# Scan QR code with Expo Go app
.\start-dev.bat
```

### Clear Cache
```bash
# Integrated in start-dev scripts, or manually:
rm -rf .expo .metro-cache* node_modules/.cache
npx expo start --clear
```

### Build APK
```bash
npx expo build:android --type apk
```

### Build AAB (Release)
```bash
npx expo build:android --type app-bundle
```

---

## Troubleshooting

### "Metro bundler failed to start"
```bash
# Clear all caches
rm -rf .expo .metro-cache* node_modules/.cache
npx expo start --clear
```

### "Cannot connect to backend"
Check `.env` has correct `EXPO_PUBLIC_API_URL`:
- Android Emulator: Use `10.0.2.2` not `localhost`
- Physical Device: Use your machine's local IP

### "URI scheme error"
```bash
# Reset Android native build
cd android && ./gradlew clean && cd ..
npx expo prebuild --clean
npx expo start --clear --scheme digitalmandir
```

### "Google Sign-In not working"
Verify `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` is set in `.env`

---

## Scripts

### Startup Scripts
- `start-dev.bat` - Windows development server (with env loading)
- `start-dev.sh` - macOS/Linux development server (with env loading)

### Setup Scripts
- `setup.bat` - Windows first-time setup
- `setup.sh` - macOS/Linux first-time setup

---

## Documentation

- **[EXPO_SETUP.md](EXPO_SETUP.md)** - Complete setup and troubleshooting guide
- **[EXPO_FIX_SUMMARY.md](EXPO_FIX_SUMMARY.md)** - Issues fixed and changes made
- **[NETWORK_CONFIG.md](NETWORK_CONFIG.md)** - Network configuration details

---

## Dependencies

- **React Native** - Native app framework
- **Expo** - React Native framework & build service
- **TypeScript** - Type-safe JavaScript
- **React Native Google Sign-In** - Authentication
- **Firebase** - Push notifications
- **Axios** - HTTP client
- **React Navigation** - Screen navigation

---

## Backend Integration

The frontend connects to the NestJS backend at:
- Development: `http://localhost:3000/api`
- Production: `https://api.digitalmandir.in/api`

Backend must be running for full app functionality.

---

## Building & Deployment

### Android
```bash
# Development APK
npx expo build:android --type apk

# Production AAB (for Play Store)
npx expo build:android --type app-bundle
```

### Web
```bash
npx expo export --platform web
```

---

## Useful Links

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)
- [Google Cloud Console](https://console.cloud.google.com) - Auth config
- [Expo Console](https://expo.dev) - Build & publish

---

**Last Updated:** 2026-04-09
