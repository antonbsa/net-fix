require('dotenv').config();
const { waitAndClick, getMainFrame } = require('./util');
const c = require('./constants');
const e = require('./elements');

async function resetNet(page) {
    const currentGateway = process.env.NEW_GATEWAY_ADDRESS;

    await page.goto(`http://${currentGateway}/login.htm`);

    await waitAndClick(page, e.loginBtn);
    await page.waitForNavigation();

    const frame = await getMainFrame(page);
    
    await waitAndClick(frame, e.maintenanceTab);
    await waitAndClick(frame, e.resetButton);
    
    await page.waitForNavigation({ timeout: c.MAX_TIMEOUT_APPLY_CONFIG });
};

exports.resetNet = resetNet;