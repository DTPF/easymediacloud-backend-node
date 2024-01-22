import jwt from "jsonwebtoken";
import { ServerConfig } from "../config/config";
import mongoose from "mongoose";
const config: ServerConfig = require('../config/config')

export async function createLicenseApiKeyJWT(project: string, nickname: string) {
  const payload = {
    project: project,
    nickname: nickname,
    apiKey: new mongoose.Types.ObjectId,
  };
  if (!config.app.SECRET_KEY) throw new Error('SECRET_KEY is not defined')
  return jwt.sign(payload, config.app.SECRET_KEY) as string;
}