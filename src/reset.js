require('dotenv').config();
const c = require('./constants');
const e = require('./elements');
const Page = require('./page');

async function resetNet(page) {
    try {
        const currentGateway = process.env.NEW_GATEWAY_ADDRESS;

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
    } catch (err) {
        console.log('Error when trying to reset modem');
        console.log(err);
    }
};

exports.resetNet = resetNet;