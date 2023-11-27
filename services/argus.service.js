const axios = require("axios");
const { readToken } = require("./auth.service");
const fs = require("fs/promises");

/**
 * @typedef {Object} ProxyInfo
 * @property {string} username - The username for the proxy authentication.
 * @property {string} password - The password for the proxy authentication.
 * @property {string} url - The URL of the proxy.
 */

/**
 * @returns {Promise<ProxyInfo[]>} An array of objects containing proxy information.
 */
async function getProxies() {
  const { data } = await axios.get(
    "https://proxys.argus360.kz/proxy/formatted?package=static&country=US"
  );
  const proxies = data?.map((proxy) => {
    const [credentials, url] = proxy.split("@");
    const [username, password] = credentials.split(":");
    return {
      username,
      password,
      url,
    };
  });
  return proxies;
}

async function getUpdateStatus() {
  const token = await fs.readFile("./token.txt", "utf-8");
  readToken();

  const { data: accounts } = await axios.get(
    "https://avatarbackend.argus360.kz/filter?resource=twitter&shared=false&status=3",
    {
      headers: {
        authorization: `Bearer ${token}`,
      },
    }
  );
  const data = accounts.map((acc) => ({
    proxy: acc.proxy,
    username: acc.username,
    password: acc.password,
    id: acc.id,
    created_by: acc.created_by,
    email: acc.email,
  }));
  return data;
  // console.log(accounts);
}

/**
 *
 * @param {string} email
 * @param {boolean} isReg
 */
async function getMails(email, isReg = false) {
  const parts = email.split("@");
  const login = parts[0];
  const domain = parts[1];
  console.log(login, domain);
  const { data } = await axios.get(
    `https://www.1secmail.com/api/v1/?action=getMessages&login=${login}&domain=${domain}`
  );
  const mailID = data[0]?.id;
  const { data: mail } = await axios.get(
    `https://www.1secmail.com/api/v1//?action=readMessage&login=${login}&domain=${domain}&id=${mailID}`
  );
  let tempCode;
  if (!isReg) {
    tempCode = data[0]?.subject.substring(
      Math.max(data[0].subject.length - 8, 0)
    );
    if (tempCode?.includes("Windows")) {
      return undefined;
    }
  } else {
    return data[0]?.subject.substring(Math.max(data[0].subject.length - 6, 0));
  }
}

// (async () => {
//   console.log(await getMails("xkgweuavys@1secmail.com".toLowerCase()));
// })();

module.exports = {
  getProxies,
  getUpdateStatus,
  getMails,
};
