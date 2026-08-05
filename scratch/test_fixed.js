import { getRepeatingFixedDates, getRepeatingNakshatraDates } from '../src/lib/nakshatraHelper.js';

const startDate = '2026-08-06';
const months6Fixed = getRepeatingFixedDates(startDate, 6);
console.log(`\n6 Months Repeat Dates on Fixed Day 6th of Every Month starting ${startDate}:`);
months6Fixed.forEach((r, i) => console.log(` Month ${i+1}: ${r.date} (${r.formattedDate})`));

const months6Nak = getRepeatingNakshatraDates('Karthika', startDate, 6);
console.log(`\n6 Months Repeat Dates on Karthika Nakshatra starting ${startDate}:`);
months6Nak.forEach((r, i) => console.log(` Month ${i+1}: ${r.date} (${r.formattedDate})`));
