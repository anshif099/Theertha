import https from 'https';

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', err => reject(err));
  });
}

async function run() {
  try {
    const html = await fetchPage('https://www.prokerala.com/general/calendar/en-calendar.php?year=2026&month=8&sb=1');
    console.log('HTML length:', html.length);
    // Find nakshatra names in HTML
    const matches = html.match(/nakshatra[^\<]*/gi);
    console.log('Matches sample:', matches ? matches.slice(0, 10) : 'None');
    
    // Look for calendar table cells or day info
    const dayMatches = html.match(/<td[^>]*>[\s\S]*?<\/td>/g);
    console.log('Total td cells:', dayMatches ? dayMatches.length : 0);
    if (dayMatches) {
      dayMatches.slice(0, 15).forEach((td, i) => {
        if (td.includes('day-info') || td.includes('nakshatra')) {
          console.log(`Cell ${i}:`, td.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
        }
      });
    }
  } catch (e) {
    console.error(e);
  }
}

run();
