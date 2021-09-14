const Page = require('./core/page');
const e = require('./core/elements');
const c = require('./core/constants');

async function reset(page, browser) {
    const currentGateway = process.env.NEW_GATEWAY_ADDRESS;
    const shouldFix = process.argv[2] === '--fix';

    try {
        await page.goto(`http://${currentGateway}/login.htm`);
        await page.waitAndClick(e.loginBtn);
        await page.waitForNavigation();
        await page.waitForSelector(e.mainFrame);

        const frame = new Page(await page.getMainFrame());

        page.finishAndSetSpinner('Resetting modem configs');
        await frame.waitAndClick(e.maintenanceTab);
        await frame.waitAndClick(e.resetButton);

        page.finishAndSetSpinner('Applying default settings: it takes ~35sec', 35000);
        await page.waitForNavigation(c.MAX_TIMEOUT_APPLY_CONFIG);
        page.finishAndSetSpinner('Default settings have been applied!');
        if (!shouldFix) {
            await page.spinnerSucceed();
            await browser.close();
            process.exit(0);
        }

    } catch (err) {
        await browser.close();
        page.spinnerFailure();
        console.log('Error when trying to reset modem');
        console.log(err);
    }
};

module.exports = exports = reset;