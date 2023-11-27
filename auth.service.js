const fs = require("fs/promises");
const jwt = require("jsonwebtoken");
const axios = require("axios");

async function readToken() {
  try {
    const data = await fs.readFile("./token.txt", "utf-8");
    if (data.length === 0) {
      await getToken();
    } else {
      const { exp } = jwt.decode(data);
      await checkExpire(exp);
    }
  } catch (err) {
    console.error(err);
  }
}

const getToken = async () => {
  try {
    const response = await axios.post(
      "https://auth.argus360.kz/auth/realms/argus360api/protocol/openid-connect/token",
      {
        username: "a.seylkhanov",
        password: "e6pMVik4oQN4Us",
        grant_type: "password",
        client_id: "front",
      },
      {
        headers: { "content-type": "application/x-www-form-urlencoded" },
      }
    );
    await fs.writeFile("./token.txt", response.data.access_token);
  } catch (err) {
    console.error(err);
  }
};

async function checkExpire(expire) {
  const currentTimestamp = Math.floor(Date.now() / 1000);
  if (expire > currentTimestamp) {
    console.log("Token isn't expired, all good");
  } else {
    console.log("Getting new token");
    await getToken();
  }
}

module.exports = {
  readToken,
};
