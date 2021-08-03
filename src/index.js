require('dotenv').config();
const ora = require('ora');
const puppeteer = require('puppeteer');
const { waitAndClick, waitAndClickElement, waitAndType, getMainFrame, findWifiInTable, finishAndSetSpinner } = require('./util');
const c = require('./constants');
const e = require('./elements');

(async () => {
    const debugMode = process.env.DEBUG_MODE === 'true';
    const defaultGatewayIp = process.env.GATEWAY_BASE;
    const newGatewayIp = process.env.NEW_GATEWAY_ADDRESS;
    const wifiName = process.env.WIRELESS_NAME;
    const wifiPassword = process.env.WIRELESS_PASSWORD;
    const channel = process.env.WIRELESS_CHANNEL;
    const siteSurveyCount = process.env.SITE_SURVEY_COUNT_TRY;

    let spinner = ora('Acessing modem page').start();

    try {
        const browser = await puppeteer.launch({
            headless: (debugMode) ? false : true,
            defaultViewport: null
        });
        const page = await browser.newPage();
        await page.goto(`http://${defaultGatewayIp}/login.htm`);
        // confirm browser dialogs
        page.on('dialog', async dialog => {
            await dialog.accept();
        });

        // Enter router configs
        spinner = finishAndSetSpinner(spinner, 'Entering router configs');
        await waitAndClick(page, e.loginBtn);
        await page.waitForNavigation();

        const frame = await getMainFrame(page);

        spinner = finishAndSetSpinner(spinner, 'Setting the channel');
        await waitAndClickElement(frame, e.wirelessTab);
        await frame.waitForSelector(e.channelSelect, { visible: true });
        await frame.select(e.channelSelect, channel);
        await waitAndClick(frame, e.saveWirelessTab);

        spinner = finishAndSetSpinner(spinner, 'Going to wireless repetear tab and enabling repeater');
        await waitAndClick(frame, e.wirelessRepeaterTab);

        // Enable repeater
        await frame.waitForSelector(e.siteSurveyButton, { visible: true });
        const repeaterModeChecked = await frame.evaluate((repeaterModeSelector) => {
            return document.querySelectorAll(repeaterModeSelector)[0].value == 'on';
        }, e.repeaterModeCheckbox);

        if (debugMode) console.log({ repeaterModeChecked });
        if (!repeaterModeChecked) await waitAndClick(frame, e.repeaterModeCheckbox);

        let COUNT_TRY = siteSurveyCount;
        let founded = false;
        spinner = finishAndSetSpinner(spinner, `Repeating ${COUNT_TRY} times to find wifi - it takes a while to apply the channel change`, 17000);
        while (COUNT_TRY != 0) {
            await waitAndClick(frame, e.siteSurveyButton);
            await frame.waitForTimeout(500);
            await frame.waitForSelector(e.wirelessTableRow, { visible: true });
            founded = await findWifiInTable(frame, e.wirelessTableRow, wifiName, false);

            if (debugMode) console.log({ founded, COUNT_TRY });
            if (founded === true) break;
            COUNT_TRY--;
        };
        if (!founded) throw new Error('did not find');

        await findWifiInTable(frame, e.wirelessTableRow, wifiName, true);

        spinner = finishAndSetSpinner(spinner, 'Inserting password');
        await waitAndClick(frame, e.siteSurveyGoNext);
        await waitAndType(frame, e.wirelessPasswordInput, wifiPassword);

        spinner = finishAndSetSpinner(spinner, 'Setting new IP address');
        await waitAndClick(frame, e.wirelessPasswordGoNext);
        await waitAndType(frame, e.ipAddressInput, newGatewayIp);

        // click to finish
        await waitAndClick(frame, e.finishButton);

        spinner = finishAndSetSpinner(spinner, 'Changes confirmed: waiting to restart the modem and complete the configuration.');
        spinner = finishAndSetSpinner(spinner, c.secondsTextPassed);

        let interval = 0;
        const secondsInterval = setInterval(async () => {
            interval++;
            spinner.text = `${interval} ${c.secondsTextPassed}`;
        }, 1000);

        await page.waitForSelector(e.mainBanner, { timeout: c.MAX_TIMEOUT_APPLY_CONFIG, visible: true });
        clearInterval(secondsInterval);

        spinner.text = 'Changes has been applied!';
        spinner = finishAndSetSpinner(spinner, 'Testing internet connection');

        // Go to Google and check the response status
        const testPage = await page.goto(c.googleWebsite);
        const status = testPage.status();

        if (debugMode) await page.waitForTimeout(3000);
        if (status == 200) {
            // await page.screenshot({ path: 'google.png' });
            spinner.text = 'Setup completed successfully!';
            spinner.succeed().stop();
            await browser.close();
            process.exit(0);
        } else {
            await browser.close();
            spinner.fail().stop();
            console.error('Cannot load Google page. Try to access manually and check if the setup works!');
            process.exit(1);
        }
    } catch (e) {
        spinner.fail().stop();
        console.error(e);
        process.exit(1);
    }
})();