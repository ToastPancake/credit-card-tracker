import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const p = path.join(__dirname, '../lib/card-templates.json');
const data = JSON.parse(fs.readFileSync(p, 'utf8'));

for (const t of data) {
  if (t.credits) {
    for (const c of t.credits) {
      let f = (c.frequency || '').toLowerCase();
      if (f.includes('month')) c.frequency = 'Monthly';
      else if (f.includes('quarter')) c.frequency = 'Quarterly';
      else if (f.includes('semi')) c.frequency = 'Semi-Annual';
      else if (f.includes('4 year')) c.frequency = 'Every 4 Years';
      else c.frequency = 'Annual';

      // Custom anniversaries and recurring date-based credits
      const name = (c.name || '').toLowerCase();
      const notes = (c.notes || '').toLowerCase();
      if (name.includes('anniversary') || notes.includes('anniversary')) {
        c.resetType = 'Custom';
        c.resetAnchorDate = '';
      }
      if (name.includes('global entry') || name.includes('tsa precheck') || name.includes('clear')) {
        c.resetType = 'Custom';
        c.resetAnchorDate = '';
      }
    }
  }
}

fs.writeFileSync(p, JSON.stringify(data, null, 2));
console.log('Fixed card-templates.json');
