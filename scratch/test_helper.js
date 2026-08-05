import { ALL_27_NAKSHATRAS, getRepeatingNakshatraDates } from '../src/lib/nakshatraHelper.js';

console.log('Total preloaded Nakshatras:', ALL_27_NAKSHATRAS.length);

const star = 'Karthika';
const startDate = '2026-08-05';
const months6 = getRepeatingNakshatraDates(star, startDate, 6);
console.log(`\n6 Months Repeat Dates for "${star}" starting ${startDate}:`);
months6.forEach((r, i) => console.log(` Month ${i+1}: ${r.date} (${r.formattedDate})`));

const months12 = getRepeatingNakshatraDates(star, startDate, 12);
console.log(`\n12 Months (1 Year) Repeat Dates for "${star}" starting ${startDate}:`);
months12.forEach((r, i) => console.log(` Month ${i+1}: ${r.date} (${r.formattedDate})`));
