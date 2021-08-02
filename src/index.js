require('dotenv').config();
const puppeteer = require('puppeteer');
const { waitAndClick, waitAndClickElement, waitAndType, getMainFrame, findWifiInTable } = require('./util');
const c = require('./constants');
const e = require('./elements');

(async () => {
    const defaultGatewayIp = process.env.GATEWAY_BASE;
    const newGatewayIp = process.env.NEW_GATEWAY_ADDRESS;
    const wifiName = process.env.WIRELESS_NAME;
    const wifiPassword = process.env.WIRELESS_PASSWORD;
    const channel = process.env.WIRELESS_CHANNEL;
    const siteSurveyCount = process.env.SITE_SURVEY_COUNT_TRY;

    try {
        const browser = await puppeteer.launch({
            headless: true,
            defaultViewport: null
        });
        const page = await browser.newPage();
        await page.goto(`http://${defaultGatewayIp}/login.htm`);
        // confirm browser dialogs
        page.on('dialog', async dialog => {
            await dialog.accept();
        });

        // Enter router configs
        await waitAndClick(page, e.loginBtn);
        await page.waitForNavigation();

        const frame = await getMainFrame(page);

        // Go to wireless tab and set the channel
        await waitAndClickElement(frame, e.wirelessTab);
        await frame.waitForSelector(e.channelSelect, { visible: true });
        await frame.select(e.channelSelect, channel);
        await waitAndClick(frame, e.saveWirelessTab);

        // Go to wireless repetear tab
        await waitAndClick(frame, e.wirelessRepeaterTab);

        // Enable repeater
        await frame.waitForSelector(e.siteSurveyButton, { visible: true });
        const repeaterModeChecked = await frame.evaluate((repeaterModeSelector) => {
            return document.querySelectorAll(repeaterModeSelector)[0].value == 'on';
        }, e.repeaterModeCheckbox);
        // console.log({ repeaterModeChecked })
        if (!repeaterModeChecked) await waitAndClick(frame, e.repeaterModeCheckbox);

        // repeat N times to find wifi - it takes a while to apply the channel change
        let COUNT_TRY = siteSurveyCount;
        let founded = false;
        while (COUNT_TRY != 0) {
            await waitAndClick(frame, e.siteSurveyButton);
            await frame.waitForTimeout(500);
            await frame.waitForSelector(e.wirelessTableRow, { visible: true });
            founded = await findWifiInTable(frame, e.wirelessTableRow, wifiName, false);

            // console.log({ founded, COUNT_TRY });
            if (founded === true) break;
            COUNT_TRY--;
        };
        if (!founded) throw new Error('did not find');

        await findWifiInTable(frame, e.wirelessTableRow, wifiName, true);

        // Go next and insert password
        await waitAndClick(frame, e.siteSurveyGoNext);
        await waitAndType(frame, e.wirelessPasswordInput, wifiPassword);

        // Go next and set new IP address
        await waitAndClick(frame, e.wirelessPasswordGoNext);
        await waitAndType(frame, e.ipAddressInput, newGatewayIp);

        // click to finish
        await waitAndClick(frame, e.finishButton);

        // wait to apply the changes
        console.log('Waiting to restart the modem and complete the configuration - it takes ~35sec')
        await page.waitForSelector(e.mainBanner, { timeout: c.MAX_TIMEOUT_APPLY_CONFIG, visible: true });
        console.log('Settings applied! Testing internet connection');

        // final check: go to Google get the response status
        const testPage = await page.goto(c.googleWebsite);
        const status = testPage.status();

        // await page.waitForTimeout(3000);
        if (status == 200) {
            // await page.screenshot({ path: 'google.png' });
            console.log('Setup completed successfully!');
            await browser.close();
            process.exit(0);
        } else {
            await browser.close();
            throw new Error('Cannot load Google page. Try to access manually and check if the setup works!');
        }
    } catch (e) {
        throw new Error(e);
    }
})();