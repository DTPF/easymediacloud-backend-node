import express, { Express, Request, Response, NextFunction } from "express";
import errorMiddleware from "./middlewares/error.middleware";
import { ES_lang, productionStage } from "./utils/constants";
import i18next from 'i18next';
import { englishLang } from "./assets/locale/en";
import { spanishLang } from "./assets/locale/es";
import { ServerConfig } from "./config/config";
const config: ServerConfig = require('./config/config')
const helmet = require('helmet')
const cors = require('cors')
const app: Express = express()
const path = require("path")
// Routes
const mediaRoutes = require("./core/media/router/media.router");
const licensesRoutes = require("./core/licenses/router/licenses.router");
const subscriptionRoutes = require("./core/subscriptions/router/subscriptions.router");

i18next.init({
  lng: ES_lang,
  // debug: true,
  resources: {
    es: { translation: spanishLang },
    en: { translation: englishLang }
  }
});
i18next.changeLanguage(ES_lang);
app.use(express.json())
app.use(cors({
  origin: [config.app.CLIENT_URL]
}))
app.use(helmet())
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header("Cross-Origin-Embedder-Policy", "cross-origin")
  next()
})
app.use(`/api/${config.app.API_VERSION}`, mediaRoutes);
app.use(`/api/${config.app.API_VERSION}`, licensesRoutes);
app.use(`/api/${config.app.API_VERSION}`, subscriptionRoutes);
if (process.env.NODE_ENV === productionStage) {
  app.get("/client/service-worker.js", (req, res) => {
    res.sendFile(path.resolve(__dirname, "client", "service-worker.js"));
  });
  app.use('/', express.static('client', { redirect: false }))
  app.get('*', function (req, res, next) {
    res.sendFile(path.resolve('client/index.html'))
  })
}
app.use(errorMiddleware)

module.exports = app;