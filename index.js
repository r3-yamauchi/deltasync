const os = require('os');
const path = require('path');
const queries = require('./queries');
const DateTime = require('./luxon').DateTime;
const TIMEZONE = 'Asia/Tokyo';
const DT_FORMAT = 'yyyy-MM-dd HH:mm:ss z';
const LocalStorage = require('node-localstorage').LocalStorage;
global.WebSocket = require('ws');
global.localStorage = new LocalStorage('tmp');
global.window = global.window || {
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  WebSocket: global.WebSocket,
  ArrayBuffer: global.ArrayBuffer,
  localStorage: global.localStorage,
  addEventListener: function () { },
  navigator: { onLine: true }
};
require('es6-promise').polyfill();
require('isomorphic-fetch');
const AUTH_TYPE = require('aws-appsync/lib/link/auth-link').AUTH_TYPE;
const AWSAppSyncClient = require('aws-appsync').default;
const buildSync = require('aws-appsync').buildSync;

const URL = 'https://<my-api-id>.appsync-api.us-west-2.amazonaws.com/graphql';
const AWS_REGION = 'us-west-2';

let client = null;
let haveToReset = false;
let myHostId = os.hostname();
console.log(myHostId);

const addLog = (logLevel, input) => {
  const payload = JSON.stringify(input);
  const dtNow = DateTime.fromObject({ zone: TIMEZONE });
  console.log(`[${logLevel}] [${dtNow.toFormat(DT_FORMAT)}]`);
  console.log(payload);
};

const myLog = {
  debug(input) {
    return addLog("DEBUG", input);
  },
  info(input) {
    return addLog("INFO", input);
  },
  error(input) {
    return addLog("ERROR", input);
  }
};

const realtimeResults = (data) => {
  console.log(JSON.stringify(data));
};

const doRequest = (path) => {
  const req = http.get(`http://127.0.0.1:3000/${path}`, (res) => {
    res.setEncoding('utf8');
    res.on('data', (str) => {
      console.log(str);
    });
  });

  req.on('error', (err) => {
    console.log(`[ERROR] /${path} : ${err.message}`);
  });
};

const observeError = (err) => {
  haveToReset = true;
  console.log('[ERROR] on observable.subscribe Error!!');
  console.log(JSON.stringify(err));
  newAppSyncClient();
};

const hydrate = () => {
  client.hydrated().then(client => {

    client.sync(
      buildSync("Post", {
        baseQuery: {
          query: queries.BaseQuery
        },
        subscriptionQuery: {
          query: queries.Subscription
        },
        deltaQuery: {
          query: queries.DeltaSync
        },
        cacheUpdates: ( deltaRecord  ) => {
          console.log('on cacheUpdates');
          console.log(JSON.stringify(deltaRecord));
          const id = deltaRecord.id;
          return [{ query: queries.GetItem, variables: { id: id } }];
        }
      })
    );

    // client.sync({
    //   baseQuery: {
    //     query: queries.BaseQuery
    //   },
    //   subscriptionQuery: {
    //     query: queries.Subscription
    //   }
    // });

    // ,
    // update: (cache, { data: { listPosts } }) => {
    //   console.log(JSON.stringify(cache));
    //   console.log(JSON.stringify(listPosts));
    // }

    // update: (cache, { data: { listPostsDelta } }) => {
    //   console.log(JSON.stringify(cache));
    //   console.log(JSON.stringify(listPostsDelta));
    // }

    // const observable = client.subscribe({ query: queries.Subscription });
    // observable.subscribe({
    //   next: realtimeResults,
    //   complete: console.log,
    //   error: observeError,
    // });

  }).then(() => {
    myLog.info({ "Ready": myHostId });
  }).catch((err) => {
    console.log('[ERROR] catched!!');
    console.log(JSON.stringify(err));
    return err;
  });
};

const newAppSyncClient = () => {
  haveToReset = false;
  client = new AWSAppSyncClient({
    url: URL,
    region: AWS_REGION,
    auth: {
      type: AUTH_TYPE.API_KEY,
      apiKey: '<my-api-key>'
      // credentials: AWS.config.credentials
    }
    // disableOffline: true
  });

  // hydrate();
  client.resetStore().then(hydrate);
};

const http = require('http');
const server = http.createServer((req, res) => {
  const baseName = path.basename(decodeURI(req.url));
  if (haveToReset) {
    newAppSyncClient();
  }
  const dtNow = DateTime.fromObject({ zone: TIMEZONE });
  res.write(`[${baseName}] [${dtNow.toFormat(DT_FORMAT)}]\n`);
  res.end();
}).listen(3000);

myHostId = "ThinkPad";

haveToReset = true;
doRequest("start");
// const timer = setInterval(() => {
//   doRequest("ping");
// }, 30 * 1000);
