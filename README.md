# mediawiki-services-wikifeeds

A node.js webservice supporting the Explore feeds in the official Wikipedia Android and iOS apps.

## Getting Started

### Installation

First, clone the repository

```
git clone https://gerrit.wikimedia.org/r/mediawiki/services/wikifeeds
```

Install the dependencies

```
cd wikifeeds
npm install
```

You are now ready to get to work!

* Inspect/modify/configure `app.js`
* Add routes by placing files in `routes/` (look at the files there for examples)

### Running the service

To start the server hosting the REST API, simply run (inside the repo's directory)

```
npm start
```

This starts an HTTP server listening on `localhost:6927`.

### Endpoints
There are a few routes you may query (with a browser, or `curl` and friends). You can see more documentation at `localhost:6927/?doc`.

* `http://localhost:6927/en.wikipedia.org/v1/page/featured/2016/05/30`
* `http://localhost:6927/en.wikipedia.org/v1/media/image/featured/2016/05/30`
* `http://localhost:6927/en.wikipedia.org/v1/page/news`
* `http://localhost:6927/en.wikipedia.org/v1/page/most-read/2016/05/30`
* `http://localhost:6927/en.wikipedia.org/v1/page/random/title`
* `http://localhost:6927/en.wikipedia.org/v1/feed/onthisday/births/05/30`
* `http://localhost:6927/en.wikipedia.org/v1/feed/onthisday/deaths/05/30`
* `http://localhost:6927/en.wikipedia.org/v1/feed/onthisday/events/05/30`
* `http://localhost:6927/en.wikipedia.org/v1/feed/onthisday/selected/05/30`
* `http://localhost:6927/en.wikipedia.org/v1/feed/onthisday/holidays/05/30`
* `http://localhost:6927/en.wikipedia.org/v1/feed/onthisday/all/05/30`
* `http://localhost:6927/en.wikipedia.org/v1/feed/announcements`

Note that day and month need to be 2 digits to be accepted. 0-pad them if necessary.

#### Generic routes
Feed endpoint availability by language:
* `http://localhost:6927/wikimedia.org/v1/feed/availability`

Swagger spec:
* `http://localhost:6927/?spec`

Swagger UI:
* `http://localhost:6927/?doc`

Info:
* `http://localhost:6927/_info`

### Tests

There is also a set of executable tests. To fire them up, simply run:

```
npm test
```

If you haven't changed anything in the code (and you have a working Internet
connection), you should see all the tests passing. As testing most of the code
is an important aspect of service development, there is also a bundled tool
reporting the percentage of code covered. Start it with:

```
npm run-script coverage
```

To just run the unit tests (faster), use:

```
npm run test:unit
```
