import db from '../lib/db.js';

console.log('Migrating intro bonuses...');

// 1. Get all cards with a SUB
const cards = db.prepare('SELECT id, name, subSpendRequirement, subReward, subDeadline FROM cards').all();

const insertBonus = db.prepare(`
  INSERT INTO intro_bonuses (id, cardId, type, description, deadline, spendRequirement, rewardAmount)
  VALUES (@id, @cardId, @type, @description, @deadline, @spendRequirement, @rewardAmount)
`);

let count = 0;
for (const card of cards) {
  if (card.subSpendRequirement > 0 || (card.subReward && card.subReward.trim() !== '')) {
    insertBonus.run({
      id: Math.random().toString(36).substr(2, 9),
      cardId: card.id,
      type: 'SpendReward',
      description: 'Sign-Up Bonus',
      deadline: card.subDeadline || null,
      spendRequirement: card.subSpendRequirement || 0,
      rewardAmount: card.subReward || null
    });
    count++;
  }
}

console.log(`Migrated ${count} sign-up bonuses successfully.`);
