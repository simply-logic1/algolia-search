## Summary

- [📖 Guide](guide.md)
  - [📢 Disclaimer](guide.md#-disclaimer)
- [🏃‍♂️ Run project](guide.md#-run-project)
  - [📝 Usage](guide.md#-usage)
  - [🔑 Environment Variables](guide.md#-environment-variables)
  - [➕ Add new streams](guide.md#-add-new-streams)
  - [🐛 Debug](guide.md#-debug)
  - [📦 Objects Data shape](guide.md#-objects-data-shape)
  - [🔎 Where to find final data](guide.md#-where-to-find-final-data)
  - [🚀 Deploy](guide.md#-deploy)
- [👴🏼 Legacy code](guide.md#-legacy-code)

## 📢 Disclaimer

You will find the current scrip being `fetch.js`

Working on a better way to fetch the data using `better-fetch.js`
The latest not being used because it results on irregular number of fetched data.

Need to implement a legit `index.tmp` strategy, see https://github.com/algolia/algolia-sitesearch-idx-builder/blob/master/index.js#L97-L112

Heroku app: [algolia-uberflip-resource-page](https://dashboard.heroku.com/apps/algolia-uberflip-resource-page)

## 🏃‍♂️ Run project

### 📝 Usage

- Fill in the [.env](.env) file
- `$ yarn index` or `$ node fetch.js`

### 🔑 Environment Variables

[.env.example](.env.example)

```
ALGOLIA_APP_ID=xxx
ALGOLIA_API_KEY=xxx
ALGOLIA_INDEX=xxx
ALGOLIA_INDEX_COPY=xxx
UBERFLIP_BEARER_TOKEN=xxx
UBERFLIP_CLIENT_ID=xxx
UBERFLIP_CLIENT_SECRET=xxx
CURRENT_DEVELOPER=xxx
DEBUG=false
```

`CURRENT_DEVELOPER` would be the name of the developer running the tests. By default once hosted, it's value will be `heroku`

### ➕ Add new streams

In order to add new whitelisted streams, you'll have to fill in a new object in [list-stream.json](data/list-stream.json)

### 🐛 Debug

`DEBUG=true yarn index`

Running in DEBUG will write results within a json file in `debug_data.json`

This will populate a file `./debug_data.json`

Edit the `_DEBUG*` consts in order to refine your debug data.

| Variable                 | Type             | Default Value                                                                                                                                                                             | Description                                        |
| ------------------------ | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| \_DEBUG                  | boolean          | ` process.env.DEBUG`                                                                                                                                                                      | Enable/Disable debug mode                          |
| \_DEBUG_DATA_LENGTH      | number           | ` 20`                                                                                                                                                                                     | Amount of item to return                           |
| \_DEBUG_FILE_PATH        | string           | ` "./debug/debug_data.json"`                                                                                                                                                              | Path and filename                                  |
| \_DEBUG_REMOVE_FROM_DATA | array of strings | `["content", "hub_id", "service", "seo_title", "seo_description" ,"canonical_redirect", "mediaproxy_thumbnail_url", "avatar_url", "duration", "edited", "deleted", "hide_publish_date",]` | Data to remove from item to keep a clean debug log |

### 📦 Objects Data shape

```json
{
  "title": "foo",
  "description": "foo bar",
  "image": "foo bar",
  "created_at": "foo bar",
  "modified_at": "foo bar",
  "published_at": "foo bar",
  "url": "foo bar",
  "type": "foo bar",
  "objectID": "item_xxx",
  "in_streams": ["foo", "bar"],
  "info": {
    "fetched_by": "<CURRENT_DEVELOPER|heroku>",
    "fetched_at": "foo",
    "fetched_at_readable": "foo"
  }
}
```

The `info` object is mainly here for debug purposes.

### 🔎 Where to find final data

Index name: `<DEV|PROD>_algolia_com_site_resources-ubf`

### 🚀 Deploy

Once you're done working on the fetching script, please update the github branch, and deploy to heroku.

On the Heroku app:

```
git add [yourfiles]
git commit -m "commit message"
git push heroku master
```
