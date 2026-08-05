import https from 'https';
import fs from 'fs';

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', err => reject(err));
  });
}

function parseMonthHtml(html, year, month) {
  const result = [];
  const cellRegex = /<td[^>]*class="[^"]*cal-day[^"]*"[\s\S]*?<\/td>/gi;
  let match;
  
  while ((match = cellRegex.exec(html)) !== null) {
    const tdContent = match[0];
    
    // Extract day number
    const dayMatch = tdContent.match(/data-day="(\d+)"/) || tdContent.match(/class="main-day[^"]*">\s*(\d+)\s*<\/div>/);
    if (!dayMatch) continue;
    
    const dayNum = parseInt(dayMatch[1], 10);
    
    // Extract Nakshatra name
    const nakMatch = tdContent.match(/class="nakshatra-name">([^<]+)<\/span>/i);
    const nakshatra = nakMatch ? nakMatch[1].trim() : '';
    
    if (dayNum && nakshatra) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      result.push({ date: dateStr, day: dayNum, month, year, nakshatra });
    }
  }
  return result;
}

async function scrapeCalendar() {
  const calendarData = {};
  // Scrape 2025, 2026, 2027, 2028 (covers past, current, and future up to 2+ years)
  const years = [2025, 2026, 2027, 2028];
  
  for (const year of years) {
    for (let month = 1; month <= 12; month++) {
      const url = `https://www.prokerala.com/general/calendar/en-calendar.php?year=${year}&month=${month}&sb=1`;
      try {
        const html = await fetchPage(url);
        const monthDays = parseMonthHtml(html, year, month);
        monthDays.forEach(item => {
          calendarData[item.date] = item.nakshatra;
        });
        console.log(`[${year}-${String(month).padStart(2, '0')}] Got ${monthDays.length} Nakshatra days`);
      } catch (err) {
        console.error(`Failed ${year}-${month}:`, err.message);
      }
      await new Promise(r => setTimeout(r, 120));
    }
  }
  
  console.log(`Total dates scraped: ${Object.keys(calendarData).length}`);
  fs.writeFileSync('./src/lib/prokeralaCalendarData.json', JSON.stringify(calendarData, null, 2));
  console.log('Successfully saved to src/lib/prokeralaCalendarData.json');
}

scrapeCalendar();
