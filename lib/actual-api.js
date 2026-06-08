import actualApi from '@actual-app/api';
import path from 'path';
import fs from 'fs';

let isInitialized = false;

function getEnvVars() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return process.env;
  
  const envFile = fs.readFileSync(envPath, 'utf8');
  const env = { ...process.env };
  envFile.split('\n').forEach(line => {
    line = line.replace(/\r/g, '');
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      let val = match[2].trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      env[match[1].trim()] = val;
    }
  });
  return env;
}

export async function connectActual() {
  if (isInitialized) {
    try {
      await actualApi.sync();
    } catch (err) {
      console.warn("ActualBudget sync failed, ignoring:", err);
    }
    return;
  }
  
  const env = getEnvVars();
  const serverURL = env.ACTUAL_SERVER_URL;
  const password = env.ACTUAL_PASSWORD;
  const syncId = env.ACTUAL_SYNC_ID;
  const e2ePassword = env.ACTUAL_E2E_PASSWORD;
  
  if (!serverURL || !password || !syncId || serverURL === 'http://localhost:5006') {
    throw new Error("ActualBudget credentials missing or not configured in .env.local");
  }

  const dataDir = process.env.ACTUAL_DATA_DIR || path.join(process.cwd(), '.actual-data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Safely attempt connection
  await actualApi.init({
    dataDir,
    serverURL,
    password
  });
  
  if (e2ePassword) {
    await actualApi.downloadBudget(syncId, { password: e2ePassword });
  } else {
    await actualApi.downloadBudget(syncId);
  }
  
  isInitialized = true;
}

export async function getTransactions(accountId, sinceDate) {
  await connectActual();
  try {
    return await actualApi.getTransactions(accountId, sinceDate);
  } catch (error) {
    if (error.message && (error.message.includes('not open') || error.message.toLowerCase().includes('budget file is open'))) {
      isInitialized = false;
      await connectActual();
      return await actualApi.getTransactions(accountId, sinceDate);
    }
    throw error;
  }
}

export async function getAccounts() {
  await connectActual();
  try {
    return await actualApi.getAccounts();
  } catch (error) {
    if (error.message && (error.message.includes('not open') || error.message.toLowerCase().includes('budget file is open'))) {
      isInitialized = false;
      await connectActual();
      return await actualApi.getAccounts();
    }
    throw error;
  }
}

export async function shutdownActual() {
  if (isInitialized) {
    await actualApi.shutdown();
    isInitialized = false;
  }
}
