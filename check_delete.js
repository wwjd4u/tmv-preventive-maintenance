const puppeteer = require('puppeteer-core');
const executablePath = '/snap/bin/chromium';
(async () => {
  const browser = await puppeteer.launch({ executablePath, headless: 'new', args:['--no-sandbox','--disable-setuid-sandbox','--disable-gpu'] });
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERR: '+e.message));
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto('http://127.0.0.1:9240/index.html#tracker', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1800));
  const rep = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('#viewTracker .tbl-wrap tbody tr'));
    const r0 = rows[0];
    const completedCell = r0 ? r0.children[5] : null;
    const completedText = completedCell ? completedCell.textContent.trim() : null;
    const actionsTd = r0 ? r0.querySelector('td.tk-actions') : null;
    const delBtn = actionsTd ? actionsTd.querySelector('button.danger') : null;
    const viewBtn = actionsTd ? actionsTd.querySelector('button.ghost') : null;
    let deleteClipped = null, tdW = null, contentW = null;
    if (actionsTd) { tdW = Math.round(actionsTd.getBoundingClientRect().width); contentW = Math.round(actionsTd.scrollWidth); deleteClipped = contentW > tdW; }
    const de = document.documentElement;
    return {
      isAdmin: (typeof isAdmin==='function') ? isAdmin() : 'n/a',
      rowCount: rows.length,
      completedSample: completedText,
      completedHasTime: completedText ? /[0-9]{1,2}:[0-9]{2}/.test(completedText) : null,
      viewBtnPresent: !!viewBtn,
      deleteBtnPresent: !!delBtn,
      deleteBtnText: delBtn ? delBtn.textContent.trim() : null,
      actionsTdWidth: tdW,
      actionsContentWidth: contentW,
      deleteClipped,
      pageHScroll: de.scrollWidth - de.clientWidth
    };
  });
  console.log('ERRORS:', JSON.stringify(errs));
  console.log('REPORT:', JSON.stringify(rep, null, 2));
  await browser.close();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
