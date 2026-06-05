import { getAccounts } from '../lib/actual-api.js';

async function test() {
  try {
    const accounts = await getAccounts();
    console.log(accounts.length, "accounts found");
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}
test();
