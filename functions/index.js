import { onRequest } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';
import { app } from './server.js';

// Configure Cloud Functions v2 options
setGlobalOptions({
  maxInstances: 10,
  region: 'us-central1'
});

// Export the Cloud Function named 'api' matching the rewrite rule in firebase.json:
// { "source": "/api/**", "function": "api" }
export const api = onRequest({ cors: true }, app);
