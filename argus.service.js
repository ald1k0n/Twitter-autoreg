const axios = require("axios");
const { readToken } = require("./auth.service");
const fs = require("fs/promises");

async function getProxies() {
  const { data } = await axios.get(
    "https://proxys.argus360.kz/proxy/formatted?package=static&country=US"
  );
  return data;
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
  }));
  return data;
  // console.log(accounts);
}

// (async () => {
//   console.log(await getUpdateStatus());
// })();
