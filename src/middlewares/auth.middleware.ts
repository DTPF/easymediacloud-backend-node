import { NextFunction, Response } from "express";
import { DEFAULT_LANG, adminRole } from "../utils/constants";
import { responseKey, userKey } from "../core/responseKey";
import { IRequestUser } from "../interfaces/user.interface";
import i18next from "i18next";
import { dauth } from "dauth-md-node";
import config from "../config/config";
const t = i18next.t

export const dauth_md = dauth({
  ssid: config.dauth.SSID as string,
  domainName: config.dauth.DOMAIN_NAME as string
})

export const is_verified = async (req: IRequestUser, res: Response, next: NextFunction) => {
  i18next.changeLanguage(DEFAULT_LANG);
  if (req.user.is_verified === false) {
    return res.status(401).send({ status: userKey.notVerified, message: t('not-verified'), mdKey: 'is_verified' })
  }
  next()
}

export const ensure_admin = async (req: IRequestUser, res: Response, next: NextFunction) => {
  i18next.changeLanguage(DEFAULT_LANG);
  if (req.user.is_verified === false) {
    return res.status(401).send({ status: userKey.notVerified, message: t('not-verified'), mdKey: 'ensure_admin' })
  }
  if (req.user.role !== adminRole) {
    return res.status(401).send({ status: responseKey.unauthorized, message: t('unauthorized'), mdKey: 'ensure_admin' })
  }
  next()
}