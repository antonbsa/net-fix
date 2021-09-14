require('dotenv').config();
const reset = require('./reset');
const fix = require('./fix');

const puppeteer = require('puppeteer');
const Page = require('./core/page');
const p = require('./core/params');

(async () => {
    const {
        debugMode,
        shouldFix,
        shouldReset,
    } = p;

    let mainPage;
    const browser = await puppeteer.launch({
        headless: (debugMode) ? false : true,
        defaultViewport: null
    });

    try {
        mainPage = new Page(await browser.newPage());
        mainPage.startSpinner('Acessing modem page');
        // confirm browser dialogs
        mainPage.page.on('dialog', async dialog => {
            await dialog.accept();
        });

        if (shouldReset) await reset(mainPage, browser);
        if (shouldFix) await fix(mainPage, browser);

    } catch (err) {
        await browser.close();
        mainPage.spinnerFailure();
        console.error(err);
        process.exit(1);
    }
})();