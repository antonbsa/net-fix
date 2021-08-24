require('dotenv').config();
const { waitAndClick, getMainFrame, finishAndSetSpinner } = require('./util');
const c = require('./constants');
const e = require('./elements');

async function resetNet(page, spinner) {
    const currentGateway = process.env.NEW_GATEWAY_ADDRESS;

    await page.goto(`http://${currentGateway}/login.htm`);

    await waitAndClick(page, e.loginBtn);
    await page.waitForNavigation();

    const frame = await getMainFrame(page);

    spinner = finishAndSetSpinner(spinner, 'Resetting modem configs')
    await waitAndClick(frame, e.maintenanceTab);
    await waitAndClick(frame, e.resetButton);

    spinner = finishAndSetSpinner(spinner, 'Applying default settings: it takes ~35sec', 35000)
    await page.waitForNavigation({ timeout: c.MAX_TIMEOUT_APPLY_CONFIG });
    spinner = finishAndSetSpinner(spinner, 'Default settings have applied!',)

    return spinner;
};

exports.resetNet = resetNet;