const fs = require('fs');
const api = require('@actual-app/api');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[match[1].trim()] = val;
  }
});

async function run() {
  try {
    console.log("Testing connection to:", env.ACTUAL_SERVER_URL);
    await api.init({
      dataDir: './.actual-data-test',
      serverURL: env.ACTUAL_SERVER_URL,
      password: env.ACTUAL_PASSWORD,
    });
    console.log("✅ Success! Successfully authenticated with ActualBudget server.");
    await api.shutdown();
  } catch (e) {
    console.error("❌ Authentication Error:", e.message);
    if (e.message.includes('invalid-password')) {
      console.error("The server actively rejected the password. Please verify that ACTUAL_PASSWORD is the login password for the web interface, not the End-to-End Encryption password.");
    }
  }
}
run();
