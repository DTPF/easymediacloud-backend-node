import { Request, Response } from "express";
import multipart from "connect-multiparty"
import i18next from "i18next";
import { mediaFolderPath } from "../../../utils/constants";
import { IRequestUser, iUserKey } from "../../../interfaces/user.interface";
import jwt from "jsonwebtoken";
import LicenseModel from "../../licenses/models/license.model";
import MediaModel from "../models/media.model";
import { ServerConfig } from "../../../config/config";
import { licenseKey, mediaKey, responseKey } from "../../responseKey";
import { IApiKeyToken, ILicense, TRequests, iApiKeyTokenKey, iLicenseKey, iRequestsKey } from "../../../interfaces/license.interface";
import { IMedia, iMediaKey } from "../../../interfaces/media.interface";
import { convertBytes } from "../../../utils/getFolderSize";
import moment from "moment";
import SubscriptionModel from "../../subscriptions/models/subscription.model";
import { LICENSE_POPULATE, SUBSCRIPTION_POPULATE } from "../../modelsConstants";
import { ISubscription, iSubscriptionKey } from "../../../interfaces/subscription.interface";
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
    // Find license
    const findLicense: ILicense = await LicenseModel.findOne({ [iLicenseKey.apiKey]: req.headers.authorization }).populate(SUBSCRIPTION_POPULATE).lean().exec()
    if (!findLicense || !decodedApiKeyToken[iApiKeyTokenKey.apiKey]) {
      return response.status(404).send({ status: licenseKey.licenseNotFound, message: t('license-not-found') })
    }
    // Break if license is not enabled
    if (findLicense[iLicenseKey.enabled] === false) {
      return response.status(404).send({ status: licenseKey.licenseNotEnabled, message: t('license-not-enabled') })
    }
    // Break if license is offline
    if (findLicense[iLicenseKey.online] === false) {
      return response.status(403).send({ status: licenseKey.licenseOffline, message: t('license-offline') })
    }
    // Break if license is expired
    const licenseSubscription: ISubscription = findLicense[iLicenseKey.subscription]
    if (moment().isBefore(moment(licenseSubscription.expire)) === false) {
      return response.status(403).send({ status: licenseKey.licenseExpired, message: t('license-expired') })
    }
    // Break if license is over max size
    if (licenseSubscription.maxSize && findLicense.size >= licenseSubscription.maxSize) {
      return response.status(403).send({ status: licenseKey.licenseOverMaxSize, message: t('license-over-max-size') })
    }
    // Break if license token is not valid
    const apiKeyUser = findLicense[iLicenseKey.apiKey] as ILicense | undefined
    if (apiKeyUser?.toString() !== req.headers.authorization.toString()) {
      return response.status(403).send({ status: responseKey.tokenInvalid, message: t('token-not-valid') })
    }
    const foldersToArray = folders?.split('-')
    // Change - to / in folders
    const foldersPath = !foldersToArray ? '' : `${foldersToArray?.join('/')}/`
    // Server absolute path
    const mainFolder = decodedApiKeyToken[iApiKeyTokenKey.id] as IApiKeyToken['id']
    const projectName = decodedApiKeyToken[iApiKeyTokenKey.project] as IApiKeyToken['project']
    const userId = decodedApiKeyToken[iApiKeyTokenKey.user] as IApiKeyToken['user']
    const serverAbsolutePath = `./${mediaFolderPath}/${mainFolder}/${projectName}/${foldersPath}`
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
        const mediaAbsolutePath = `${mediaFolderPath}/${mainFolder}/${projectName}${folders ? `/${folders}` : ''}`
        // Media Absolute Path
        const mediaAbsolutePathToSave = `${config.app.MEDIA_URL}/${mediaAbsolutePath}/${fileName}`
        // Create Media
        const newMedia = newMediaModel({ license: findLicense, userId, folders, mediaAbsolutePathToSave, fileName, mediaSize })
        try {
          const mediaSaved: IMedia = await newMedia.save()
          const requestMediaObject = {
            id: mediaSaved._id,
            url: mediaSaved.url,
            size: mediaSaved.sizeT,
            createdAt: mediaSaved.createdAt,
          }
          // Update license size and total files
          await LicenseModel.findOneAndUpdate({ [iLicenseKey._id]: findLicense[iLicenseKey._id] }, {
            $inc: { [iLicenseKey.totalFiles]: 1, [iLicenseKey.size]: mediaSize },
            [iLicenseKey.sizeT]: convertBytes(findLicense[iLicenseKey.size] as ILicense + mediaSize)
          }, { new: true }).lean().exec()
          return response.status(200).send({ status: mediaKey.createMediaSuccess, message: t('create-media-success'), media: requestMediaObject })
        } catch (err: any) {
          fs.unlinkSync(mediaPath)
          return response.status(500).send({ status: responseKey.serverError, message: t('server-error'), err: err })
        } finally {
          await LicenseModel.findOneAndUpdate({ [iLicenseKey._id]: findLicense[iLicenseKey._id] }, { [iLicenseKey.updatedAt]: new Date() }).lean().exec()
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
          const mediaAbsolutePath = `${mediaFolderPath}/${mainFolder}/${projectName}${folders ? `/${folders}` : ''}`
          // Media Absolute Path
          const mediaAbsolutePathToSave = `${config.app.MEDIA_URL}/${mediaAbsolutePath}/${fileName}`
          // Create media
          const newMedia = newMediaModel({ license: findLicense, userId, folders, mediaAbsolutePathToSave, fileName, mediaSize })
          try {
            const mediaSaved: IMedia = await newMedia.save()
            totalSize = totalSize + mediaSize
            totalFiles = totalFiles + 1
            const requestMediaObject = {
              id: mediaSaved._id,
              url: mediaSaved.url,
              size: mediaSaved.sizeT,
              createdAt: mediaSaved.createdAt,
            }
            mediaPaths.push(mediaPath)
            medias.push(requestMediaObject)
          } catch (err: any) {
            fs.unlinkSync(mediaPath)
          }
        }
        try {
          await LicenseModel.findOneAndUpdate({ [iLicenseKey._id]: findLicense[iLicenseKey._id] }, {
            $inc: {
              [iLicenseKey.totalFiles]: totalFiles,
              [iLicenseKey.size]: totalSize
            },
            [iLicenseKey.sizeT]: convertBytes(findLicense.size + totalSize),
            [iLicenseKey.updatedAt]: new Date()
          }, { new: true }).lean().exec()
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
  const findMedia: IMedia = await MediaModel.findOne({ [iMediaKey.fileName]: media }).populate(LICENSE_POPULATE).lean().exec()
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
  const findSubscription: ISubscription = await SubscriptionModel.findOne({ [iSubscriptionKey._id]: findMedia.license.subscription }).lean().exec()
  //Break if license is expired
  if (moment().isBefore(moment(findSubscription.expire)) === false) {
    return res.status(403).send({ status: licenseKey.licenseExpired, message: t('license-expired') })
  }
  // UPDATE REQUESTS
  const dataRange = moment().subtract(findSubscription.requestsDataRange.quantity, findSubscription.requestsDataRange.cicle as moment.DurationInputArg2).toDate()
  const filterLicenseRequestsByDataRange = findMedia.license.requests?.filter(
    (request: TRequests) => request.createdAt > dataRange
  )
  await LicenseModel.findOneAndUpdate({ [iLicenseKey._id]: findMedia.license._id },
    { [iLicenseKey.requestsInDataRange]: filterLicenseRequestsByDataRange.length + 1 }
  ).lean().exec()
  // Break if license is over max requests
  if ((filterLicenseRequestsByDataRange.length + 1) >= findSubscription.maxRequests) {
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
    await LicenseModel.findOneAndUpdate({ [iLicenseKey._id]: findMedia.license._id },
      {
        $inc: { [iLicenseKey.totalRequests]: 1 },
        $push: {
          [iLicenseKey.requests]: {
            [iRequestsKey.media]: findMedia._id,
            [iRequestsKey.reqIp]: ipInfo.clientIp,
            [iRequestsKey.createdAt]: new Date()
          }
        }
      }
    ).lean().exec()
    await MediaModel.findOneAndUpdate(
      { [iMediaKey._id]: findMedia._id },
      { $inc: { [iMediaKey.totalRequests]: 1 } }
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
    const mainFolder = decodedApiKeyToken[iApiKeyTokenKey.id] as IApiKeyToken['id']
    const projectName = decodedApiKeyToken[iApiKeyTokenKey.project] as IApiKeyToken['project']
    const apiKeyKey = decodedApiKeyToken[iApiKeyTokenKey.project] as IApiKeyToken['apiKey']
    // Find Media
    const findMedia: IMedia = await MediaModel.findOne({ [iMediaKey._id]: mediaId }).populate(LICENSE_POPULATE).lean().exec()
    if (!findMedia) {
      return response.status(404).send({ status: mediaKey.mediaNotExists, message: t('media-not-exists') })
    }
    // Find license
    const findLicense: ILicense = await LicenseModel.findOne({ [iLicenseKey.apiKey]: req.headers.authorization }).populate(SUBSCRIPTION_POPULATE).lean().exec()
    if (!findLicense || !apiKeyKey) {
      return response.status(404).send({ status: licenseKey.licenseNotFound, message: t('license-not-found') })
    }
    // Check if media is from license
    if ((findMedia[iMediaKey.license][iLicenseKey._id] as ILicense['_id']).toString() !== (findLicense[iLicenseKey._id] as ILicense['_id']).toString()) {
      return response.status(404).send({ status: mediaKey.mediaDontBelongToLicense, message: t('media-dont-belong-to-license') })
    }
    // Break if license is not enabled
    if (findLicense[iLicenseKey.enabled] === false) {
      return response.status(404).send({ status: licenseKey.licenseNotEnabled, message: t('license-not-enabled') })
    }
    // Get absolute path
    const folders = findMedia.url.split(`/${projectName}/`)[1].split('/')
    let transFolders = undefined
    if (folders.length > 1) {
      const hyphenseSplit = folders[0].split('-')
      if (hyphenseSplit.length > 1) {
        transFolders = hyphenseSplit.join('/')
      } else {
        transFolders = folders[0]
      }
    }
    const serverAbsolutePath = `./${mediaFolderPath}/${mainFolder}/${projectName}/${transFolders ? `${transFolders}/` : ''}${findMedia.fileName}`
    // Check if exists and delete media
    try {
      await fs.exists(serverAbsolutePath, async (exists: boolean) => {
        if (!exists) {
          return response.status(404).send({ status: mediaKey.mediaNotExists, message: t('media-not-exists') })
        } else {
          await fs.unlink(serverAbsolutePath)
          await MediaModel.findOneAndDelete({ [iMediaKey._id]: findMedia[iMediaKey._id] }).lean().exec()
          await LicenseModel.findOneAndUpdate({ [iLicenseKey._id]: findLicense[iLicenseKey._id] }, {
            $inc: {
              [iLicenseKey.totalFiles]: -1,
              [iLicenseKey.size]: -findMedia[iMediaKey.size]
            },
            [iLicenseKey.sizeT]: convertBytes(findLicense[iLicenseKey.size] - findMedia[iMediaKey.size])
          }, { new: true }).lean().exec()
          return response.status(200).send({ status: mediaKey.deleteMediaSuccess, message: t('delete-media-success') })
        }
      })
    } catch (err) {
      return response.status(500).send({ status: responseKey.serverError, message: t('server-error'), err: err })
    } finally {
      await LicenseModel.findOneAndUpdate({ [iLicenseKey._id]: findLicense[iLicenseKey._id] }, { [iLicenseKey.updatedAt]: new Date() }).lean().exec()
    }
  })
}

export async function getMyMedia(req: IRequestUser | any, response: Response) {
  try {
    const findMedia: IMedia[] = await MediaModel.find({ [iMediaKey.user]: req.user[iUserKey._id] }).lean().exec()
    if (!findMedia) {
      return response.status(404).send({ status: mediaKey.mediaNotFound, message: t('media-not-found') })
    }
    return response.status(200).send({ status: mediaKey.getMediaSuccess, message: t('get-media-success'), media: findMedia })
  } catch (err) {
    return response.status(500).send({ status: responseKey.serverError, message: t('server-error'), err: err })
  }
}

export async function getMediaByLicense(req: IRequestUser | any, response: Response) {
  const { licenseId } = req.params
  try {
    const findLicense: ILicense = await LicenseModel.findOne({ [iLicenseKey._id]: licenseId }).lean().exec()
    if (!findLicense) {
      return response.status(404).send({ status: licenseKey.licenseNotFound, message: t('license-not-found') })
    }
    const findMedia: IMedia[] = await MediaModel.find({ [iMediaKey.license]: licenseId }).lean().exec()
    if (!findMedia) {
      return response.status(404).send({ status: mediaKey.mediaNotFound, message: t('media-not-found') })
    }
    return response.status(200).send({ status: mediaKey.getMediaSuccess, message: t('get-media-success'), media: findMedia })

  } catch (err) {
    return response.status(500).send({ status: responseKey.serverError, message: t('server-error'), err: err })
  }
}

///////////////////////////////////////////////////////////////////////////////////////7
///////////////////////////////////////////////////////////////////////////////////////7

type TNewMediaModel = {
  license: ILicense
  userId: string
  folders: string
  mediaAbsolutePathToSave: string
  fileName: string
  mediaSize: number
}
const newMediaModel = ({ license, userId, folders, mediaAbsolutePathToSave, fileName, mediaSize }: TNewMediaModel) => {
  return new MediaModel({
    [iMediaKey.user]: userId,
    [iMediaKey.license]: license[iLicenseKey._id],
    [iMediaKey.directory]: folders?.split('-').join('/'),
    [iMediaKey.url]: mediaAbsolutePathToSave,
    [iMediaKey.fileName]: fileName,
    [iMediaKey.size]: mediaSize,
    [iMediaKey.sizeT]: convertBytes(mediaSize)
  })
}