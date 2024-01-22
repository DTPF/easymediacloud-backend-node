import { Response } from "express";
import LicenseModel from "../models/license.model";
import UserModel from "../../user/models/user.model";
import { mediaFolderPath } from "../../../utils/constants";
import { responseKey, licenseKey, userKey } from "../../responseKey";
import { IRequestUser } from "../../../interfaces/user.interface";
import { createLicenseApiKeyJWT } from "../../../services/jwt";
import jwt from "jsonwebtoken";
import i18next from "i18next";
import { ServerConfig } from "../../../config/config";
import { IApiKey, ILicense } from "../../../interfaces/license.interface";
import { convertBytes } from "../../../utils/getFolderSize";
import SubscriptionModel from "../../subscriptions/models/subscription.model";
import { B500MB, FREE } from "../../subscriptions/subscriptionsConstants";
import moment from "moment";
import { ISubscription } from "../../../interfaces/subscription.interface";
import { SUBSCRIPTION_POPULATE } from "../../modelsConstants";
const config: ServerConfig = require('../../../config/config')
const t = i18next.t
const fs = require("fs-extra")

export async function createLicense(req: IRequestUser, res: Response) {
	const { project }: { project: string } = req.body
	if (!project) {
		return res.status(404).send({ status: licenseKey.projectRequired, message: t('data-required') })
	}
	// Find user licenses
	const findUserLicenses: ILicense[] = await LicenseModel.find({ user: req.user._id }).lean().exec()
	// Check if exists a license with the same project name
	const licenseProjectExists = await findUserLicenses.find((license: ILicense) => license.project === project)
	if (licenseProjectExists) {
		return res.status(404).send({ status: licenseKey.repeatedProject, message: t('project-repeated') })
	}
	// Check if user has a nickname
	if(!req.user.nickname) {
		return res.status(404).send({ status: userKey.nicknameRequired, message: t('nickname-required') })
	}
	// Create main folder if not exists
	const mainFolderName = req.user.nickname
	if (findUserLicenses.length === 0) {
		fs.mkdir(`${mediaFolderPath}/${mainFolderName}`, async function (err: any) {
			if (err) {
				console.log('Main directory error');
			}
			console.log('Main directory created');
		})
	}
	// Create project folder
	fs.mkdir(`${mediaFolderPath}/${mainFolderName}/${project}`, async function (err: any) {
		if (err) {
			return res.status(404).send({ status: licenseKey.createDirectoryError, message: t('licenses_create-directory-error') })
		}
		try {
			// Create license api key
			const apiKey = await createLicenseApiKeyJWT(project, req.user.nickname)
			if (!apiKey) {
				return res.status(404).send({ status: licenseKey.createApiKeyTokenError, message: t('create-api-key-token-error') })
			}
			const newLicense = new LicenseModel({
				user: req.user._id,
				project,
				apiKey,
				enabled: true,
				online: true
			})
			// Save license
			const licenseSaved: ILicense = await newLicense.save()
			if (!licenseSaved) {
				return res.status(404).send({ status: licenseKey.createLicenseError, message: t('licenses_create-license-error') })
			}
			// Update user licenses
			const findUser = await UserModel.findOneAndUpdate({ auth0Id: req.user.auth0Id }, { $push: { licenses: licenseSaved._id } }, { new: true }).lean().exec()
			if (!findUser) {
				return res.status(404).send({ status: licenseKey.userLicenseError, message: t('user-not-found') })
			}
			licenseSaved.__v = undefined
			licenseSaved.enabled = undefined
			licenseSaved.user = undefined
			licenseSaved.apiKey = undefined
			// Create subscription
			try {
				const newSubscription = new SubscriptionModel({
					user: req.user._id,
					license: licenseSaved._id,
					type: FREE,
					price: 0,
					currency: '€',
					maxSize: B500MB,
					maxSizeT: convertBytes(B500MB),
					expire: moment().add(1, 'year'),
					enabled: true
				})
				const subscriptionSaved: ISubscription = await newSubscription.save()
				if (!subscriptionSaved) {
					return res.status(404).send({ status: licenseKey.createSubscriptionError, message: t('licenses_create-subscription-error') })
				}
				// Update license subscription
				const updateLicense: ILicense = await LicenseModel.findOneAndUpdate({ _id: licenseSaved._id }, { subscription: subscriptionSaved._id }, { new: true }).populate(SUBSCRIPTION_POPULATE).lean().exec()
				delete updateLicense.__v
				delete updateLicense.apiKey
				delete updateLicense.user
				delete updateLicense.subscription._id
				delete updateLicense.subscription.__v
				delete updateLicense.subscription.user
				delete updateLicense.subscription.license
				delete updateLicense.subscription.expire
				// Return license
				return res.status(200).send({ status: licenseKey.createdSuccess, message: t('licenses_created-success'), license: updateLicense })
			} catch (error) {
				if (error) {
					return res.status(404).send({ status: licenseKey.createSubscriptionError, message: t('licenses_create-subscription-error'), error: error })
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
		const decryptedApiKey: IApiKey = jwt.verify(findLicense.apiKey, config.app.SECRET_KEY as string) as IApiKey
		if (!decryptedApiKey) {
			return res.status(404).send({ status: licenseKey.getLicenseError, message: t('licenses_get-license_error') })
		}
		delete findLicense.apiKey
		delete findLicense.__v
		delete findLicense.subscription._id
		delete findLicense.subscription.__v
		delete findLicense.subscription.user
		delete findLicense.subscription.license
		delete findLicense.subscription.expire
		// Return license
		return res.status(200).send({
			status: licenseKey.getLicenseSuccess,
			message: t('licenses_get-license_success'),
			license: { ...findLicense, project: decryptedApiKey.project }
		})
	} catch (err) {
		return res.status(500).send({ status: responseKey.serverError, message: t('server-error'), error: err })
	}
}

export async function getApiKey(req: IRequestUser, res: Response) {
	const { licenseId } = req.params
	try {
		const findLicense: ILicense | undefined = req.user.licenses.find((license: ILicense) => license._id == licenseId)
		if (!findLicense?.apiKey || findLicense.user?.toString() !== req.user._id.toString()) {
			return res.status(404).send({ status: licenseKey.apiKeyNotFound, message: t('api-key-not-found') })
		}
		return res.status(200).send({
			status: licenseKey.getApiKeySuccess,
			message: t('licenses_get-api-key_success'),
			apiKey: findLicense.apiKey,
		})
	} catch (err) {
		return res.status(500).send({ status: responseKey.serverError, message: t('server-error'), error: err })
	}
}

export async function getMyLicenses(req: IRequestUser, res: Response) {
	try {
		const findLicenses: ILicense[] = await LicenseModel.find({ user: req.user._id.toString() }).populate(SUBSCRIPTION_POPULATE).lean().exec()
		findLicenses.forEach((license: ILicense) => {
			delete license.__v
			delete license.user
			delete license.apiKey
			delete license.subscription.__v
			delete license.subscription.user
			delete license.subscription.license
			delete license.subscription.expire
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
		return res.status(200).send({ status: licenseKey.enableLicenseSuccess, message: t('licenses_enable-license_success'), license: findLicense })
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

	const licenseProjectExists = await findUserLicenses.find((license: any) => license.project === project)
	if (licenseProjectExists) {
		return res.status(404).send({ status: licenseKey.repeatedProject, message: t('project-repeated') })
	}
	try {
		const findLicense = await LicenseModel.findOneAndUpdate({ _id: licenseId }, { project: project }, { new: true }).lean().exec()
		if (!findLicense) {
			return res.status(404).send({ status: licenseKey.licenseNotFound, message: t('licenses_not-found') })
		}
		return res.status(200).send({ status: licenseKey.updateLicenseSuccess, message: t('licenses_update-license_success'), license: findLicense })
	} catch (err) {
		return res.status(500).send({ status: responseKey.serverError, message: t('server-error'), error: err })
	}
}

export async function deleteLicense(req: IRequestUser, res: Response) { }