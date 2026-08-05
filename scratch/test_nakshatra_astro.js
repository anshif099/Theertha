// Test Panchangam / Nakshatra astronomical calculation
// Lahiri Ayanamsha & Ecliptic Moon Longitude calculation

const NAKSHATRAS = [
  { id: 'star-1', name: 'Ashwathi (Aswini)', enName: 'Ashwathi', altName: 'Aswini' },
  { id: 'star-2', name: 'Bharani', enName: 'Bharani', altName: 'Bharani' },
  { id: 'star-3', name: 'Karthika (Krittika)', enName: 'Karthika', altName: 'Krittika' },
  { id: 'star-4', name: 'Rohini', enName: 'Rohini', altName: 'Rohini' },
  { id: 'star-5', name: 'Makayiram (Mrigashira)', enName: 'Makayiram', altName: 'Mrigashira' },
  { id: 'star-6', name: 'Thiruvathira (Ardra)', enName: 'Thiruvathira', altName: 'Ardra' },
  { id: 'star-7', name: 'Punartham (Punarvasu)', enName: 'Punartham', altName: 'Punarvasu' },
  { id: 'star-8', name: 'Pooyyam (Pushya)', enName: 'Pooyyam', altName: 'Pushya' },
  { id: 'star-9', name: 'Ayilyam (Ashlesha)', enName: 'Ayilyam', altName: 'Ashlesha' },
  { id: 'star-10', name: 'Makam (Magha)', enName: 'Makam', altName: 'Magha' },
  { id: 'star-11', name: 'Pooram (Purva Phalguni)', enName: 'Pooram', altName: 'Purva Phalguni' },
  { id: 'star-12', name: 'Uthram (Uttara Phalguni)', enName: 'Uthram', altName: 'Uttara Phalguni' },
  { id: 'star-13', name: 'Atham (Hasta)', enName: 'Atham', altName: 'Hasta' },
  { id: 'star-14', name: 'Chithira (Chitra)', enName: 'Chithira', altName: 'Chitra' },
  { id: 'star-15', name: 'Chothi (Swati)', enName: 'Chothi', altName: 'Swati' },
  { id: 'star-16', name: 'Vishakam (Vishakha)', enName: 'Vishakam', altName: 'Vishakha' },
  { id: 'star-17', name: 'Anizham (Anuradha)', enName: 'Anizham', altName: 'Anuradha' },
  { id: 'star-18', name: 'Thrikketta (Jyeshtha)', enName: 'Thrikketta', altName: 'Jyeshtha' },
  { id: 'star-19', name: 'Moolam (Mula)', enName: 'Moolam', altName: 'Mula' },
  { id: 'star-20', name: 'Pooradam (Purva Ashadha)', enName: 'Pooradam', altName: 'Purva Ashadha' },
  { id: 'star-21', name: 'Uthradam (Uttara Ashadha)', enName: 'Uthradam', altName: 'Uttara Ashadha' },
  { id: 'star-22', name: 'Thiruvonam (Shravana)', enName: 'Thiruvonam', altName: 'Shravana' },
  { id: 'star-23', name: 'Avittam (Dhanishta)', enName: 'Avittam', altName: 'Dhanishta' },
  { id: 'star-24', name: 'Chathayam (Shatabhisha)', enName: 'Chathayam', altName: 'Shatabhisha' },
  { id: 'star-25', name: 'Pooruruttathi (Purva Bhadrapada)', enName: 'Pooruruttathi', altName: 'Purva Bhadrapada' },
  { id: 'star-26', name: 'Uthrattathi (Uttara Bhadrapada)', enName: 'Uthrattathi', altName: 'Uttara Bhadrapada' },
  { id: 'star-27', name: 'Revathi', enName: 'Revathi', altName: 'Revathi' }
];

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
  // Lahiri Ayanamsha approximation: ~23.85 degrees in 2000, increases ~50.29" per year
  return 23.85 + (T * 36525 * 50.290966) / 3600;
}

function getMoonLongitude(jd) {
  const T = (jd - 2451545.0) / 36525;

  // Mean longitude of Moon
  let L = 218.3164477 + 481267.88123421 * T - 0.0015786 * T * T;
  // Mean anomaly of Moon
  let M = 134.9633964 + 477198.8675055 * T + 0.0087414 * T * T;
  // Mean anomaly of Sun
  let Msun = 357.5291092 + 35999.0502909 * T - 0.0001536 * T * T;
  // Moon's argument of latitude
  let F = 93.272095 + 483202.0175233 * T - 0.0036539 * T * T;
  // Mean elongation of Moon
  let D = 297.8501921 + 445267.1114034 * T - 0.0018819 * T * T;

  const toRad = Math.PI / 180;

  // Major periodic terms in longitude (in degrees)
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

function getNakshatraForDate(dateStr) {
  // Compute around 6:00 AM IST (00:30 UTC) for Indian Sunrise / Day Nakshatra
  const d = new Date(dateStr + 'T00:30:00Z');
  const jd = getJulianDay(d);
  const siderealLong = getMoonLongitude(jd);
  const nakIdx = Math.floor(siderealLong / (360 / 27));
  return NAKSHATRAS[nakIdx];
}

console.log('Today (2026-08-05):', getNakshatraForDate('2026-08-05').name);
console.log('2026-08-06:', getNakshatraForDate('2026-08-06').name);
