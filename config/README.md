# Project configuration

Maintain integration settings here:

| File | Purpose |
| --- | --- |
| `.env.local` | Real local values. Ignored by Git and Vercel uploads. |
| `.env.example` | Safe list of supported variable names. Contains no credentials. |
| `public.ts` | Firebase web configuration, available to browser code. |
| `server.ts` | Private Firebase Admin and session configuration, protected by `server-only`. |
| `credentials/` | Optional local service-account JSON files. Ignored by Git and Vercel uploads. |

The existing root `.env` was moved to `config/.env.local` without changing its contents. For a new checkout, copy `.env.example` to `.env.local` in this folder and fill in the values. Next.js loads this folder through `next.config.ts`. Environment variables supplied by the hosting provider take precedence. Restart the development server after editing local values.

## Public and private values

`FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET`, `FIREBASE_MESSAGING_SENDER_ID`, `FIREBASE_APP_ID`, and `FIREBASE_MEASUREMENT_ID` identify the Firebase web app and are intentionally included in browser JavaScript. They are not authorization credentials. Protect client access with deployed Firestore/Storage Security Rules and appropriate API-key restrictions; consider App Check. These web settings and `USE_FIREBASE_EMULATOR` are explicitly exposed through the allowlist in `next.config.ts`. Removing the prefix does not make them private. Never add a private key, session secret, LINE token, or LINE channel secret to that allowlist.

`FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`, and `AUTH_SECRET` belong on the server. `FIREBASE_PROJECT_ID` is shared by the browser and Firebase Admin SDK. Keep the private key quoted on one line, with literal `\n` between PEM lines. Use a long, randomly generated `AUTH_SECRET`, for example from `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`.

Do not import `server.ts` into a Client Component, export its contents from an API, return them as component props, or log them. Keep public and server imports separate; do not add a shared barrel export. Never put secrets in `next.config.ts`'s `env` option or inside `public/`.

An existing `PASS` variable is unused by the application. It was preserved during migration; it is not a supported login setting.

## Deploying on Vercel

1. Add the variables from `.env.example` to the project's Vercel Environment Variables settings. Use the corresponding real values from your private local file. Configure Production and Preview separately; use a separate Firebase project for previews when practical.
2. Supply `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, and `AUTH_SECRET` as server variables. Keep `GOOGLE_APPLICATION_CREDENTIALS` unset when using these three Firebase variables: a path on your computer will not exist in Vercel.
3. Supply the public Firebase variables before building. Rebuild after changing them, because Next.js embeds their values in browser assets.
4. Redeploy after changing server settings. Do not upload `.env.local`, service-account JSON, or certificates. `.vercelignore` excludes these local files from CLI deployments, and `.gitignore` excludes them from Git deployments.
5. If a private credential was previously committed, logged, or shared, revoke/rotate it in its provider. Ignoring a file does not remove old copies or revoke credentials. Rotating `AUTH_SECRET` invalidates existing signed sessions.

## Future LINE Messaging API integration

The example file reserves `LINE_CHANNEL_ACCESS_TOKEN` and `LINE_CHANNEL_SECRET`. Add their real values to this local file and the hosting provider's environment settings when implementing LINE. Add their server-only access in `server.ts` at that time; neither is required today. Send messages from server routes/jobs and verify webhook signatures using the channel secret before processing events. Never call the LINE Messaging API with the channel access token from browser code. A future LIFF app ID may be public; it is distinct from these secrets.

## Audit limits and remaining access-control issues

This repository has no Firestore/Storage Security Rules files, so deployed rules, App Check, IAM permissions, API-key restrictions, and existing Vercel settings cannot be verified from this checkout.

`POST /api/v1/products` currently calls the Firebase Admin SDK without verifying a session or role. Admin SDK calls bypass Firestore Security Rules, so this route needs server-side authorization before public deployment. The existing middleware only checks for the presence of `BMT_COOKIE` on admin pages; it excludes API routes and does not verify the signed session. These access-control issues require a separate authentication fix; moving configuration does not resolve them.

References: [Firebase API keys](https://firebase.google.com/docs/projects/api-keys), [Next.js environment variables](https://nextjs.org/docs/app/guides/environment-variables), [LINE webhook signatures](https://developers.line.biz/en/docs/messaging-api/verify-webhook-signature/).
