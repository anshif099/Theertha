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
  const html = await fetchPage('https://www.prokerala.com/general/calendar/en-calendar.php?year=2026&month=8&sb=1');
  const cells = html.match(/<td[^>]*class="[^"]*cal-day[^"]*"[^>]*>[\s\S]*?<\/td>/gi);
  if (cells && cells.length > 0) {
    console.log('Sample Cell HTML:\n', cells[0]);
  }
}

run();
