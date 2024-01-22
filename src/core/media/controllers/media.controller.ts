import { Request, Response } from "express";
import multipart from "connect-multiparty"
import i18next from "i18next";
import { mediaFolderPath } from "../../../utils/constants";
import { IRequestUser } from "../../../interfaces/user.interface";
import jwt from "jsonwebtoken";
import LicenseModel from "../../licenses/models/license.model";
import MediaModel from "../models/media.model";
import { ServerConfig } from "../../../config/config";
import { licenseKey, mediaKey, responseKey } from "../../responseKey";
import { IApiKey, ILicense } from "../../../interfaces/license.interface";
import { IMedia } from "../../../interfaces/media.interface";
import { convertBytes } from "../../../utils/getFolderSize";
import moment from "moment";
import SuscriptionModel from "../../suscriptions/models/suscription.model";
const config: ServerConfig = require('../../../config/config')
const fs = require("fs-extra")
const path = require("path")
const t = i18next.t

export async function postMedia(req: IRequestUser | any, response: Response) {
  const { folders } = req.params
  // Verify authorization token
  jwt.verify(req.headers.authorization, config.app.SECRET_KEY as string, async function (err: any, decodedApiKeyToken: IApiKey | any) {
    if (err) {
      return response.status(403).send({ status: responseKey.tokenInvalid, message: t('token-not-valid') })
    }
    if (!decodedApiKeyToken) {
      return response.status(404).send({ status: mediaKey.apiKeyNotFound, message: t('api-key-not-found') })
    }
    const { project, nickname } = decodedApiKeyToken
    // Find license
    const findLicense: ILicense | any = await LicenseModel.findOne({ project: project }).populate('suscription').lean().exec()
    if (!findLicense || !decodedApiKeyToken.apiKey) {
      return response.status(404).send({ status: licenseKey.licenseNotFound, message: t('license-not-found') })
    }
    // Break if license is not enabled
    if (findLicense.enabled === false) {
      return response.status(404).send({ status: licenseKey.licenseNotEnabled, message: t('license-not-enabled') })
    }
    // Break if license is offline
    if (findLicense.online === false) {
      return response.status(403).send({ status: licenseKey.licenseOffline, message: t('license-offline') })
    }
    // Break if license is expired
    if (moment().isBefore(moment(findLicense.suscription.expire)) === false) {
      return response.status(403).send({ status: licenseKey.licenseExpired, message: t('license-expired') })
    }
    // Break if license is over max size
    if (findLicense.size >= findLicense.suscription.maxSize) {
      return response.status(403).send({ status: licenseKey.licenseOverMaxSize, message: t('license-over-max-size') })
    }
    const foldersArray = folders?.split('-')
    const foldersPath = !foldersArray ? '' : `${foldersArray?.join('/')}/`
    const absolutePath = `${mediaFolderPath}/${nickname}/${project}/${foldersPath}`
    // Create directory if not exists
    if (!fs.existsSync(absolutePath)) {
      fs.mkdirSync(absolutePath, { recursive: true })
    }
    // Upload image
    multipart({ uploadDir: absolutePath })(req, response, async (err: any, res: Response) => {
      if (err) {
        return response.status(500).send({ status: mediaKey.createMediaError, message: t('create-media-error'), err: err })
      }
      const imagePath = req.files?.image && req.files?.image?.path
      // Image required
      if (!req.files?.image || !req.files?.image.name || req.files?.image.size === 0) {
        fs.unlinkSync(imagePath)
        return response.status(404).send({ status: mediaKey.createMediaError, message: t('create-media-error') })
      }
      const fileName = req.files.image.path.split('/')[req.files.image.path.split('/').length - 1]
      const url = `${config.app.URL}/${imagePath}`
      // Create media
      const newMedia = new MediaModel({
        license: findLicense._id,
        directory: folders?.split('-').join('/'),
        url: url,
        fileName: fileName,
        size: req.files.image.size,
        sizeT: convertBytes(req.files.image.size),
        enabled: true
      })
      try {
        const mediaSaved: IMedia = await newMedia.save()
        mediaSaved.__v = undefined
        // Update license size and total files
        await LicenseModel.findOneAndUpdate({ _id: findLicense._id }, {
          $inc: { totalFiles: 1, size: req.files.image.size },
          sizeT: convertBytes(findLicense.size + req.files.image.size)
        }, { new: true }).lean().exec()
        return response.status(200).send({ status: mediaKey.createMediaSuccess, message: t('create-media-success'), media: mediaSaved })
      } catch (err: any) {
        fs.unlinkSync(imagePath)
        return response.status(500).send({ status: responseKey.serverError, message: t('server-error'), err: err })
      }
    })
  })
}

export async function getMedia(req: Request, res: Response) {
  const { project, folders, media } = req.params
  // Find media
  const findMedia: IMedia = await MediaModel.findOne({ fileName: media }).populate('license').lean().exec()
  if (!findMedia) {
    return res.status(405).send({ status: mediaKey.mediaNotExists, message: t('media-not-exists') })
  }
  // Break if license is not enabled
  if (findMedia && findMedia.license && !findMedia.license.enabled) {
    return res.status(403).send({ status: licenseKey.licenseNotEnabled, message: t('license-not-enabled') })
  }
  // Break if media is not enabled
  if (findMedia && !findMedia.enabled) {
    return res.status(403).send({ status: mediaKey.mediaProtected, message: t('media-protected') })
  }
  // Break if license is offline
  if (findMedia && findMedia.license.online === false) {
    return res.status(403).send({ status: licenseKey.licenseOffline, message: t('license-offline') })
  }
  const findSuscription = await SuscriptionModel.findOne({ _id: findMedia.license.suscription }).lean().exec()
  //Break if license is expired
  if (moment().isBefore(moment(findSuscription.expire)) === false) {
    return res.status(403).send({ status: licenseKey.licenseExpired, message: t('license-expired') })
  }
  const foldersArray = folders?.split('-')
  const foldersPath = !foldersArray ? '' : `${foldersArray?.join('/')}/`
  const filePath = `${mediaFolderPath}/${project}/${foldersPath}${media}`
  // Chek if exists and return media
  await fs.exists(filePath, (exists: boolean) => {
    if (!exists) {
      return res.status(404).send({ status: mediaKey.mediaNotExists, message: t('media-not-exists') })
    } else {
      return res.sendFile(path.resolve(filePath))
    }
  })
}