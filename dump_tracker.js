const puppeteer = require('puppeteer-core');
const executablePath = '/snap/bin/chromium';
(async () => {
  const browser = await puppeteer.launch({ executablePath, headless: 'new', args:['--no-sandbox','--disable-setuid-sandbox','--disable-gpu'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto('http://127.0.0.1:9240/index.html#tracker', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2500));
  const rep = await page.evaluate(() => {
    const v = document.getElementById('viewTracker');
    return {
      viewActive: v ? v.classList.contains('active') : 'no #viewTracker',
      viewHTML: v ? v.innerHTML.slice(0, 400) : null,
      cardsHTML: (document.getElementById('cards')||{}).innerHTML ? document.getElementById('cards').innerHTML.slice(0,300) : 'NO cards el or empty',
      hasCards: !!document.getElementById('cards')
    };
  });
  console.log(JSON.stringify(rep, null, 2));
  await browser.close();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
