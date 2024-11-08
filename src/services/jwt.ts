import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import moment from 'moment';
import { IApiKeyToken } from '../interfaces/license.interface';
import config from '../config/config';

export async function createLicenseApiKeyJWT(project: string, userId: string, mainFolderName: string) {
  const payload = {
    id: mainFolderName,
    user: userId,
    project: project,
    apiKey: new mongoose.Types.ObjectId(),
    createdAt: moment().unix(),
    updatedAt: moment().unix(),
  };
  if (!config.app.SECRET_KEY) throw new Error('SECRET_KEY is not defined');
  return jwt.sign(payload, config.app.SECRET_KEY as string);
}

export async function refreshLicenseApiKeyJWT(oldJwt: IApiKeyToken) {
  const payload = {
    ...oldJwt,
    apiKey: new mongoose.Types.ObjectId(),
    updatedAt: moment().unix(),
  };
  if (!config.app.SECRET_KEY) throw new Error('SECRET_KEY is not defined');
  return jwt.sign(payload, config.app.SECRET_KEY as string);
}
