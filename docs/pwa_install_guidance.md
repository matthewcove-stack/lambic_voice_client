# PWA install guidance

## Local verification
1. Run `corepack pnpm -C apps/web build`.
2. Run `corepack pnpm -C apps/web preview`.
3. Open the app in Chrome/Edge/Safari on desktop and mobile.

## Install steps
- Desktop Chrome/Edge: use the install icon in the address bar.
- Android Chrome: open browser menu and tap "Install app".
- iOS Safari: Share -> "Add to Home Screen".

## Notes
- Offline queue and retry logic are handled in-app via localStorage queue.
- For full service-worker caching, add `vite-plugin-pwa` in a future iteration.
