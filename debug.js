// @ts-check
const dotenv = require("dotenv");
dotenv.config();

const fs = require("fs");
const fetch = require("node-fetch").default;

function fetchWithRetry(url, options, retryCount = 0) {
  if (retryCount > 10) {
    throw new Error("fetch retried over 10 times");
  }
  return fetch(url, options).catch((err) => {
    if (err.code === "ENOTFOUND") {
      return fetchWithRetry(url, options, retryCount + 1);
    }
    throw err;
  });
}

const writeResults = async (
  results,
  auth,
  apiUrl,
  _DEBUG_DATA_LENGTH,
  _DEBUG_FILE_PATH,
  _DEBUG_REMOVE_FROM_DATA
) => {
  const promises = [];
  results.data.slice(0, _DEBUG_DATA_LENGTH).map((item) => {
    // Remove noise
    _DEBUG_REMOVE_FROM_DATA.map((label) => {
      delete item[label];
    });

    const fetchStreamsPromise = fetchWithRetry(
      `${apiUrl}/items/${item.id}/streams`,
      {
        headers: { Authorization: auth },
        method: "GET",
      }
    );
    const allStreams = fetchStreamsPromise
      .then((res) => {
        return res.json();
      })
      .then((data) => {
        item.all_streams = data.data.map((streamSource) => streamSource.title);
        return item;
      })
      .catch((err) => console.log(err));
    promises.push(allStreams);
  });
  const debugData = await Promise.all(promises);
  fs.writeFileSync(_DEBUG_FILE_PATH, JSON.stringify(debugData), "utf-8");
};

module.exports = writeResults;
