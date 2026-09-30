const puppeteer = require('puppeteer-core');
const executablePath = '/snap/bin/chromium';
(async () => {
  const browser = await puppeteer.launch({ executablePath, headless: 'new', args:['--no-sandbox','--disable-setuid-sandbox','--disable-gpu'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 820 });
  await page.goto('http://127.0.0.1:9240/index.html#tracker', { waitUntil: 'networkidle0', timeout: 30000 });
  await page.waitForSelector('#viewTracker.active .tbl-wrap table', { timeout: 15000 }).catch(()=>{});
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: '/tmp/tracker.png', fullPage: false });
  await browser.close();
  console.log('shot saved');
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
