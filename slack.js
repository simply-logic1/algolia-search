// @ts-check
const dotenv = require("dotenv");
const algoliasearch = require("algoliasearch").default;
const https = require("https");
var moment = require("moment");

const client = algoliasearch(
  process.env.ALGOLIA_APP_ID,
  process.env.ALGOLIA_API_KEY
);
const index = client.initIndex(process.env.ALGOLIA_INDEX);

dotenv.config();

const SEND_MESSAGE = (initialItemsAmount) => {
  const yourWebHookURL = process.env.SLACK_WEBHOOK_URL;

  index.search("", {}).then(({ nbHits }) => {
    const messageBody = {
      username: "Uberflip data Crawled by Heroku",
      text: ":wave: <!here> New crawl just finished today:\n",
      icon_emoji: ":algoboto:",
      attachments: [
        {
          color: "#2eb886",
          fields: [
            {
              title: "🗓 Date of fetching",
              value: `${moment().format("dddd, MMMM Do YYYY, h:mm:ss a")}\n\n`,
              short: false,
            },
            {
              title: "⚙️ Environment",
              value: `${process.env.NODE_ENV}\n\n`,
              short: false,
            },
            {
              title: "📦 Data indexed",
              value: `*${initialItemsAmount}* ➡️ *${nbHits}*\n\n`,
              short: false,
            },
            {
              title: "🧑‍💻 Indexed by",
              value: `${process.env.CURRENT_DEVELOPER}\n\n`,
              short: false,
            },
            {
              title: `${initialItemsAmount > nbHits ? "❌" : "✅"} Status`,
              value:
                initialItemsAmount > nbHits
                  ? "There might be an indexing error.\n"
                  : `Everything seems good.\n*${
                      initialItemsAmount === nbHits ? "No new data indexed" : ""
                    }*`,
              short: true,
            },
          ],
          actions: [
            {
              type: "button",
              text: "Open Heroku app",
              style: "primary",
              url:
                "https://dashboard.heroku.com/apps/algolia-uberflip-resource-page",
            },
            {
              type: "button",
              text: "Open GitHub Repository",
              style: "primary",
              url: "https://github.com/algolia/algolia-uberflip-resource-page",
            },
            {
              type: "button",
              text: "Open Algolia Index",
              style: "primary",
              url: `https://www.algolia.com/apps/latency/explorer/browse/${process.env.ALGOLIA_INDEX}`,
            },
          ],
        },
      ],
    };

    /**
     * Handles the actual sending request.
     * We're turning the https.request into a promise here for convenience
     * @param webhookURL
     * @param messageBody
     * @return {Promise}
     */
    function sendSlackMessage(webhookURL, messageBody) {
      try {
        messageBody = JSON.stringify(messageBody);
      } catch (e) {
        throw new Error("Failed to stringify messageBody", e);
      }

      return new Promise((resolve, reject) => {
        const requestOptions = {
          method: "POST",
          header: {
            "Content-Type": "application/json",
          },
        };

        const req = https.request(webhookURL, requestOptions, (res) => {
          let response = "";

          res.on("data", (d) => {
            response += d;
          });

          res.on("end", () => {
            resolve(response);
          });
        });

        req.on("error", (e) => {
          reject(e);
        });

        req.write(messageBody);
        req.end();
      });
    }

    // main
    (async function () {
      if (!yourWebHookURL) {
        console.error("Please fill in your Webhook URL");
      }

      console.log("Sending slack message");

      try {
        const slackResponse = await sendSlackMessage(
          yourWebHookURL,
          messageBody
        );
        console.log("Message response", slackResponse);
      } catch (e) {
        console.error("There was a error with the request", e);
      }
    })();
  });
};

module.exports = SEND_MESSAGE;
