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
import { IApiKeyToken, ILicense, iLicenseKey } from "../../../interfaces/license.interface";
import { IMedia } from "../../../interfaces/media.interface";
import { convertBytes } from "../../../utils/getFolderSize";
import moment from "moment";
import SubscriptionModel from "../../subscriptions/models/subscription.model";
import { LICENSE_POPULATE, SUBSCRIPTION_POPULATE } from "../../modelsConstants";
import { REQUESTS_DATA_RANGE } from "../../subscriptions/subscriptionsConstants";
const config: ServerConfig = require('../../../config/config')
const fs = require("fs-extra")
const path = require("path")
const t = i18next.t
const getIP = require('ipware')().get_ip;

export async function postMedia(req: IRequestUser | any, response: Response) {
  const { folders } = req.params
  jwt.verify(req.headers.authorization, config.app.SECRET_KEY as string, async function (err: any, decodedApiKeyToken: IApiKeyToken | any) {
    // Verify authorization token
    if (err) {
      if (err.message === 'jwt expired') {
        return response.status(403).send({ status: responseKey.tokenExpired, message: t('token-expired') })
      }
      return response.status(403).send({ status: responseKey.tokenInvalid, message: t('token-not-valid') })
    }
    if (!decodedApiKeyToken) {
      return response.status(404).send({ status: mediaKey.apiKeyNotFound, message: t('api-key-not-found') })
    }
    const { id, project } = decodedApiKeyToken as IApiKeyToken
    // Find license
    const findLicense: ILicense = await LicenseModel.findOne({ apiKey: req.headers.authorization }).populate(SUBSCRIPTION_POPULATE).lean().exec()
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
    if (moment().isBefore(moment(findLicense.subscription.expire)) === false) {
      return response.status(403).send({ status: licenseKey.licenseExpired, message: t('license-expired') })
    }
    // Break if license is over max size
    if (findLicense.subscription.maxSize && findLicense.size >= findLicense.subscription.maxSize) {
      return response.status(403).send({ status: licenseKey.licenseOverMaxSize, message: t('license-over-max-size') })
    }
    // Break if license is over max requests
    if (findLicense.requestsInDataRange >= findLicense.subscription.requestsPerMonth) {
      return response.status(403).send({ status: licenseKey.licenseOverMaxRequests, message: t('license-over-max-requests') })
    }
    // Break if license token is not valid
    if (findLicense.apiKey?.toString() !== req.headers.authorization.toString()) {
      return response.status(403).send({ status: responseKey.tokenInvalid, message: t('token-not-valid') })
    }
    const foldersToArray = folders?.split('-')
    // Change - to / in folders
    const foldersPath = !foldersToArray ? '' : `${foldersToArray?.join('/')}/`
    // Server absolute path
    const serverAbsolutePath = `./${mediaFolderPath}/${id}/${project}/${foldersPath}`
    // Create directory if not exists
    if (!fs.existsSync(serverAbsolutePath)) {
      fs.mkdirSync(serverAbsolutePath, { recursive: true })
    }
    // Upload Media
    multipart({ uploadDir: serverAbsolutePath })(req, response, async (err: any, res: Response) => {
      if (err) {
        return response.status(500).send({ status: mediaKey.createMediaError, message: t('create-media-error'), err: err })
      }
      // Media required
      if (req.files.media === undefined || req.files.media?.length === 0) {
        return response.status(404).send({ status: mediaKey.mediaRequired, message: t('media-required') })
      }
      // ONE MEDIA
      if (req.files.media.length === undefined) {
        const mediaPath = req.files.media.path
        const mediaSize = req.files.media.size
        if (!mediaPath) {
          fs.unlinkSync(mediaPath)
          return response.status(500).send({ status: mediaKey.createMediaError, message: t('create-media-error'), err: err })
        }
        // Get filename
        const fileName = mediaPath.split('/')[mediaPath.split('/').length - 1]
        const mediaAbsolutePath = `${mediaFolderPath}/${id}/${project}${folders ? `/${folders}` : ''}`
        // Media Absolute Path
        const mediaAbsolutePathToSave = `${config.app.URL}/${mediaAbsolutePath}/${fileName}`
        // Create Media
        const newMedia = new MediaModel({
          license: findLicense._id,
          directory: folders?.split('-').join('/'),
          url: mediaAbsolutePathToSave,
          fileName: fileName,
          size: mediaSize,
          sizeT: convertBytes(mediaSize),
          enabled: true
        })
        try {
          const mediaSaved: IMedia = await newMedia.save()
          const mediaObject = {
            id: mediaSaved._id,
            url: mediaSaved.url,
            size: mediaSaved.sizeT,
            createdAt: mediaSaved.createdAt,
          }
          // Update license size and total files
          await LicenseModel.findOneAndUpdate({ _id: findLicense._id }, {
            $inc: { totalFiles: 1, size: mediaSize },
            sizeT: convertBytes(findLicense.size + mediaSize)
          }, { new: true }).lean().exec()
          return response.status(200).send({ status: mediaKey.createMediaSuccess, message: t('create-media-success'), media: mediaObject })
        } catch (err: any) {
          fs.unlinkSync(mediaPath)
          return response.status(500).send({ status: responseKey.serverError, message: t('server-error'), err: err })
        } finally {
          await LicenseModel.findOneAndUpdate({ _id: findLicense._id }, { updatedAt: new Date() }).lean().exec()
        }
      } else {
        // MULTIPLE MEDIA
        let medias: any[] = []
        let mediaPaths: any[] = []
        let totalSize = 0
        let totalFiles = 0
        for (const media of req.files.media) {
          const mediaPath = media.path
          const mediaSize = media.size
          if (!mediaPath) {
            fs.unlinkSync(mediaPath)
            return response.status(500).send({ status: mediaKey.createMediaError, message: t('create-media-error'), err: err })
          }
          const fileName = mediaPath.split('/')[mediaPath.split('/').length - 1]
          const url = `${config.app.URL}/${mediaPath}`

          const mediaAbsolutePath = `${mediaFolderPath}/${id}/${project}${folders ? `/${folders}` : ''}`
          // Media Absolute Path
          const mediaAbsolutePathToSave = `${config.app.URL}/${mediaAbsolutePath}/${fileName}`

          // Create media
          const newMedia = new MediaModel({
            license: findLicense._id,
            directory: folders?.split('-').join('/'),
            url: mediaAbsolutePathToSave,
            fileName: fileName,
            size: mediaSize,
            sizeT: convertBytes(mediaSize),
            enabled: true
          })
          try {
            const mediaSaved: IMedia = await newMedia.save()
            totalSize = totalSize + mediaSize
            totalFiles = totalFiles + 1
            const mediaObject = {
              id: mediaSaved._id,
              url: mediaSaved.url,
              size: mediaSaved.sizeT,
              createdAt: mediaSaved.createdAt,
            }
            mediaPaths.push(mediaPath)
            medias.push(mediaObject)
          } catch (err: any) {
            fs.unlinkSync(mediaPath)
          }
        }
        try {
          await LicenseModel.findOneAndUpdate({ _id: findLicense._id }, {
            $inc: {
              totalFiles: totalFiles,
              size: totalSize
            },
            sizeT: convertBytes(findLicense.size + totalSize)
          }, { new: true }).lean().exec()
          await LicenseModel.findOneAndUpdate({ _id: findLicense._id }, { updatedAt: new Date() }).lean().exec()
          return response.status(200).send({
            status: mediaKey.createMediaSuccess,
            message: t('create-media-success'),
            media: medias
          })
        } catch (err: any) {
          for (const mediaPath of mediaPaths) {
            fs.unlinkSync(mediaPath)
          }
          return response.status(500).send({ status: responseKey.serverError, message: t('server-error'), err: err })
        }
      }
    })
  })
}

export async function getMedia(req: Request, res: Response) {
  const { mainFolder, project, folders, media } = req.params
  // Find media
  const findMedia: IMedia = await MediaModel.findOne({ fileName: media }).populate(LICENSE_POPULATE).lean().exec()
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
  if (findMedia.license?.online === false) {
    return res.status(403).send({ status: licenseKey.licenseOffline, message: t('license-offline') })
  }
  const findSubscription = await SubscriptionModel.findOne({ _id: findMedia.license.subscription }).lean().exec()
  //Break if license is expired
  if (moment().isBefore(moment(findSubscription.expire)) === false) {
    return res.status(403).send({ status: licenseKey.licenseExpired, message: t('license-expired') })
  }
  // Break if license is over max requests
  if (findMedia.license.requests >= findSubscription.requestsPerMonth) {
    return res.status(403).send({ status: licenseKey.licenseOverMaxRequests, message: t('license-over-max-requests') })
  }
  const foldersArray = folders?.split('-')
  const foldersPath = !foldersArray ? '' : `${foldersArray?.join('/')}/`
  const filePath = `./${mediaFolderPath}/${mainFolder}/${project}/${foldersPath}${media}`
  // Chek if exists and return media
  try {
    await fs.exists(filePath, (exists: boolean) => {
      if (!exists) {
        return res.status(404).send({ status: mediaKey.mediaNotExists, message: t('media-not-exists') })
      } else {
        return res.sendFile(path.resolve(filePath))
      }
    })
  } catch (err) {
    return res.status(500).send({ status: responseKey.serverError, message: t('server-error'), err: err })
  } finally {
    const ipInfo = getIP(req);
    // Get requests from last month
    const filterByLastMonthLicenses =
      findMedia.license.requests?.filter((request: any) => request.createdAt > REQUESTS_DATA_RANGE)
    await LicenseModel.findOneAndUpdate({ _id: findMedia.license._id },
      {
        $inc: { totalRequests: 1 },
        $push: {
          requests: {
            media: findMedia._id,
            reqIp: ipInfo.clientIp,
            createdAt: new Date()
          }
        },
        [iLicenseKey.requestsInDataRange]: filterByLastMonthLicenses.length + 1
      }
    ).lean().exec()
    await MediaModel.findOneAndUpdate(
      { _id: findMedia._id },
      { $inc: { totalRequests: 1 } }
    ).lean().exec()
  }
}

export async function deleteMedia(req: IRequestUser | any, response: Response) {
  const { mediaId } = req.params
  jwt.verify(req.headers.authorization, config.app.SECRET_KEY as string, async function (err: any, decodedApiKeyToken: IApiKeyToken | any) {
    // Verify authorization token
    if (err) {
      if (err.message === 'jwt expired') {
        return response.status(403).send({ status: responseKey.tokenExpired, message: t('token-expired') })
      }
      return response.status(403).send({ status: responseKey.tokenInvalid, message: t('token-not-valid') })
    }
    if (!decodedApiKeyToken) {
      return response.status(404).send({ status: mediaKey.apiKeyNotFound, message: t('api-key-not-found') })
    }
    const { id, project, apiKey } = decodedApiKeyToken as IApiKeyToken
    // Find Media
    const findMedia: IMedia = await MediaModel.findOne({ _id: mediaId }).populate(LICENSE_POPULATE).lean().exec()
    if (!findMedia) {
      return response.status(404).send({ status: mediaKey.mediaNotExists, message: t('media-not-exists') })
    }
    // Find license
    const findLicense: ILicense = await LicenseModel.findOne({ apiKey: req.headers.authorization }).populate(SUBSCRIPTION_POPULATE).lean().exec()
    if (!findLicense || !apiKey) {
      return response.status(404).send({ status: licenseKey.licenseNotFound, message: t('license-not-found') })
    }
    // Check if media is from license
    if (findMedia.license._id.toString() !== findLicense._id.toString()) {
      return response.status(404).send({ status: mediaKey.mediaDontBelongToLicense, message: t('media-dont-belong-to-license') })
    }
    // Break if license is not enabled
    if (findLicense.enabled === false) {
      return response.status(404).send({ status: licenseKey.licenseNotEnabled, message: t('license-not-enabled') })
    }
    // Get absolute path
    const folders = findMedia.url.split(`/${project}/`)[1].split('/')
    let transFolders = undefined
    if (folders.length > 1) {
      const hyphenseSplit = folders[0].split('-')
      if (hyphenseSplit.length > 1) {
        transFolders = hyphenseSplit.join('/')
      } else {
        transFolders = folders[0]
      }
    }
    const serverAbsolutePath = `./${mediaFolderPath}/${id}/${project}/${transFolders ? `${transFolders}/` : ''}${findMedia.fileName}`
    // Check if exists and delete media
    try {
      await fs.exists(serverAbsolutePath, async (exists: boolean) => {
        if (!exists) {
          return response.status(404).send({ status: mediaKey.mediaNotExists, message: t('media-not-exists') })
        } else {
          await fs.unlink(serverAbsolutePath)
          await MediaModel.findOneAndDelete({ _id: findMedia._id }).lean().exec()
          await LicenseModel.findOneAndUpdate({ _id: findLicense._id }, {
            $inc: {
              totalFiles: -1,
              size: -findMedia.size
            },
            sizeT: convertBytes(findLicense.size - findMedia.size)
          }, { new: true }).lean().exec()
          return response.status(200).send({ status: mediaKey.deleteMediaSuccess, message: t('delete-media-success') })
        }
      })
    } catch (err) {
      return response.status(500).send({ status: responseKey.serverError, message: t('server-error'), err: err })
    } finally {
      await LicenseModel.findOneAndUpdate({ _id: findLicense._id }, { updatedAt: new Date() }).lean().exec()
    }
  })
}