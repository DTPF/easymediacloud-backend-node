import { developmentStage, productionStage } from "../utils/constants"
const dotenv = require('dotenv')
dotenv.config({ path: process.env.NODE_ENV === productionStage ? '.env.production' : '.env.development' })
const ENV = process.env.NODE_ENV || developmentStage

type ServerConfig = {
  app: {
    URL: string,
    PORT: string | number,
    API_VERSION: string,
    CLIENT_URL: string,
    SECRET_KEY: string | undefined
    MEDIA_URL?: string
  },
  db: {
    MONGO_URL: string,
    PORT_MONGO_DB: string | number
  },
  dauth: {
    TSK: string | undefined
    DOMAIN_NAME: string | undefined
    DOMAIN_URL?: string
  }
}

type ConfigEnv = {
  [key: string]: ServerConfig
}

const CONFIG: ConfigEnv = {
  development: {
    app: {
      URL: `http://${process.env.IP_SERVER}:${process.env.PORT_SERVER}/api/${process.env.API_VERSION}`,
      PORT: process.env.PORT_SERVER || 4000,
      API_VERSION: process.env.API_VERSION || 'v1',
      CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
      SECRET_KEY: process.env.SECRET_KEY,
      MEDIA_URL: `${process.env.MEDIA_URL}/api/${process.env.API_VERSION}`
    },
    db: {
      MONGO_URL: `mongodb://${process.env.IP_SERVER}:${process.env.PORT_MONGO_DB}/${process.env.DB_NAME}`,
      PORT_MONGO_DB: process.env.PORT_MONGO_DB || 27017
    },
    dauth: {
      TSK: process.env.DAUTH_TSK,
      DOMAIN_NAME: process.env.DAUTH_DOMAIN_NAME,
      DOMAIN_URL: process.env.DAUTH_DOMAIN_URL
    }
  },
  production: {
    app: {
      URL: `http://${process.env.IP_SERVER}:${process.env.PORT_SERVER}/api/${process.env.API_VERSION}`,
      PORT: process.env.PORT_SERVER || 4001,
      API_VERSION: process.env.API_VERSION || 'v1',
      CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
      SECRET_KEY: process.env.SECRET_KEY,
      MEDIA_URL: `${process.env.MEDIA_URL}/api/${process.env.API_VERSION}`
    },
    db: {
      MONGO_URL: `mongodb://${process.env.DB_USER_PASSWORD}@${process.env.IP_SERVER}:${process.env.PORT_MONGO_DB}/${process.env.DB_NAME}?authSource=admin`,
      PORT_MONGO_DB: process.env.PORT_MONGO_DB || 27017
    },
    dauth: {
      TSK: process.env.DAUTH_TSK,
      DOMAIN_NAME: process.env.DAUTH_DOMAIN_NAME,
      DOMAIN_URL: process.env.DAUTH_DOMAIN_URL
    }
  }
}

export default CONFIG[ENV] as ServerConfig