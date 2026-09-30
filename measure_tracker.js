const puppeteer = require('puppeteer-core');
const executablePath = '/snap/bin/chromium';
(async () => {
  const browser = await puppeteer.launch({ executablePath, headless: 'new', args:['--no-sandbox','--disable-setuid-sandbox','--disable-gpu'] });
  const page = await browser.newPage();
  const errs = [];
  page.on('console', m => { if (m.type()==='error') errs.push(m.text()); });
  page.on('pageerror', e => errs.push('PAGEERR: '+e.message));
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto('http://127.0.0.1:9240/index.html#tracker', { waitUntil: 'networkidle0', timeout: 30000 });
  // wait up to 8s for rows
  await page.waitForSelector('#viewTracker.active .tbl-wrap tbody tr', { timeout: 8000 }).catch(()=>{});
  await new Promise(r => setTimeout(r, 1000));
  const rep = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('#viewTracker .tbl-wrap tbody tr'));
    const de = document.documentElement;
    const backstop = document.querySelector('#viewTracker .tbl-wrap');
    const bsW = backstop ? Math.round(backstop.getBoundingClientRect().width) : null;
    const tWrap = document.querySelector('#viewTracker .tbl-wrap');
    // trailing gap = box width - table width
    const table = document.querySelector('#viewTracker .tbl-wrap table');
    const tW = table ? Math.round(table.getBoundingClientRect().width) : null;
    const gap = (bsW && tW) ? (bsW - tW) : null;
    return {
      pageHScroll: de.scrollWidth - de.clientWidth,
      rowCount: rows.length,
      backstopWidth: bsW,
      tableWidth: tW,
      trailingGap: gap,
      tableDisplay: table ? getComputedStyle(table).display : null,
      tableLayout: table ? getComputedStyle(table).tableLayout : null
    };
  });
  console.log('ERRORS:', JSON.stringify(errs, null, 2));
  console.log('REPORT:', JSON.stringify(rep, null, 2));
  await browser.close();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
