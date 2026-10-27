import "server-only";

export const serverConfig = {
  authSecret: process.env.AUTH_SECRET,
  authCookieName: process.env.AUTH_COOKIE_NAME || "app_session",
  googleApplicationCredentials: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
};
