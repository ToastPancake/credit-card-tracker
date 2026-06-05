const fs = require('fs');
const api = require('@actual-app/api');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  line = line.replace(/\r/g, '');
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[match[1].trim()] = val;
  }
});

async function run() {
  console.log("1. Starting initialization with Server URL:", env.ACTUAL_SERVER_URL);
  try {
    await api.init({
      dataDir: './.actual-data-debug',
      serverURL: env.ACTUAL_SERVER_URL,
      password: env.ACTUAL_PASSWORD,
    });
    console.log("✅ Step 1 (Server Auth): SUCCESS! Your Server Password is correct.");
  } catch (e) {
    console.error("❌ Step 1 (Server Auth): FAILED -", e.message);
    return; // Stop here if server auth fails
  }

  console.log("\n2. Attempting to download budget with Sync ID:", env.ACTUAL_SYNC_ID);
  try {
    if (env.ACTUAL_E2E_PASSWORD) {
      console.log("   Using End-to-End Encryption Password...");
      await api.downloadBudget(env.ACTUAL_SYNC_ID, { password: env.ACTUAL_E2E_PASSWORD });
    } else {
      console.log("   No End-to-End Encryption Password provided...");
      await api.downloadBudget(env.ACTUAL_SYNC_ID);
    }
    console.log("✅ Step 2 (Budget Download): SUCCESS! Everything works perfectly.");
    await api.shutdown();
  } catch (e) {
    console.error("❌ Step 2 (Budget Download): FAILED -", e.message);
    if (e.message.includes('invalid-password') || e.message.includes('password')) {
      console.error("   --> This means your End-to-End Encryption Password is wrong (or you provided one when you shouldn't have).");
    } else {
      console.error("   --> This usually means your Sync ID is incorrect.");
    }
  }
}
run();
