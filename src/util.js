const ora = require('ora');

module.exports = {
    waitAndClick: async (page, selector) => {
        await page.waitForSelector(selector, { visible: true });
        await page.click(selector);
    },
    waitAndClickElement: async (page, selector) => {
        await page.waitForSelector(selector, { visible: true });
        await page.evaluate((selector) => {
            document.querySelectorAll(selector)[0].click();
        }, selector)
    },
    waitAndType: async (page, selector, text) => {
        await page.waitForSelector(selector, { visible: true });
        await page.click(selector, { clickCount: 2 });
        await page.type(selector, text);
    },
    getMainFrame: async (page) => {
        return await page.frames().find((frame) => frame.name() === 'main');
    },
    findWifiInTable: async (page, tableSelector, wifiName, checkWifi) => {
        const el = await page.evaluate((tableSelector, wifiName, checkWifi) => {
            const tableArray = Array.from(document.querySelectorAll(tableSelector));
            // take off first one - is the header
            tableArray.shift();
            const element = tableArray.find((e) => {
                let elements = Array.from(e.querySelectorAll('td'));
                let filtered = elements.find((e) => e.innerText.includes(wifiName));
                if (filtered) {
                    return e;
                }
            });
            console.log({ element });
            if (checkWifi && element) {
                element.querySelectorAll('td input')[0].click();
            }
            return element;
        }, tableSelector, wifiName, checkWifi);

        return (el) ? true : false;
    },
    finishAndSetSpinner: (spinner, text, warningTimeout) => {
        spinner.succeed();
        const newSpinner = ora(text).start();
        setTimeout(() => {
            newSpinner.color = 'yellow'
        }, warningTimeout | 5000);

        return newSpinner;
    }
}