const puppeteer = require("puppeteer");
const { getProxies, getUpdateStatus } = require("./argus.service");
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

let currentIndex = 0;

async function run() {
  const accounts = await getUpdateStatus();
  const browser = await puppeteer.launch({
    headless: false,
    // args: ['--proxy-server=http://194.104.232.139:50600'],
  });
  const page = await browser.newPage();

  // await page.authenticate({ username: 'er1DKn6z', password: 'FiZfMgnV' });

  const pageUrl = "https://twitter.com/i/flow/login";

  await page.goto(pageUrl);

  async function login() {
    if (currentIndex !== 10) {
      await fillInputs(
        page,
        "input[autocomplete=username]",
        accounts[currentIndex].username
      );

      await page.evaluate(() => {
        const divElements = Array.from(
          document.querySelectorAll('div[role="button"]')
        );
        const targetDiv = divElements.find((div) => {
          const spanElement = div.querySelector("span");
          return spanElement && spanElement.textContent.trim() === "Далее";
        });

        if (targetDiv) {
          targetDiv.click();
        } else {
          console.error("Button not found");
        }
      });
      await page.waitForTimeout(1000);
      await fillInputs(
        page,
        'input[autocomplete="current-password"]',
        accounts[currentIndex].password
      );
      await page.evaluate(() => {
        const divElements = Array.from(
          document.querySelectorAll('div[role="button"]')
        );
        const targetDiv = divElements.find((div) => {
          const spanElement = div.querySelector("span");
          return spanElement && spanElement.textContent.trim() === "Войти";
        });

        if (targetDiv) {
          targetDiv.click();
        } else {
          console.error("Button not found");
        }
      });
    }
  }
  browser.on("disconnected", () => {
    console.log("Browser disconnected. Relaunching...");
    currentIndex++;
    run();
  });
  await login();
}

run();
