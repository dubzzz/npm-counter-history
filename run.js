const fs = require("fs");
const https = require("https");

async function getPageContent(url) {
  return new Promise((resolve) => {
    https
      .get(url, (response) => {
        let data = "";
        response.on("data", (chunk) => (data += chunk));
        response.on("end", () => resolve(data));
      })
      .end();
  });
}

async function getDownloadsFor(packageName) {
  // Downloads count can be extracted from https://www.npmjs.com/package/fast-check
  // By looking for: "versionsDownloads":{"1.17.0":138,...}
  const npmWebPageContent = await getPageContent(
    `https://www.npmjs.com/package/${encodeURI(packageName)}`
  );
  const versionsDownloadsRegex = /\"versionsDownloads\":(\{[^}]*\})/;
  const m = versionsDownloadsRegex.exec(npmWebPageContent);
  if (!m) {
    console.log(npmWebPageContent);
    throw new Error("Unable to find downloads count");
  }
  return JSON.parse(m[1]);
}

async function appendDownloads(packageName) {
  const downloads = await getDownloadsFor(packageName);
  const currentDate = new Date().toISOString();

  const fileName = `${packageName}.csv`;
  const csvContent = Object.entries(downloads)
    .map(([version, count]) => `${currentDate};${version};${count}`)
    .join("\n");

  if (fs.existsSync(fileName)) fs.appendFileSync(fileName, "\n" + csvContent);
  else fs.writeFileSync(fileName, csvContent);
}

appendDownloads("fast-check");
