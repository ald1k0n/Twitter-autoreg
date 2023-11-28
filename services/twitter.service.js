const { getProxies, getUpdateStatus, getMails } = require("./argus.service");
const puppeteer = require("puppeteer");
const fs = require("fs");
/**
 * @param {puppeteer.Page} page
 * @param {HTMLSelectElement} selector
 * @param {number} valCount
 * @param {boolean} isYear
 */
async function fillSelects(page, selector, valCount, isYear = false) {
  await page.waitForSelector(selector);
  let optionValueToSelect;
  if (!isYear)
    optionValueToSelect = Math.floor(Math.random() * valCount).toString();
  else optionValueToSelect = "2000";
  console.log(optionValueToSelect, "select val");
  await page.click(selector);

  await page.evaluate(
    (selector, optionValueToSelect) => {
      const dropdown = document.querySelector(selector);
      const options = dropdown.querySelectorAll("option");
      options.forEach((option) => {
        if (option.value === optionValueToSelect) {
          option.selected = true;
          option.parentElement.dispatchEvent(
            new Event("change", { bubbles: true })
          );
        }
      });
    },
    selector,
    optionValueToSelect
  );
}

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
  const proxies = await getProxies();

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

  // if (currentIndex !== 5) {
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
    await fillInputs(page, "input[type=text]", code);
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
      proxyUsername: proxies[currentIndex].username,
      proxyPassword: proxies[currentIndex].password,
    };

    fs.appendFile(
      "success_users.json",
      JSON.stringify(data, null, 2) + "\n",
      (err) => {
        if (err) console.error("Error happened in success " + err);
      }
    );
    console.log(JSON.stringify(data, null, 2));
    console.log("Close the browser to continue the procces");
    await browser.close();
    return data;
  } else {
    console.log("not success");
  }
}

async function createTwitter() {
  const randomString = Math.floor(Math.random() * Date.now()).toString(32);
  const proxies = await getProxies();
  const urlPath = `https://twitter.com/i/flow/signup`;
  const browser = await puppeteer.launch({
    headless: false,
    args: [`--proxy-server=http://${proxies[0].url}`],
  });
  const page = await browser.newPage();
  await page.authenticate({
    username: proxies[0].username,
    password: proxies[0].password,
  });
  await page.goto(urlPath);
  await page.waitForTimeout(5000);

  await page.evaluate(() => {
    const divElements = Array.from(
      document.querySelectorAll('div[role="button"]')
    );
    const targetDiv = divElements.find((div) => {
      const spanElement = div.querySelector("span");
      return (
        spanElement && spanElement.textContent.trim() === "Зарегистрироваться"
      );
    });

    if (targetDiv) {
      targetDiv.click();
    } else {
      console.error("Button not found");
    }
  });
  await page.waitForTimeout(2000);

  await fillInputs(page, "input[autocomplete=name]", randomString);
  await page.evaluate(() => {
    const divElements = Array.from(
      document.querySelectorAll('div[role="button"]')
    );
    const targetDiv = divElements.find((div) => {
      const spanElement = div.querySelector("span");
      return (
        spanElement &&
        spanElement.textContent.trim() === "Использовать эл. почту"
      );
    });

    if (targetDiv) {
      targetDiv.click();
    } else {
      console.error("Button not found");
    }
  });
  await page.waitForTimeout(2000);

  await fillInputs(
    page,
    "input[autocomplete=email]",
    `${randomString}@1secmail.com`
  );

  await fillSelects(page, "select[aria-labelledby='SELECTOR_1_LABEL']", 12); // month
  await page.waitForTimeout(1000);

  await fillSelects(page, "select[aria-labelledby='SELECTOR_2_LABEL']", 28); // day
  await page.waitForTimeout(500);
  await fillSelects(
    page,
    "select[aria-labelledby='SELECTOR_3_LABEL']",
    28,
    true
  ); // Year
  await page.waitForTimeout(500);
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
  await page.waitForTimeout(500);
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
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    const divElements = Array.from(
      document.querySelectorAll('div[role="button"]')
    );
    const targetDiv = divElements.find((div) => {
      const spanElement = div.querySelector("span");
      return (
        spanElement && spanElement.textContent.trim() === "Зарегистрироваться"
      );
    });

    if (targetDiv) {
      targetDiv.click();
    } else {
      console.error("Button not found");
    }
  });
  await page.waitForTimeout(2 * 60 * 1000);
  const code = await getMails(`${randomString}@1secmail.com`, true);
  await fillInputs(page, 'input[name="verfication_code"]', code);
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
  await fillInputs(page, 'input[name="password"]', "strongPASS");
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
  await page.waitForTimeout(5000);
  await page.waitForSelector('div[role="button"]');
  await page.evaluate(() => {
    const divElements = Array.from(
      document.querySelectorAll('div[role="button"]')
    );
    const targetDiv = divElements.find((div) => {
      const spanElement = div.querySelector("span");
      return spanElement && spanElement.textContent.trim() === "Пропустить";
    });

    if (targetDiv) {
      targetDiv.click();
    } else {
      console.error("Button not found");
    }
  });
  await page.waitForTimeout(2000);

  await page.waitForSelector("input[name='username']");

  const username = await page.evaluate(() => {
    const field = document.querySelector("input[name='username']");
    return field.value;
  });

  console.log(username);
  await page.waitForTimeout(1000);

  await page.evaluate(() => {
    const divElements = Array.from(
      document.querySelectorAll('div[role="button"]')
    );
    const targetDiv = divElements.find((div) => {
      const spanElement = div.querySelector("span");
      return spanElement && spanElement.textContent.trim() === "Не сейчас";
    });

    if (targetDiv) {
      targetDiv.click();
    } else {
      console.error("Button not found");
    }
  });
  await page.waitForTimeout(1000);
  await page.evaluate(() => {
    const divElements = Array.from(
      document.querySelectorAll('div[role="button"]')
    );
    const targetDiv = divElements.find((div) => {
      const spanElement = div.querySelector("span");
      return spanElement && spanElement.textContent.trim() === "Пропустить";
    });

    if (targetDiv) {
      targetDiv.click();
    } else {
      console.error("Button not found");
    }
  });
  await page.waitForTimeout(1500);

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
  await page.waitForTimeout(1500);

  await page.evaluate(() => {
    const divElements = Array.from(
      document.querySelectorAll('div[role="button"]')
    );
    const targetDiv = divElements.find((div) => {
      const spanElement = div.querySelector("span");
      return spanElement && spanElement.textContent.trim() === "Читать";
    });

    if (targetDiv) {
      targetDiv.click();
    } else {
      console.error("Button not found");
    }
  });
  await page.waitForTimeout(1500);
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
  return {
    username,
    password: "strongPASS",
    email: `${randomString}@1secmail.com`,
    proxy: `${proxies[0].username}:${proxies[0].password}@${proxies[0].url}`,
  };
}

// (async () => {
//   await createTwitter();
// })();

module.exports = {
  run,
  createTwitter,
};
