import calendarData from './prokeralaCalendarData.json' with { type: 'json' };

export const ALL_27_NAKSHATRAS = [
  { id: 'star-1', name: 'Ashwathi (Aswini)', shortName: 'Ashwathi', altNames: ['ashwathi', 'aswini', 'ashwini', 'aswathi'] },
  { id: 'star-2', name: 'Bharani', shortName: 'Bharani', altNames: ['bharani'] },
  { id: 'star-3', name: 'Karthika (Krittika)', shortName: 'Karthika', altNames: ['karthika', 'krittika', 'kartika'] },
  { id: 'star-4', name: 'Rohini', shortName: 'Rohini', altNames: ['rohini'] },
  { id: 'star-5', name: 'Makayiram (Mrigashira)', shortName: 'Makayiram', altNames: ['makayiram', 'mrigashira', 'makayiryam', 'mrigasira'] },
  { id: 'star-6', name: 'Thiruvathira (Ardra)', shortName: 'Thiruvathira', altNames: ['thiruvathira', 'ardra', 'thiruvathirai'] },
  { id: 'star-7', name: 'Punartham (Punarvasu)', shortName: 'Punartham', altNames: ['punartham', 'punarvasu'] },
  { id: 'star-8', name: 'Pooyyam (Pushya)', shortName: 'Pooyyam', altNames: ['pooyyam', 'pushya', 'pooyam'] },
  { id: 'star-9', name: 'Ayilyam (Ashlesha)', shortName: 'Ayilyam', altNames: ['ayilyam', 'ashlesha', 'ayilyam'] },
  { id: 'star-10', name: 'Makam (Magha)', shortName: 'Makam', altNames: ['makam', 'magha'] },
  { id: 'star-11', name: 'Pooram (Purva Phalguni)', shortName: 'Pooram', altNames: ['pooram', 'purva phalguni', 'purvaphalguni'] },
  { id: 'star-12', name: 'Uthram (Uttara Phalguni)', shortName: 'Uthram', altNames: ['uthram', 'uttara phalguni', 'uttaraphalguni', 'uttram'] },
  { id: 'star-13', name: 'Atham (Hasta)', shortName: 'Atham', altNames: ['atham', 'hasta'] },
  { id: 'star-14', name: 'Chithira (Chitra)', shortName: 'Chithira', altNames: ['chithira', 'chitra'] },
  { id: 'star-15', name: 'Chothi (Swati)', shortName: 'Chothi', altNames: ['chothi', 'swati'] },
  { id: 'star-16', name: 'Vishakam (Vishakha)', shortName: 'Vishakam', altNames: ['vishakam', 'vishakha', 'visakam'] },
  { id: 'star-17', name: 'Anizham (Anuradha)', shortName: 'Anizham', altNames: ['anizham', 'anuradha'] },
  { id: 'star-18', name: 'Thrikketta (Jyeshtha)', shortName: 'Thrikketta', altNames: ['thrikketta', 'jyeshtha', 'thriketta'] },
  { id: 'star-19', name: 'Moolam (Mula)', shortName: 'Moolam', altNames: ['moolam', 'mula'] },
  { id: 'star-20', name: 'Pooradam (Purva Ashadha)', shortName: 'Pooradam', altNames: ['pooradam', 'purva ashadha', 'purvasadha'] },
  { id: 'star-21', name: 'Uthradam (Uttara Ashadha)', shortName: 'Uthradam', altNames: ['uthradam', 'uttara ashadha', 'uttarasadha'] },
  { id: 'star-22', name: 'Thiruvonam (Shravana)', shortName: 'Thiruvonam', altNames: ['thiruvonam', 'shravana', 'sravana'] },
  { id: 'star-23', name: 'Avittam (Dhanishta)', shortName: 'Avittam', altNames: ['avittam', 'dhanishta'] },
  { id: 'star-24', name: 'Chathayam (Shatabhisha)', shortName: 'Chathayam', altNames: ['chathayam', 'shatabhisha', 'satabhisha'] },
  { id: 'star-25', name: 'Pooruruttathi (Purva Bhadrapada)', shortName: 'Pooruruttathi', altNames: ['pooruruttathi', 'purva bhadrapada', 'purvabhadra'] },
  { id: 'star-26', name: 'Uthrattathi (Uttara Bhadrapada)', shortName: 'Uthrattathi', altNames: ['uthrattathi', 'uttara bhadrapada', 'uttarabhadra'] },
  { id: 'star-27', name: 'Revathi', shortName: 'Revathi', altNames: ['revathi'] }
];

/**
 * Matches a user star string or star ID to the standard Nakshatra entry.
 */
export function normalizeNakshatraName(starInput) {
  if (!starInput) return null;
  const inputStr = String(starInput).trim().toLowerCase();
  
  for (const n of ALL_27_NAKSHATRAS) {
    if (n.id.toLowerCase() === inputStr) return n;
    if (n.name.toLowerCase() === inputStr) return n;
    if (n.shortName.toLowerCase() === inputStr) return n;
    for (const alt of n.altNames) {
      if (inputStr.includes(alt) || alt.includes(inputStr)) return n;
    }
  }
  return null;
}

/**
 * Astronomical Fallback for Nakshatra calculation if date is beyond dataset.
 */
function getJulianDay(date) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate() + (date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600) / 24;

  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);

  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + B - 1524.5;
}

function getLahiriAyanamsha(jd) {
  const T = (jd - 2451545.0) / 36525;
  return 23.85 + (T * 36525 * 50.290966) / 3600;
}

function getMoonSiderealLongitude(jd) {
  const T = (jd - 2451545.0) / 36525;
  let L = 218.3164477 + 481267.88123421 * T - 0.0015786 * T * T;
  let M = 134.9633964 + 477198.8675055 * T + 0.0087414 * T * T;
  let Msun = 357.5291092 + 35999.0502909 * T - 0.0001536 * T * T;
  let F = 93.272095 + 483202.0175233 * T - 0.0036539 * T * T;
  let D = 297.8501921 + 445267.1114034 * T - 0.0018819 * T * T;
  const toRad = Math.PI / 180;

  let dL = 6.288774 * Math.sin(M * toRad)
         + 1.274027 * Math.sin((2*D - M) * toRad)
         + 0.658314 * Math.sin(2*D * toRad)
         + 0.213618 * Math.sin(2*M * toRad)
         - 0.185116 * Math.sin(Msun * toRad)
         - 0.114332 * Math.sin(2*F * toRad)
         + 0.058793 * Math.sin((2*D - 2*M) * toRad)
         + 0.057066 * Math.sin((2*D - Msun - M) * toRad)
         + 0.053322 * Math.sin((2*D + M) * toRad);

  let tropicalLong = (L + dL) % 360;
  if (tropicalLong < 0) tropicalLong += 360;

  let ayanamsha = getLahiriAyanamsha(jd);
  let siderealLong = (tropicalLong - ayanamsha) % 360;
  if (siderealLong < 0) siderealLong += 360;

  return siderealLong;
}

function getNakshatraForDateAstro(dateStr) {
  const d = new Date(dateStr + 'T00:30:00Z');
  const jd = getJulianDay(d);
  const siderealLong = getMoonSiderealLongitude(jd);
  const nakIdx = Math.floor(siderealLong / (360 / 27));
  return ALL_27_NAKSHATRAS[nakIdx];
}

/**
 * Gets Nakshatra for a specific date (Format YYYY-MM-DD).
 * Checks Prokerala dataset first, then astronomical fallback.
 */
export function getNakshatraForDate(dateStr) {
  if (calendarData && calendarData[dateStr]) {
    const scrapedName = calendarData[dateStr];
    const match = normalizeNakshatraName(scrapedName);
    if (match) return match;
  }
  return getNakshatraForDateAstro(dateStr);
}

/**
 * Calculates upcoming repeating dates for a selected Nakshatra.
 * @param {string|object} starInput - Star object or name or ID
 * @param {string} startDateStr - YYYY-MM-DD starting date
 * @param {number} monthCount - Number of months to schedule (e.g. 1, 3, 6, 12)
 * @returns {Array<{ date: string, formattedDate: string, monthName: string, nakshatra: object, isFirst: boolean }>}
 */
export function getRepeatingNakshatraDates(starInput, startDateStr, monthCount = 6) {
  const targetStar = normalizeNakshatraName(starInput) || ALL_27_NAKSHATRAS[0];
  const start = startDateStr ? new Date(startDateStr) : new Date();
  
  let currentYear = start.getFullYear();
  let currentMonth = start.getMonth(); // 0-indexed
  
  const results = [];

  for (let m = 0; m < monthCount; m++) {
    const targetY = currentYear + Math.floor((currentMonth + m) / 12);
    const targetM = ((currentMonth + m) % 12) + 1; // 1-12
    const totalDaysInMonth = new Date(targetY, targetM, 0).getDate();

    let foundDateForMonth = null;

    // Scan each day of target month to find matching Nakshatra
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dateStr = `${targetY}-${String(targetM).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      // For the first month (m === 0), don't pick dates before startDateStr
      if (m === 0 && dateStr < startDateStr) continue;

      const dayStar = getNakshatraForDate(dateStr);
      if (dayStar && dayStar.id === targetStar.id) {
        foundDateForMonth = dateStr;
        break; // Take the first occurrence in that calendar month
      }
    }

    // Fallback if not found in first pass of month (e.g. month boundaries)
    if (!foundDateForMonth) {
      // Find closest date in that month by astronomical distance
      let minDistance = 999;
      for (let day = 1; day <= totalDaysInMonth; day++) {
        const dateStr = `${targetY}-${String(targetM).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayStar = getNakshatraForDate(dateStr);
        const targetIdx = parseInt(targetStar.id.replace('star-', ''), 10) - 1;
        const currentIdx = dayStar ? parseInt(dayStar.id.replace('star-', ''), 10) - 1 : 0;
        const dist = Math.abs((currentIdx - targetIdx + 27) % 27);
        if (dist < minDistance) {
          minDistance = dist;
          foundDateForMonth = dateStr;
        }
      }
    }

    if (foundDateForMonth) {
      const dObj = new Date(foundDateForMonth + 'T00:00:00');
      const formattedDate = dObj.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
      const monthName = dObj.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

      results.push({
        date: foundDateForMonth,
        formattedDate,
        monthName,
        nakshatra: targetStar,
        monthIndex: m + 1
      });
    }
  }

  return results;
}
