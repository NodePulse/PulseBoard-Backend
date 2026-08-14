// postman-sync.js
//
// Watches your NestJS source files for changes, pulls the live Swagger/OpenAPI
// JSON from your running app, converts it to a Postman collection, and pushes
// it to Postman via the API — so your collection updates automatically every
// time you save a file that changes a route.
//
// SETUP
// -----
// 1. npm install --save-dev chokidar openapi-to-postmanv2 dotenv
//    (Node 18+ has global fetch built in, no extra package needed for that)
//
// 2. Create a .env file in your project root:
//      POSTMAN_API_KEY=your_postman_api_key
//      POSTMAN_COLLECTION_UID=your_collection_uid
//      SWAGGER_JSON_URL=http://localhost:3000/api-json
//      WATCH_DIR=src
//      WATCH_GLOB=**/*.controller.ts
//
//    - Get POSTMAN_API_KEY: Postman -> Account settings (gear icon) -> API keys -> Generate.
//    - Get POSTMAN_COLLECTION_UID: First manually import your Swagger JSON into Postman
//      once (Import -> Link -> paste SWAGGER_JSON_URL) to create the collection.
//      Then open the collection -> "..." menu -> View more actions -> Share ->
//      the UID is in the URL, e.g. api.getpostman.com/collections/<UID>
//      Or run: curl -H "X-Api-Key: $POSTMAN_API_KEY" https://api.getpostman.com/collections
//      and copy the "uid" of the right collection.
//    - SWAGGER_JSON_URL: your NestJS app's raw OpenAPI JSON endpoint. If you set up
//      SwaggerModule.setup('api', app, document) in main.ts, the JSON is usually at
//      /api-json automatically (Nest exposes {path}-json alongside the UI).
//
// 3. Run your NestJS app in one terminal: npm run start:dev
//    Run this script in another terminal: npm run postman:sync
//
// It debounces rapid saves (e.g. save-all in your editor) so it doesn't spam the
// Postman API, and only pushes when the Swagger JSON actually changed.

const chokidar = require('chokidar');
const path = require('path');

const POSTMAN_API_KEY = process.env.POSTMAN_API_KEY;
const POSTMAN_COLLECTION_UID = process.env.POSTMAN_COLLECTION_UID;
const SWAGGER_JSON_URL = process.env.SWAGGER_JSON_URL || 'http://localhost:3000/api-json';
const WATCH_DIR = process.env.WATCH_DIR || 'src';
const WATCH_GLOB = process.env.WATCH_GLOB || '**/*.controller.ts';
const DEBOUNCE_MS = 1500;

if (!POSTMAN_API_KEY || !POSTMAN_COLLECTION_UID) {
  console.error('Missing POSTMAN_API_KEY or POSTMAN_COLLECTION_UID in .env — see comments at top of this file.');
  process.exit(1);
}

let lastSwaggerHash = null;
let debounceTimer = null;

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return h;
}

async function fetchSwaggerJson() {
  const res = await fetch(SWAGGER_JSON_URL);
  if (!res.ok) throw new Error(`Failed to fetch Swagger JSON: ${res.status} ${res.statusText}`);
  return res.json();
}

function convertToPostmanCollection(openapiSpec) {
  return new Promise((resolve, reject) => {
    const Converter = require('openapi-to-postmanv2');
    Converter.convert(
      { type: 'json', data: openapiSpec },
      { folderStrategy: 'Tags' },
      (err, result) => {
        if (err) return reject(err);
        if (!result.result) return reject(new Error(JSON.stringify(result.reason || result)));
        resolve(result.output[0].data);
      },
    );
  });
}

async function pushToPostman(collection) {
  const res = await fetch(`https://api.getpostman.com/collections/${POSTMAN_COLLECTION_UID}`, {
    method: 'PUT',
    headers: {
      'X-Api-Key': POSTMAN_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ collection }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Postman API error ${res.status}: ${body}`);
  }
  return res.json();
}

async function syncOnce() {
  try {
    const swagger = await fetchSwaggerJson();
    const swaggerStr = JSON.stringify(swagger);
    const currentHash = hash(swaggerStr);

    if (currentHash === lastSwaggerHash) {
      console.log(`[${new Date().toLocaleTimeString()}] No route changes detected, skipping sync.`);
      return;
    }

    console.log(`[${new Date().toLocaleTimeString()}] Route changes detected, converting + pushing to Postman...`);
    const collection = await convertToPostmanCollection(swagger);
    await pushToPostman(collection);
    lastSwaggerHash = currentHash;
    console.log(`[${new Date().toLocaleTimeString()}] Postman collection updated successfully.`);
  } catch (err) {
    console.error(`[${new Date().toLocaleTimeString()}] Sync failed:`, err.message);
    console.error('Is your NestJS app running and reachable at', SWAGGER_JSON_URL, '?');
  }
}

function scheduleSync() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(syncOnce, DEBOUNCE_MS);
}

const watchPattern = path.join(WATCH_DIR, WATCH_GLOB).replace(/\\/g, '/');

console.log(`Watching "${watchPattern}" for changes (controller files only)...`);
console.log(`Swagger source: ${SWAGGER_JSON_URL}`);
console.log(`Postman collection: ${POSTMAN_COLLECTION_UID}`);

chokidar
  .watch(watchPattern, { ignoreInitial: true, ignored: /node_modules|dist/ })
  .on('all', (event, filePath) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${event}: ${filePath}`);
    scheduleSync();
  });

// Run an initial sync on startup too, in case the app is already running.
syncOnce();
