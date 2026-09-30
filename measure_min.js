const puppeteer = require('puppeteer-core');
const executablePath = '/snap/bin/chromium';
(async () => {
  const browser = await puppeteer.launch({ executablePath, headless: 'new', args:['--no-sandbox','--disable-setuid-sandbox','--disable-gpu'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 2000, height: 1000 }); // wide so nothing clips
  await page.goto('http://127.0.0.1:9240/index.html#tracker', { waitUntil: 'networkidle0', timeout: 30000 });
  await page.waitForSelector('#viewTracker.active .tbl-wrap table', { timeout: 15000 }).catch(()=>{});
  await new Promise(r => setTimeout(r, 1500));
  const rep = await page.evaluate(() => {
    const table = document.querySelector('#viewTracker .tbl-wrap table');
    const prevW = table.style.width;
    table.style.width = 'auto'; // size to content
    const nat = Math.round(table.offsetWidth);
    table.style.width = prevW;
    // also measure available compact container width (main max-width 1100 minus padding)
    const main = document.querySelector('main');
    const mw = main ? Math.round(main.getBoundingClientRect().width) : null;
    return { naturalTableWidth: nat, mainWidth: mw };
  });
  console.log(JSON.stringify(rep, null, 2));
  await browser.close();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
