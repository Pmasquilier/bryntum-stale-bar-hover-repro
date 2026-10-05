// Drives the page the same way a hand does: rest the pointer on a bar, narrow the store, nudge by a pixel.
// Useful because the failure window is about 300ms wide, which is awkward to hit by hand on every try.
//
//   npm run dev        # in one terminal
//   npm run repro      # in another
import { chromium } from 'playwright-core';

const URL = process.env.REPRO_URL ?? 'http://localhost:5173/';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport : { width : 1280, height : 760 } });

const crashes = [];
page.on('pageerror', error => crashes.push(`${error.name}: ${error.message}\n${error.stack?.split('\n').slice(1, 4).join('\n')}`));

await page.goto(URL);
await page.locator('.b-sch-event-wrap').first().waitFor({ timeout : 60_000 });
await page.waitForTimeout(800);

const box = await page.locator('.b-sch-event-wrap').nth(40).boundingBox();
const x = Math.round(box.x + box.width / 2);
const y = Math.round(box.y + box.height / 2);

await page.mouse.move(x, y);
await page.evaluate(() => window.setData(1));

for (let i = 0; i < 120 && crashes.length === 0; i++) {
    await page.mouse.move(x + (i % 2), y);
}
await page.waitForTimeout(500);

console.log(crashes.length ? `reproduced\n\n${crashes[0]}` : 'no error');
await browser.close();
process.exit(crashes.length ? 0 : 1);
