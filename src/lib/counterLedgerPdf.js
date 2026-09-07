// Render through the browser font system so names and the rupee symbol retain
// their glyphs without depending on the PDF reader's installed fonts.
export async function downloadCounterLedgerPdf({ counter, rows, filters, totals }) {
  const { jsPDF } = await import('jspdf')
  await document.fonts.ready
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  const width = 1190
  const height = 842
  const canvas = document.createElement('canvas')
  canvas.width = width * 2
  canvas.height = height * 2
  const ctx = canvas.getContext('2d')
  ctx.scale(2, 2)
  const columns = [155, 105, 180, 265, 130, 95, 180 - 80]
  const headings = ['Receipt', 'Date', 'Devotee', 'Seva / Offering', 'Method', 'Status', 'Amount']
  let y = 0
  let page = 0
  const wrap = (value, maxWidth) => {
    const lines = []
    for (const paragraph of String(value ?? '').split('\n')) {
      let line = ''
      for (const char of Array.from(paragraph)) {
        if (line && ctx.measureText(line + char).width > maxWidth) { lines.push(line); line = '' }
        line += char
      }
      lines.push(line)
    }
    return lines
  }
  const text = (value, x, top, size = 14, bold = false) => {
    ctx.font = `${bold ? 'bold ' : ''}${size}px sans-serif`
    ctx.fillStyle = '#17263a'
    ctx.fillText(String(value), x, top)
  }
  function beginPage() {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
    text('THEERTHA | Counter Ledger', 40, 42, 23, true)
    ctx.font = 'bold 16px sans-serif'
    const title = wrap(`${counter.templeName} · ${counter.name} · Counter ${counter.number} · ${counter.loginId}`, 1100)
    let top = 70
    title.forEach(line => { text(line, 40, top, 16, true); top += 20 })
    text(`Dates: ${filters.from || 'All dates'} to ${filters.to || 'All dates'} | Status: ${filters.status} | Method: ${filters.method}`, 40, top + 4)
    text(`Bookings: ${totals.count} | Total: ${totals.amount} | Paid: ${totals.paidCount} (${totals.paidAmount}) | Unpaid: ${totals.unpaidCount} (${totals.unpaidAmount})`, 40, top + 28)
    y = top + 45
    ctx.fillStyle = '#e9edf2'
    ctx.fillRect(40, y, 1030, 32)
    let x = 40
    headings.forEach((heading, index) => { text(heading, x + 6, y + 21, 13, true); x += columns[index] })
    y += 32
  }
  function finishPage() {
    text(`Generated ${new Date().toLocaleString('en-IN')} · Page ${page + 1}`, 40, height - 25, 11)
    if (page) pdf.addPage()
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight(), undefined, 'FAST')
    page += 1
  }
  beginPage()
  for (const row of rows) {
    ctx.font = '13px sans-serif'
    const cells = row.map((value, index) => wrap(value, columns[index] - 12))
    const lineCount = Math.max(...cells.map(cell => cell.length))
    let offset = 0
    while (offset < lineCount) {
      if (height - 55 - y < 30) { finishPage(); beginPage() }
      const count = Math.min(lineCount - offset, Math.floor((height - 55 - y - 12) / 18))
      let x = 40
      cells.forEach((lines, index) => {
        lines.slice(offset, offset + count).forEach((line, i) => text(line, x + 6, y + 19 + i * 18, 13))
        x += columns[index]
      })
      y += count * 18 + 12
      ctx.strokeStyle = '#dce1e8'
      ctx.beginPath(); ctx.moveTo(40, y); ctx.lineTo(1070, y); ctx.stroke()
      offset += count
    }
  }
  if (!rows.length) text('No receipts match the selected filters.', 46, y + 30)
  finishPage()
  const filename = `counter-${counter.number}-${counter.name}-ledger`.replace(/[^a-z0-9_-]+/gi, '-')
  pdf.save(`${filename}.pdf`)
}
