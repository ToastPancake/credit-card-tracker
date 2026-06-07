import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const p = path.join(__dirname, '../lib/card-templates.json');
const data = JSON.parse(fs.readFileSync(p, 'utf8'));

// 1. Standardize Names
for (const t of data) {
  t.name = t.name.replace('Amex Gold Card', 'Amex Gold');
  t.name = t.name.replace('Amex Green Card', 'Amex Green');
  t.name = t.name.replace('Amex Platinum Card', 'Amex Platinum');
  t.name = t.name.replace('Capital One Quicksilver', 'Quicksilver'); // To match others like SavorOne, Venture
  // We'll keep Capital One out of the name if possible? 
  // No, let's keep them as "Venture X", "Savor", "Quicksilver"
  t.name = t.name.replace(/^Capital One /, '');
  t.name = t.name.replace(/^Chase /, '');
  t.name = t.name.replace(/^Citi /, '');
  // Actually, wait. Having issuer prefixes makes the list easier to read?
  // User said "Amex Gold Card/Amex Platinum should be consistent."
  // So Amex Gold, Amex Green, Amex Platinum.
}

// Re-add Issuer Prefixes for consistency
for (const t of data) {
  if (t.issuer === 'Capital One' && !t.name.startsWith('Capital One')) t.name = `Capital One ${t.name}`;
  if (t.issuer === 'Chase' && !t.name.startsWith('Chase')) t.name = `Chase ${t.name}`;
  if (t.issuer === 'Citi' && !t.name.startsWith('Citi')) t.name = `Citi ${t.name}`;
  if (t.issuer === 'American Express' && !t.name.startsWith('Amex')) t.name = t.name.replace(/^American Express /, 'Amex ');
}

const feeMap = {
  "Amex Platinum": 695,
  "Amex Gold": 325,
  "Amex Green": 150,
  "Blue Cash Preferred": 95,
  "Amex Blue Cash Preferred": 95,
  "Blue Cash Everyday": 0,
  "Amex Blue Cash Everyday": 0,
  "Amex EveryDay Preferred": 95,
  "Hilton Honors Aspire": 550,
  "Amex Hilton Honors Aspire": 550,
  "Hilton Honors Surpass": 150,
  "Amex Hilton Honors Surpass": 150,
  "Marriott Bonvoy Brilliant": 650,
  "Amex Marriott Bonvoy Brilliant": 650,
  "Chase Sapphire Reserve": 550,
  "Chase Sapphire Preferred": 95,
  "Chase Freedom Flex": 0,
  "Chase Freedom Unlimited": 0,
  "Chase Ink Business Preferred": 95,
  "Chase Ink Business Cash": 0,
  "Chase Ink Business Unlimited": 0,
  "Chase United Explorer Card": 95,
  "Chase Marriott Bonvoy Boundless": 95,
  "Capital One Venture X": 395,
  "Capital One Venture X Business": 395,
  "Capital One Venture": 95,
  "Capital One VentureOne": 0,
  "Capital One Savor": 95,
  "Capital One SavorOne": 0,
  "Capital One Quicksilver": 0,
  "Citi Strata Premier": 95,
  "Citi Custom Cash": 0,
  "Citi Double Cash": 0,
  "Citi Rewards+": 0,
  "Citi AAdvantage Platinum Select": 99,
  "Citi AAdvantage Executive": 595,
  "Costco Anywhere Visa": 0,
  "Citi Costco Anywhere Visa": 0,
  "Discover IT": 0,
  "Discover it Cash Back": 0,
  "Wells Fargo Active Cash": 0,
  "Bilt Mastercard": 0
};

for (const t of data) {
  let fee = 0;
  for (const [k, v] of Object.entries(feeMap)) {
    if (t.name.toLowerCase() === k.toLowerCase()) {
      fee = v;
      break;
    }
  }
  t.annualFee = fee;
}

fs.writeFileSync(p, JSON.stringify(data, null, 2));
console.log('Fixed names and applied thorough AF assignments');
