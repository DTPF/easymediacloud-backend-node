import { NextFunction, Response } from "express";
import UserModel from "../core/user/models/user.model";
import { adminRole } from "../utils/constants";
import { responseKey, userKey } from "../core/responseKey";
import { RequestUser, User } from "../interfaces/user.interface";
import { ServerConfig } from "../config/config";
import i18next from "i18next";
const config: ServerConfig = require('../config/config')
const { auth } = require('express-oauth2-jwt-bearer');
const t = i18next.t

export const auth_0 = auth({
  audience: config.auth0.AUDIENCE,
  issuerBaseURL: config.auth0.ISSUER,
  tokenSigningAlg: 'RS256'
});

export const is_verified = async (req: RequestUser, res: Response, next: NextFunction) => {
  const findUser: User = await UserModel.findOne({ auth0Id: req.auth.payload.sub }).populate('licenses').lean().exec()
  if (!findUser) {
    return res.status(404).send({ status: userKey.notFound, message: t('user-not-found'), key: 'is_verified' })
  }
  if (findUser.isVerified === false) {
    return res.status(401).send({ status: userKey.notVerified, message: t('not-verified'), key: 'is_verified' })
  }
  i18next.changeLanguage(findUser.language ?? 'es');
  req.user = findUser
  next()
}

export const ensure_admin = async (req: RequestUser, res: Response, next: NextFunction) => {
  const findUser: User = await UserModel.findOne({ auth0Id: req.auth.payload.sub }).populate('licenses').lean().exec()
  if (!findUser) {
    return res.status(404).send({ status: userKey.notFound, message: t('user-not-found'), key: 'ensure_admin' })
  }
  if (findUser.role !== adminRole) {
    return res.status(401).send({ status: responseKey.unauthorized, message: t('unauthorized'), key: 'ensure_admin' })
  }
  if (findUser.isVerified === false) {
    return res.status(401).send({ status: userKey.notVerified, message: t('not-verified'), key: 'ensure_admin' })
  }
  i18next.changeLanguage(findUser.language ?? 'es');
  req.user = findUser
  next()
}

export const hydrate = async (req: RequestUser, res: Response, next: NextFunction) => {
  const findUser: User = await UserModel.findOne({ auth0Id: req.auth.payload.sub }).populate('licenses').lean().exec()
  if (!findUser) {
    return res.status(404).send({ status: userKey.notFound, message: t('user-not-found'), key: 'hydrate' })
  }
  i18next.changeLanguage(findUser.language ?? 'es');
  req.user = findUser
  next()
}