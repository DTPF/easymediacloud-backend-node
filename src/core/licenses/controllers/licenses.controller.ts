import { Response } from "express";
import LicenseModel from "../models/license.model";
import UserModel from "../../user/models/user.model";
import { mediaFolderPath } from "../../../utils/constants";
import { responseKey, licenseKey } from "../../responseKey";
import { IRequestUser } from "../../../interfaces/user.interface";
import { createLicenseApiKeyJWT } from "../../../services/jwt";
import jwt from "jsonwebtoken";
import i18next from "i18next";
import { ServerConfig } from "../../../config/config";
import { ILicense } from "../../../interfaces/license.interface";
import { convertBytes } from "../../../utils/getFolderSize";
const config: ServerConfig = require('../../../config/config')
const t = i18next.t
const fs = require("fs-extra")

export async function createLicense(req: IRequestUser, res: Response) {
	const { project }: { project: string } = req.body
	if (!project) {
		return res.status(404).send({ status: licenseKey.projectRequired, message: t('data-required') })
	}
	// Find user licenses
	const findUserLicenses = await LicenseModel.find({ userId: req.user._id }).lean().exec()
	// Check if exists a license with the same project name
	const licenseProjectExists = await findUserLicenses.find((license: ILicense) => license.project === project)
	if (licenseProjectExists) {
		return res.status(404).send({ status: licenseKey.repeatedProject, message: t('project-repeated') })
	}
	// Create main folder if not exists
	const mainFolderName = req.user.email.split('@')[0]
	if (findUserLicenses.length === 0) {
		fs.mkdir(`${mediaFolderPath}/${mainFolderName}`, async function (err: any) {
			if (err) {
				return res.status(404).send({ status: licenseKey.createDirectoryError, message: t('licenses_create-directory-error') })
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
			const apiKey = await createLicenseApiKeyJWT(project, mainFolderName)
			if (!apiKey) {
				return res.status(404).send({ status: licenseKey.createApiKeyTokenError, message: t('create-api-key-token-error') })
			}
			const newLicense = new LicenseModel({
				userId: req.user._id,
				project,
				apiKey,
				enabled: false,
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
			licenseSaved.userId = undefined
			licenseSaved.apiKey = undefined
			// Return license
			return res.status(200).send({ status: licenseKey.createdSuccess, license: licenseSaved, message: t('licenses_created-success') })
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
		const findLicense = req.user.licenses.find((license: ILicense) => license._id == licenseId)
		if (!findLicense?.apiKey) {
			return res.status(404).send({ status: licenseKey.licenseNotFound, message: t('licenses_not-found') })
		}
		// Decrypt license api key
		const decryptedLicense = jwt.verify(findLicense.apiKey, config.app.SECRET_KEY as string) as { project: string, apiKey: string, email: string };
		if (!decryptedLicense) {
			return res.status(404).send({ status: licenseKey.getLicenseError, message: t('licenses_get-license_error') })
		}
		return res.status(200).send({
			status: licenseKey.getLicenseSuccess,
			message: t('licenses_get-license_success'),
			license: {
				project: decryptedLicense.project,
				enabled: findLicense.enabled,
				size: findLicense.size,
			}
		})
	} catch (err) {
		return res.status(500).send({ status: responseKey.serverError, message: t('server-error'), error: err })
	}
}

export async function getApiKey(req: IRequestUser, res: Response) {
	const { licenseId } = req.params
	try {
		const findLicense = req.user.licenses.find((license: ILicense) => license._id == licenseId)
		// Return license api key if it belongs to the user
		if (!findLicense?.apiKey || findLicense.userId?.toString() !== req.user._id.toString()) {
			return res.status(404).send({ status: licenseKey.licenseNotFound, message: t('licenses_not-found') })
		}
		return res.status(200).send({
			status: licenseKey.getLicenseSuccess,
			message: t('licenses_get-license_success'),
			apiKey: findLicense.apiKey,
		})
	} catch (err) {
		return res.status(500).send({ status: responseKey.serverError, message: t('server-error'), error: err })
	}
}

export async function getMyLicenses(req: IRequestUser, res: Response) {
	try {
		const findUser = await UserModel.findOne({ auth0Id: req.user.auth0Id }).populate('licenses').lean().exec()
		if (!findUser) {
			return res.status(404).send({ status: licenseKey.userLicenseError, message: t('user-not-found') })
		}
		findUser.licenses.forEach((license: any) => {
			delete license.__v
			delete license.userId
			delete license.apiKey
			license.size = convertBytes(license.size)
		})
		return res.status(200).send({ status: licenseKey.getLicenseSuccess, message: t('licenses_get-my-licenses_success'), licenses: findUser.licenses })
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
		const findLicense = await LicenseModel.findOneAndUpdate({ _id: licenseId }, { enabled: enabled }, { new: true }).lean().exec()
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

	const findUserLicenses = await LicenseModel.find({ userId: req.user._id }).lean().exec()
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