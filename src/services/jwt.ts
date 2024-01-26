import jwt from "jsonwebtoken";
import { ServerConfig } from "../config/config";
import mongoose from "mongoose";
import moment from "moment";
import { IApiKey } from "../interfaces/license.interface";
const config: ServerConfig = require('../config/config')

export async function createLicenseApiKeyJWT(project: string, mainFolderName: string | Object) {
  const payload = {
    id: mainFolderName.toString(),
    project: project,
    apiKey: new mongoose.Types.ObjectId,
    createToken: moment().unix(),
  };
  if (!config.app.SECRET_KEY) throw new Error('SECRET_KEY is not defined')
  return jwt.sign(payload, config.app.SECRET_KEY as string);
}

export async function refreshLicenseApiKeyJWT(oldJwt: IApiKey) {
  const payload = {
    ...oldJwt,
    apiKey: new mongoose.Types.ObjectId,
    createToken: moment().unix(),
  };
  if (!config.app.SECRET_KEY) throw new Error('SECRET_KEY is not defined')
  return jwt.sign(payload, config.app.SECRET_KEY as string);
}