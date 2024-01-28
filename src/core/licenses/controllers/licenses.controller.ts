import { Response } from "express";
import LicenseModel from "../models/license.model";
import UserModel from "../../user/models/user.model";
import { mediaFolderPath } from "../../../utils/constants";
import { responseKey, licenseKey, subscriptionKey } from "../../responseKey";
import { IRequestUser, IUser } from "../../../interfaces/user.interface";
import { createLicenseApiKeyJWT, refreshLicenseApiKeyJWT } from "../../../services/jwt";
import jwt from "jsonwebtoken";
import i18next from "i18next";
import { ServerConfig } from "../../../config/config";
import { IApiKeyToken, ILicense, ILicenseResponse } from "../../../interfaces/license.interface";
import SubscriptionModel from "../../subscriptions/models/subscription.model";
import { FREE, FREE_LICENSES_LIMIT } from "../../subscriptions/subscriptionsConstants";
import { ISubscription } from "../../../interfaces/subscription.interface";
import { SUBSCRIPTION_POPULATE } from "../../modelsConstants";
import MediaModel from "../../media/models/media.model";
import { IMedia } from "../../../interfaces/media.interface";
const config: ServerConfig = require('../../../config/config')
const t = i18next.t
const fs = require("fs-extra")

export async function createLicense(req: IRequestUser, res: Response) {
	const { project }: { project: string } = req.body
	if (!project) {
		return res.status(404).send({ status: licenseKey.projectRequired, message: t('data-required') })
	}
	const findUserLicenses: ILicense[] = await LicenseModel.find({ user: req.user._id }).populate(SUBSCRIPTION_POPULATE).lean().exec()
	//Break if user has more than 5 free licenses
	const userFreeLicenses = findUserLicenses.filter((license: ILicense) => license.subscription?.type === FREE).length
	if (userFreeLicenses >= FREE_LICENSES_LIMIT) {
		return res.status(404).send({ status: licenseKey.freeLicensesLimit, message: t('licenses_free-licenses-limit') })
	}
	// Check if exists a license with the same project name
	const licenseProjectExists = await findUserLicenses.find((license: ILicense) => license.project === project)
	if (licenseProjectExists) {
		return res.status(404).send({ status: licenseKey.repeatedProject, message: t('project-repeated') })
	}
	// Create media folder if not exists
	if (!fs.existsSync(`./${mediaFolderPath}`)) {
		fs.mkdirSync(`./${mediaFolderPath}`)
	}
	const mainFolderName = req.user._id.toString()
	// Create main folder if not exists
	if (!fs.existsSync(`./${mediaFolderPath}/${mainFolderName}`)) {
		fs.mkdirSync(`./${mediaFolderPath}/${mainFolderName}`)
	}
	// Create project folder
	fs.mkdir(`./${mediaFolderPath}/${mainFolderName}/${project}`, async function (err: any) {
		if (err) {
			return res.status(404).send({ status: licenseKey.createDirectoryError, message: t('licenses_create-directory-error') })
		}
		try {
			// Create license api key
			const apiKey = await createLicenseApiKeyJWT(project, mainFolderName)
			if (!apiKey) {
				return res.status(404).send({ status: licenseKey.createApiKeyTokenError, message: t('create-api-key-token-error') })
			}
			const newLicense = new LicenseModel({
				user: req.user._id,
				project,
				apiKey,
			})
			// Save license
			const licenseSaved: ILicense = await newLicense.save()
			if (!licenseSaved) {
				return res.status(404).send({ status: licenseKey.createLicenseError, message: t('licenses_create-license-error') })
			}
			// Update user licenses
			const findUser: IUser = await UserModel.findOneAndUpdate({ auth0Id: req.user.auth0Id }, { $push: { licenses: licenseSaved._id } }, { new: true }).lean().exec()
			if (!findUser) {
				return res.status(404).send({ status: licenseKey.userLicenseError, message: t('user-not-found') })
			}
			// Create subscription
			try {
				const newSubscription = new SubscriptionModel({
					user: req.user._id,
					license: licenseSaved._id,
					currency: '€',
				})
				const subscriptionSaved: ISubscription = await newSubscription.save()
				if (!subscriptionSaved) {
					return res.status(404).send({ status: subscriptionKey.createSubscriptionError, message: t('licenses_create-subscription-error') })
				}
				// Update license subscription
				const updateLicense: ILicense = await LicenseModel.findOneAndUpdate(
					{ _id: licenseSaved._id },
					{ subscription: subscriptionSaved._id },
					{ new: true }).populate(SUBSCRIPTION_POPULATE).lean().exec()
				const licenseFiltered = await cleanLicenseResponse(updateLicense)
				// Return license
				return res.status(200).send({ status: licenseKey.createdSuccess, message: t('licenses_created-success'), license: licenseFiltered })
			} catch (error) {
				if (error) {
					return res.status(404).send({ status: subscriptionKey.createSubscriptionError, message: t('licenses_create-subscription-error'), error: error })
				}
			}
			// Return license
		} catch (err: any) {
			if (err.code === 11000) {
				return res.status(500).send({ status: licenseKey.repeatedProject, message: t('project-repeated'), error: err })
			}
			return res.status(500).send({ status: responseKey.serverError, message: t('server-error'), error: err })
		}
	})
}

export async function getLicenseById(req: IRequestUser, res: Response) {
	const { licenseId } = req.params
	try {
		// Find license
		const findLicense: ILicense = await LicenseModel.findOne({ _id: licenseId }).populate(SUBSCRIPTION_POPULATE).lean().exec()
		if (!findLicense || !findLicense?.apiKey) {
			return res.status(404).send({ status: licenseKey.licenseNotFound, message: t('licenses_not-found') })
		}
		// Decrypt license api key
		const decryptedApiKeyToken: IApiKeyToken = jwt.verify(findLicense.apiKey, config.app.SECRET_KEY as string) as unknown as IApiKeyToken
		if (!decryptedApiKeyToken) {
			return res.status(404).send({ status: licenseKey.getLicenseError, message: t('licenses_get-license_error') })
		}
		const licenseFiltered = await cleanLicenseResponse(findLicense)
		// Return license
		return res.status(200).send({
			status: licenseKey.getLicenseSuccess,
			message: t('licenses_get-license_success'),
			license: { ...licenseFiltered, project: decryptedApiKeyToken.project }
		})
	} catch (err) {
		return res.status(500).send({ status: responseKey.serverError, message: t('server-error'), error: err })
	}
}

export async function getLicenseToken(req: IRequestUser, res: Response) {
	const { licenseId } = req.params
	try {
		const findLicense: ILicense | undefined = req.user.licenses.find((license: ILicense) => license._id == licenseId)
		if (!findLicense?.apiKey || findLicense.user?.toString() !== req.user._id.toString()) {
			return res.status(404).send({ status: licenseKey.mediaTokenNotFound, message: t('media-token-not-found') })
		}
		return res.status(200).send({
			status: licenseKey.getMediaTokenSuccess,
			message: t('licenses_get-media-token_success'),
			mediaToken: findLicense.apiKey,
		})
	} catch (err) {
		return res.status(500).send({ status: responseKey.serverError, message: t('server-error'), error: err })
	}
}

export async function getLicenseTokenDecrypted(req: IRequestUser, res: Response) {
	const { licenseId } = req.params
	try {
		const findLicense: ILicense | undefined = req.user.licenses.find((license: ILicense) => license._id == licenseId)
		if (!findLicense?.apiKey || findLicense.user?.toString() !== req.user._id.toString()) {
			return res.status(404).send({ status: licenseKey.mediaTokenNotFound, message: t('media-token-not-found') })
		}
		const decryptedApiKeyToken: IApiKeyToken = jwt.verify(findLicense.apiKey, config.app.SECRET_KEY as string) as unknown as IApiKeyToken
		return res.status(200).send({
			status: licenseKey.getMediaTokenSuccess,
			message: t('licenses_get-media-token_success'),
			mediaTokenDecrypted: decryptedApiKeyToken,
		})
	} catch (err) {
		return res.status(500).send({ status: responseKey.serverError, message: t('server-error'), error: err })
	}
}

export async function refreshLicenseToken(req: IRequestUser, res: Response) {
	const { licenseId } = req.params
	try {
		const findLicense: ILicense | undefined = req.user.licenses.find((license: ILicense) => license._id == licenseId)
		if (!findLicense?.apiKey || findLicense.user?.toString() !== req.user._id.toString()) {
			return res.status(404).send({ status: licenseKey.licenseNotFound, message: t('license-not-found') })
		}
		const decryptedApiKeyToken: IApiKeyToken = jwt.verify(findLicense.apiKey, config.app.SECRET_KEY as string) as unknown as IApiKeyToken
		if (!decryptedApiKeyToken) {
			return res.status(404).send({ status: licenseKey.getLicenseError, message: t('licenses_get-license_error') })
		}
		const refreshToken = await refreshLicenseApiKeyJWT(decryptedApiKeyToken)
		if (!refreshToken) {
			return res.status(400).send({ status: licenseKey.createApiKeyTokenError, message: t('create-api-key-token-error') })
		}
		const updateLicense: ILicense = await LicenseModel.findOneAndUpdate({ _id: licenseId }, { apiKey: refreshToken }, { new: true }).lean().exec()
		if (!updateLicense) {
			return res.status(404).send({ status: licenseKey.getLicenseError, message: t('licenses_get-license_error') })
		}
		return res.status(200).send({
			status: licenseKey.getMediaTokenSuccess,
			message: t('licenses_get-media-token_success'),
			mediaToken: refreshToken,
		})
	} catch (err) {
		return res.status(500).send({ status: responseKey.serverError, message: t('server-error'), error: err })
	}
}

export async function getMyLicenses(req: IRequestUser, res: Response) {
	try {
		const findLicenses: ILicense[] = await LicenseModel.find({ user: req.user._id.toString() }).populate(SUBSCRIPTION_POPULATE).lean().exec()
		findLicenses.forEach(async (license: ILicense) => {
			await cleanLicenseResponse(license)
		})
		return res.status(200).send({ status: licenseKey.getLicenseSuccess, message: t('licenses_get-my-licenses_success'), licenses: findLicenses })
	} catch (err) {
		return res.status(500).send({ status: responseKey.serverError, message: t('server-error'), error: err })
	}
}

export async function enableLicense(req: IRequestUser, res: Response) {
	const { licenseId, enabled } = req.body
	if (!licenseId) {
		return res.status(404).send({ status: licenseKey.licenseIdRequired, message: t('licenses_license-id-required') })
	}
	if (enabled === undefined) {
		return res.status(404).send({ status: licenseKey.enabledRequired, message: t('licenses_enabled-required') })
	}
	try {
		const findLicense: ILicense = await LicenseModel.findOneAndUpdate({ _id: licenseId }, { enabled: enabled }, { new: true }).lean().exec()
		if (!findLicense) {
			return res.status(404).send({ status: licenseKey.licenseNotFound, message: t('licenses_not-found') })
		}
		return res.status(200).send({
			status: enabled ? licenseKey.enableLicenseSuccess : licenseKey.disableLicenseSuccess,
			message: enabled ? t('licenses_enable-license_success') : t('licenses_disable-license_success'),
			license: findLicense
		})
	} catch (err) {
		return res.status(500).send({ status: responseKey.serverError, message: t('server-error'), error: err })
	}
}

export async function updateLicenseProject(req: IRequestUser, res: Response) {
	const { licenseId, project } = req.body
	if (!licenseId) {
		return res.status(404).send({ status: licenseKey.licenseIdRequired, message: t('licenses_license-id-required') })
	}
	if (!project) {
		return res.status(404).send({ status: licenseKey.projectRequired, message: t('data-required') })
	}
	const findUserLicenses: ILicense[] = await LicenseModel.find({ user: req.user._id }).lean().exec()
	if (findUserLicenses.length === 0) {
		return res.status(404).send({ status: licenseKey.licenseNotFound, message: t('licenses_not-found') })
	}
	// Check if exists a license with the same project name
	const licenseProjectExists = findUserLicenses.find((license: ILicense) => license.project === project)
	if (licenseProjectExists) {
		return res.status(404).send({ status: licenseKey.repeatedProject, message: t('project-repeated') })
	}
	try {
		const findLicense: ILicense = await LicenseModel.findOneAndUpdate({ _id: licenseId }, { project: project }, { new: true }).lean().exec()
		if (!findLicense) {
			return res.status(404).send({ status: licenseKey.licenseNotFound, message: t('licenses_not-found') })
		}
		return res.status(200).send({ status: licenseKey.updateLicenseSuccess, message: t('licenses_update-license_success'), license: findLicense })
	} catch (err) {
		return res.status(500).send({ status: responseKey.serverError, message: t('server-error'), error: err })
	}
}

export async function setOnlineLicense(req: IRequestUser, res: Response) {
	const { licenseId, online } = req.body
	if (!licenseId) {
		return res.status(404).send({ status: licenseKey.licenseIdRequired, message: t('licenses_license-id-required') })
	}
	if (online === undefined) {
		return res.status(404).send({ status: licenseKey.onlineRequired, message: t('licenses_enabled-required') })
	}
	try {
		const findLicense: ILicense = await LicenseModel.findOneAndUpdate({ _id: licenseId }, { online: online }, { new: true }).lean().exec()
		if (!findLicense) {
			return res.status(404).send({ status: licenseKey.licenseNotFound, message: t('licenses_not-found') })
		}
		return res.status(200).send({
			status: online ? licenseKey.enableOnlineSuccess : licenseKey.disableOnlineSuccess,
			message: online ? t('licenses_enable-license_success') : t('licenses_disable-license_success'),
			license: findLicense
		})
	} catch (err) {
		return res.status(500).send({ status: responseKey.serverError, message: t('server-error'), error: err })
	}
}

export async function deleteLicense(req: IRequestUser, res: Response) {
	const { licenseId } = req.body
	if (!licenseId) {
		return res.status(404).send({ status: licenseKey.licenseIdRequired, message: t('licenses_license-id-required') })
	}
	try {
		// Find user license
		const findLicense: ILicense | undefined = req.user.licenses.find((license: ILicense) => license._id == licenseId)
		if (!findLicense) {
			return res.status(404).send({ status: licenseKey.licenseNotFound, message: t('licenses_not-found') })
		}
		// Update user licenses
		const findUser: IUser = await UserModel.findOneAndUpdate({ auth0Id: req.user.auth0Id }, { $pull: { licenses: licenseId } }, { new: true }).lean().exec()
		if (!findUser) {
			return res.status(404).send({ status: licenseKey.userLicenseError, message: t('user-not-found') })
		}
		// Find subscription
		const findSubscription: ISubscription = await SubscriptionModel.findOne({ license: licenseId }).lean().exec()
		if (!findSubscription) {
			return res.status(404).send({ status: subscriptionKey.subscriptionNotFound, message: t('subscription-not-found') })
		}
		// Delete subscription if type is FREE
		if (findSubscription.type === FREE) {
			const deleteSubscription = await SubscriptionModel.findOneAndDelete({ license: licenseId }).lean().exec()
			if (!deleteSubscription) {
				return res.status(404).send({ status: subscriptionKey.subscriptionNotFound, message: t('subscription-not-found') })
			}
		}
		// Delete license
		const deleteLicense: ILicense & { filesDeleted?: number } = await LicenseModel.findOneAndDelete({ _id: licenseId }).lean().exec()
		if (!deleteLicense) {
			return res.status(404).send({ status: licenseKey.licenseNotFound, message: t('licenses_not-found') })
		}
		// Delete media
		const deleteManyMedia: IMedia & { deletedCount?: number } = await MediaModel.deleteMany({ license: licenseId }).lean().exec()
		if (!deleteManyMedia) {
			return res.status(404).send({ status: 'mediaKey.mediaNotFound', message: t('media-not-found') })
		}
		// Delete files
		await fs.remove(`./${mediaFolderPath}/${req.user._id}/${findLicense.project}`)
		deleteLicense.__v = undefined
		deleteLicense.filesDeleted = deleteManyMedia.deletedCount
		return res.status(200).send({
			status: licenseKey.deleteLicenseSuccess,
			message: t('licenses_delete-license_success'),
			license: deleteLicense
		})
	} catch (err) {
		return res.status(500).send({ status: responseKey.serverError, message: t('server-error'), error: err })
	}
}

async function cleanLicenseResponse(license: ILicenseResponse) {
	delete license.user
	delete license.apiKey
	delete license.requests
	delete license.subscription._id
	delete license.subscription.user
	delete license.subscription.license
	delete license.subscription.__v
	delete license.__v
	return license as ILicense
}