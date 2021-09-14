const Page = require('./core/page.js');
const c = require('./core/constants.js');
const e = require('./core/elements.js');
const p = require('./core/params');
const { findWifiInTable } = require('./core/util.js');

async function fix(mainPage, browser) {
    const {
        channel,
        wifiName,
        debugMode,
        shouldReset,
        newGatewayIp,
        wifiPassword,
        siteSurveyCount,
        defaultGatewayIp,
    } = p;


    try {
        await mainPage.goto(`http://${defaultGatewayIp}/login.htm`);

        // Enter router configs
        mainPage.finishAndSetSpinner('Entering router configs');
        await mainPage.waitAndClick(e.loginBtn);
        await mainPage.waitForNavigation();
        await mainPage.waitForSelector(e.mainFrame);
        if (shouldReset) await mainPage.waitTimeout(1500);

        const frame = new Page(await mainPage.getMainFrame());

        mainPage.finishAndSetSpinner('Setting the channel');
        await frame.waitAndClick(e.wirelessTab);
        await frame.select(e.channelSelect, channel);
        await frame.waitAndClick(e.saveWirelessTab);

        mainPage.finishAndSetSpinner('Going to wireless repetear tab and enabling repeater');
        await frame.waitAndClick(e.wirelessRepeaterTab);

        // Enable repeater
        await frame.waitForSelector(e.siteSurveyButton);
        const repeaterModeChecked = await frame.page.evaluate((repeaterModeSelector) => {
            return document.querySelectorAll(repeaterModeSelector)[0].value == 'on';
        }, e.repeaterModeCheckbox);

        if (debugMode) console.log({ repeaterModeChecked });
        if (!repeaterModeChecked) await frame.waitAndClick(e.repeaterModeCheckbox);

        let COUNT_TRY = siteSurveyCount;
        let founded = false;
        mainPage.finishAndSetSpinner(`Repeating ${COUNT_TRY} times to find wifi - it takes a while to apply the channel change`, 17000);
        while (COUNT_TRY != 0) {
            await frame.waitAndClick(e.siteSurveyButton);
            await frame.waitTimeout(500);
            await frame.waitForSelector(e.wirelessTableRow);
            founded = await findWifiInTable(frame.page, e.wirelessTableRow, wifiName, false);

            if (debugMode) console.log({ founded, COUNT_TRY });
            if (founded === true) break;
            COUNT_TRY--;
        };
        if (!founded) throw new Error('did not find');

        await findWifiInTable(frame.page, e.wirelessTableRow, wifiName, true);

        mainPage.finishAndSetSpinner('Inserting password');
        await frame.waitAndClick(e.siteSurveyGoNext);
        await frame.waitAndType(e.wirelessPasswordInput, wifiPassword);

        mainPage.finishAndSetSpinner('Setting new IP address');
        await frame.waitAndClick(e.wirelessPasswordGoNext);
        await frame.waitAndType(e.ipAddressInput, newGatewayIp);

        // click to finish
        await frame.waitAndClick(e.finishButton);

        mainPage.finishAndSetSpinner('Changes confirmed: waiting to restart the modem and complete the configuration.');
        mainPage.finishAndSetSpinner(c.secondsTextPassed, 30000);

        let interval = 0;
        const secondsInterval = setInterval(async () => {
            interval++;
            mainPage.setSpinnerText(`${interval} ${c.secondsTextPassed}`);
        }, 1000);

        await mainPage.waitForSelector(e.mainBanner, c.MAX_TIMEOUT_APPLY_CONFIG);
        clearInterval(secondsInterval);

        mainPage.setSpinnerText('Changes has been applied!');
        mainPage.finishAndSetSpinner('Testing internet connection');

        // Go to Google and check the response status
        const testPage = await mainPage.goto(c.googleWebsite);
        const status = testPage.status();

        if (debugMode) await mainPage.waitTimeout(3000);
        if (status == 200) {
            // await page.screenshot({ path: 'google.png' });
            mainPage.setSpinnerText('Setup completed successfully!');
            mainPage.spinnerSucceed();
            await browser.close();
            process.exit(0);
        } else {
            await browser.close();
            mainPage.spinnerFailure();
            console.error('Cannot load Google page. Try to access manually and check if the setup works!');
            process.exit(1);
        }
    } catch (e) {
        mainPage.spinnerFailure();
        console.error(e);
        process.exit(1);
    }
}

module.exports = exports = fix;