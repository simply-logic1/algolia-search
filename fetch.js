// @ts-check
const dotenv = require("dotenv");
var moment = require("moment");

const fetch = require("node-fetch").default;
const algoliasearch = require("algoliasearch").default;
const targetStreamId = require("./list-stream.json");
const settings = require("./indexSettings.json");

const writeResults = require("./debug.js");
const SEND_MESSAGE = require("./slack.js");

dotenv.config();
moment().format();

const client = algoliasearch(
  process.env.ALGOLIA_APP_ID,
  process.env.ALGOLIA_API_KEY
);
const index = client.initIndex(process.env.ALGOLIA_INDEX);
const indexCopy = client.initIndex(process.env.ALGOLIA_INDEX_COPY);

const auth = process.env.UBERFLIP_BEARER_TOKEN;
const apiUrl = "https://v2.api.uberflip.com";
const log = console.log;

const _DEBUG = process.env.DEBUG;
const _DEBUG_DATA_LENGTH = 20;
const _DEBUG_FILE_PATH = "./debug_data.json";
const _DEBUG_REMOVE_FROM_DATA = [
  "content",
  "hub_id",
  "service",
  "seo_title",
  "seo_description",
  "canonical_redirect",
  "mediaproxy_thumbnail_url",
  "avatar_url",
  "duration",
  "edited",
  "deleted",
  "hide_publish_date",
];

let ready = false;
let initialItemsAmount;

index.search("", {}).then(({ nbHits }) => {
  initialItemsAmount = nbHits;
});

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

/*client
  .copyIndex(process.env.ALGOLIA_INDEX, process.env.ALGOLIA_INDEX_COPY)
  .then(() => {
    log(
      `"Index copied: ${process.env.ALGOLIA_INDEX} ➡️\n ${process.env.ALGOLIA_INDEX_COPY}\n|`
    );
    log(`Clear index:${process.env.ALGOLIA_INDEX}`);
    index.clearObjects();
    log("Index cleared");
  })
  .catch((err) => console.log("err 1", err));*/

const promises = targetStreamId.map((stream) => {
  const fetchItemsPromise = fetchWithRetry(
    `${apiUrl}/streams/${stream.id}/items`,
    {
      headers: { Authorization: auth },
      method: "GET",
    }
  );

  const saveAllObjects = async (result) => {
    const promises = [];

    result.data.map((item) => {
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
          item.all_streams = data?.data?.map(
            (streamSource) => streamSource && streamSource.title
          );
          return item;
        })
        .catch((err) => console.log("err 2", err));
      promises.push(allStreams);
    });
    const newData = await Promise.all(promises);
    return index
      .saveObjects(
        newData.map((item) => {
          return {
            title: item.title,
            description: item.description,
            thumbnail_url: item.thumbnail_url,
            created_at: item.created_at,
            modified_at: item.modified_at,
            published_at: item.published_at,
            url: item.url,
            type: item.type,
            objectID: `item_${item.id}`,
            selected_stream: item.stream.title,
            in_streams: item.all_streams,
            hidden: item.hidden,
            info: {
              fetched_by: process.env.CURRENT_DEVELOPER,
              fetched_at: new Date(),
              fetched_at_readable: moment().format(
                "dddd, MMMM Do YYYY, h:mm:ss a"
              ),
            },
          };
        })
      )
      .wait()
      .then(() => {
		  //console.log(result);
        return result;
      })
      .catch((err) => console.log("err 3", err));
  };

  const handleData = (d) => {
    if (_DEBUG === "true") {
      return writeResults(
        d,
        auth,
        apiUrl,
        _DEBUG_DATA_LENGTH,
        _DEBUG_FILE_PATH,
        _DEBUG_REMOVE_FROM_DATA
      );
    } else {
      return saveAllObjects(d);
    }
  };

  const fetchOtherPages = (url) => {
    fetchWithRetry(url, {
      headers: { Authorization: auth },
      method: "GET",
    })
      .then((response) => {
		  //console.log(response.json());
        return response.json();
      })
      .then((result) => {
        if (result && result.data) {
          handleData(result);
        }
      })
      .then((result) => {
        if (result && result.meta && result.meta.next_page) {
          return fetchOtherPages(result.meta.next_page);
        }
      })
      .catch((err) => console.log("err 4", err));
  };

  return fetchItemsPromise
    .then((response) => {
		//console.log(response.json());
      return response.json();
	  
    })
    .then((result) => {
      if (result && result.meta && result.meta.next_page) {
        fetchOtherPages(result.meta.next_page);
      }
      if (result && result.data) {
        handleData(result);
      }
    })
    .catch((err) => console.log("err 5", err));
});

console.time("UberflipFetchToAlgolia");
log(`\nFetch Started ${moment().format("dddd, MMMM Do YYYY, h:mm:ss a")}\n|`);
Promise.all(promises)
  .then(() => {
    indexCopy
      .clearObjects()
      .then(() => log(`${process.env.ALGOLIA_INDEX_COPY} has been cleared`))
      .catch((err) => console.log("err 6", err));
    ready = true;
  })
  .then(() => {
    log(`| Indexing done ✅ on ${process.env.ALGOLIA_INDEX}`);
  })
  .catch((err) => {
    console.log("err 7", err);
    client
      .copyIndex(process.env.ALGOLIA_INDEX_COPY, process.env.ALGOLIA_INDEX)
      .then(() => {
        log("copy index used instead");
        index.clearObjects();
      })
      .catch((err) => console.log("err 8", err));
  });

const t = console.timeLog("UberflipFetchToAlgolia");
const int = setInterval(() => {
  if (ready) {
    SEND_MESSAGE(initialItemsAmount);
    clearInterval(int);
  }
}, 15 * 1000);

process.on("uncaughtException", function (err) {
  console.log(err);
});
