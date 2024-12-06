import express, { Express } from 'express';
import { DEFAULT_LANG, productionStage } from './utils/constants';
import i18next from 'i18next';
import { englishLang } from './assets/locale/en';
import { spanishLang } from './assets/locale/es';
import config from './config/config';
import licenseApi from './core/licenses/router/licenses.router';
import mediaApi from './core/media/router/media.router';
import subscriptionApi from './core/subscriptions/router/subscriptions.router';
const helmet = require('helmet');
const cors = require('cors');
const server: Express = express();
const path = require('path');
// Routes

i18next.init({
  lng: DEFAULT_LANG,
  resources: {
    es: { translation: spanishLang },
    en: { translation: englishLang },
  },
});
server.use(express.json());
server.use(
  cors({
    origin: [config.app.CLIENT_URL, config.dauth.DOMAIN_URL as string],
  })
);
server.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'", config.dauth.DOMAIN_URL as string],
        objectSrc: ["'none'"],
        scriptSrc: ["'self'", config.dauth.DOMAIN_URL as string, 'blob:'],
        styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
        connectSrc: ["'self'", config.dauth.DOMAIN_URL as string],
        imgSrc: ["'self'", 'https:', 'data:'],
        upgradeInsecureRequests: [],
      },
    },
  })
);
server.use(`/api/${config.app.API_VERSION}`, mediaApi);
server.use(`/api/${config.app.API_VERSION}`, licenseApi);
server.use(`/api/${config.app.API_VERSION}`, subscriptionApi);
if (process.env.NODE_ENV === productionStage) {
  server.get('/client/service-worker.js', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'service-worker.js'));
  });
  server.use('/', express.static('client', { redirect: false }));
  server.get('*', function (req, res, next) {
    res.sendFile(path.resolve('client/index.html'));
  });
}

export default server;
