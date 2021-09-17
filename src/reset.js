const Page = require('./core/page');
const e = require('./core/elements');
const c = require('./core/constants');
const p = require('./core/params');

async function reset(page) {
    const {
        shouldFix,
        newGatewayIp,
    } = p;

    try {
        page.log('starting reset')
        await page.goto(`http://${newGatewayIp}/login.htm`);
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
            await page.complete(false);
        }

    } catch (err) {
        await page.failure('Error when trying to reset modem', err);
    }
};

module.exports = exports = reset;