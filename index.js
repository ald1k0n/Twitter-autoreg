const puppeteer = require("puppeteer");
const fs = require("fs");
const { getProxies, getUpdateStatus, getMails } = require("./argus.service");
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

let currentIndex = 1;

async function run() {
  const accounts = await getUpdateStatus();
  const proxies = await getProxies();

  async function login() {
    const browser = await puppeteer.launch({
      headless: false,
      args: [`--proxy-server=http://${proxies[currentIndex].url}`],
    });
    const page = await browser.newPage();
    await page.authenticate({
      username: proxies[currentIndex].username,
      password: proxies[currentIndex].password,
    });

    const pageUrl = "https://twitter.com/i/flow/login";

    await page.goto(pageUrl);

    if (currentIndex !== 2) {
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
      await page.waitForTimeout(2000);

      const code = await getMails(accounts[currentIndex].email.toLowerCase());
      if (code) {
        console.log(
          code,
          "Input this code, you have 5 minute to fill it and pass the captcha"
        );
      }
      await page.waitForTimeout(5 * 60 * 1000);
      const success = await page.$("a[href='/home']");
      console.log(proxies[currentIndex].url);
      if (success) {
        const data = {
          id: accounts[currentIndex].id,
          username: accounts[currentIndex].username,
          password: accounts[currentIndex].password,
          proxy: proxies[currentIndex].url,
        };

        fs.appendFile(
          "success_users.json",
          JSON.stringify(data, null, 2) + "\n",
          (err) => {
            if (err) console.error("Error happened in success " + err);
          }
        );
        console.log(JSON.stringify(data, null, 2));
        await browser.close();
      } else {
        console.log("not success");
      }
    }
    browser.on("disconnected", () => {
      console.log("Browser disconnected. Relaunching...");
      currentIndex++;
      run();
    });
  }

  await login();
}

run();
