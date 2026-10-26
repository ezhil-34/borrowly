/**
 * Borrowly Firebase Cloud Functions Entry Point
 * Wraps the existing Express API gateway as a single Cloud Function.
 */
const functions = require('firebase-functions');
const path = require('path');

// Set env vars from Firebase Functions config before requiring the app
// These come from: firebase functions:config:set key=value
const runtimeConfig = (() => {
  try { return functions.config(); } catch { return {}; }
})();

// Inject environment variables so existing server code works unchanged
process.env.JWT_SECRET     = process.env.JWT_SECRET     || (runtimeConfig.app && runtimeConfig.app.jwt_secret)     || 'borrowly-super-secure-production-key-2026';
process.env.FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || (runtimeConfig.firebase && runtimeConfig.firebase.project_id) || 'borrowly-deploy';
process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || (runtimeConfig.app && runtimeConfig.app.gemini_api_key) || '';
process.env.NODE_ENV       = 'production';

// ML service is not available in Firebase Functions — use fallback heuristics
// (the mlClient.js already handles this gracefully with try/catch)
process.env.ML_SERVICE_HOST = '127.0.0.1';
process.env.ML_SERVICE_PORT = '8000';

// Require the Express app (path goes up to the server folder)
const { createGatewayApp } = require('../server/gateway/gateway');

const app = createGatewayApp();

// Export as a single Cloud Function named 'api'
// Firebase Hosting rewrites /api/** → this function
exports.api = functions
  .runWith({
    timeoutSeconds: 60,
    memory: '512MB'
  })
  .https.onRequest(app);
