const puppeteer = require('puppeteer');

/**
 * @param {puppeteer.Page} page
 * @param {HTMLSelectElement} selector
 * @param {string} value
 */

const fillInputs = async (page, selector, value) => {
	await page.waitForSelector(selector);
	await page.click(selector);

	await page.type(selector, value, {
		delay: 50,
	});
	await page.waitForTimeout(1000);
};

async function run() {
	const browser = await puppeteer.launch({
		headless: false,
		// args: ['--proxy-server=http://194.104.232.139:50600'],
	});
	const page = await browser.newPage();

	// await page.authenticate({ username: 'er1DKn6z', password: 'FiZfMgnV' });

	const pageUrl = 'https://twitter.com/i/flow/login';

	await page.goto(pageUrl);

	await fillInputs(page, 'input[autocomplete=username]', 'cjube1337@gmail.com');

	await page.evaluate(() => {
		const divElements = Array.from(
			document.querySelectorAll('div[role="button"]')
		);
		const targetDiv = divElements.find((div) => {
			const spanElement = div.querySelector('span');
			return spanElement && spanElement.textContent.trim() === 'Далее';
		});

		if (targetDiv) {
			targetDiv.click();
		} else {
			console.error('Button not found');
		}
	});
	await page.waitForTimeout(1000);

	await fillInputs(
		page,
		'input[autocomplete="current-password"]',
		'264166aldiar'
	);

	await page.evaluate(() => {
		const divElements = Array.from(
			document.querySelectorAll('div[role="button"]')
		);
		const targetDiv = divElements.find((div) => {
			const spanElement = div.querySelector('span');
			return spanElement && spanElement.textContent.trim() === 'Войти';
		});

		if (targetDiv) {
			targetDiv.click();
		} else {
			console.error('Button not found');
		}
	});
}

run();
