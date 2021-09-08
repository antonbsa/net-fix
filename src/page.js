const ora = require('ora');
const { ELEMENT_TIMEOUT } = require('./constants');

class Page {
    constructor(page) {
        this.page = page;
        this.spinner;
    }

    setPage(page) {
        this.page = page;
    }
    async close() {
        await this.page.close();
    }

    // Page functions
    async goto(url) {
        return await this.page.goto(url, { waitUntil: 'networkidle2' });
    }
    async waitForSelector(element, timeout = ELEMENT_TIMEOUT) {
        await this.page.waitForSelector(element, { visible: true, timeout });
    }
    async waitTimeout(timeout) {
        await this.page.waitForTimeout(timeout);
    }
    async select(element, option) {
        await this.waitForSelector(element);
        await this.page.select(element, option);
    }
    async waitForNavigation(timeout) {
        await this.page.waitForNavigation({ timeout });
    }
    async waitAndClick(selector) {
        await this.waitForSelector(selector);
        await this.page.click(selector);
    }
    async waitAndType(selector, text) {
        await this.waitForSelector(selector);
        await this.page.click(selector, { clickCount: 2 });
        await this.page.type(selector, text);
    }
    async getMainFrame() {
        return this.page.frames().find((frame) => frame.name() === 'main');
    }

    // Spinner functions
    startSpinner(text) {
        this.spinner = ora(text).start();
    }
    setSpinnerText(text) {
        this.spinner.text = text;
    }
    spinnerSucceed() {
        this.spinner.succeed().stop();
    }
    spinnerFailure() {
        this.spinner.fail().stop();
    }
    finishAndSetSpinner(text, warningTimeout = 5000) {
        this.spinner.succeed();
        const newSpinner = ora(text).start();
        setTimeout(() => {
            newSpinner.color = 'yellow'
        }, warningTimeout);

        this.spinner = newSpinner;
    }
}

module.exports = exports = Page;