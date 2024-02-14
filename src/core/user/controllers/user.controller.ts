import { Request, Response } from "express";
import UserModel from "../models/user.model";
import { userRole, adminRole, creatorRole, uploadsAvatarPath } from "../../../utils/constants";
import { responseKey, userKey } from "../../responseKey";
import { IAuth0User, IUser, IRequestUser, iUserKey } from "../../../interfaces/user.interface";
import i18next from "i18next";
import { LICENSES_POPULATE } from "../../modelsConstants";
const fs = require("fs-extra")
const path = require("path")
const t = i18next.t

export async function registerLoginUser(req: IRequestUser, res: Response) {
	const { user }: { user: IAuth0User } = req.body
	if (!user) {
		return res.status(404).send({ status: userKey.required, message: t('login_user-not-found') })
	}
	let userStored;
	try {
		userStored = await UserModel.findOne({ [iUserKey.auth0Id]: user.sub.toString() }).populate(LICENSES_POPULATE).lean().exec()
		if (userStored) {
			delete userStored.__v
			delete userStored[iUserKey.licenses]
			if (userStored[iUserKey.isVerified] === false && user.email_verified === true) {
				try {
					const updateUser = await UserModel.findOneAndUpdate({ [iUserKey.auth0Id]: user.sub.toString() }, { [iUserKey.isVerified]: user.email_verified }, { new: true }).lean().exec()
					if (!updateUser) {
						return res.status(404).send({ status: userKey.notFound, message: t('user-not-found') })
					}
					delete updateUser.__v
					delete updateUser[iUserKey.licenses]
					return res.status(201).send({ user: updateUser })
				} catch (error) {
					return res.status(201).send({ user: userStored })
				}
			} else {
				return res.status(201).send({ user: userStored })
			}
		} else {
			const newUser = new UserModel({
				[iUserKey.auth0Id]: user.sub,
				[iUserKey.name]: '',
				[iUserKey.lastname]: '',
				[iUserKey.email]: user.email,
				[iUserKey.avatar]: user.picture ?? '',
				[iUserKey.language]: user.locale ?? '',
				[iUserKey.role]: userRole,
				[iUserKey.isVerified]: user.email_verified,
			})
			try {
				const userSaved = await newUser.save()
				userSaved.__v = undefined
				return res.status(200).send({ status: userKey.createdSuccess, user: userSaved })
			} catch (err: any) {
				if (err.code === 11000) {
					return res.status(500).send({ status: userKey.repeatedEmail, message: t('login_user-exists'), error: err })
				}
				return res.status(500).send({ status: responseKey.serverError, message: t('server-error'), error: err })
			}
		}
	} catch (err) {
		return res.status(500).send({ status: responseKey.serverError, message: t('server-error'), error: err })
	} finally {
		await UserModel.findOneAndUpdate({ [iUserKey.auth0Id]: user.sub },
			{ [iUserKey.lastLogin]: new Date() },
			{ new: true, timestamps: false }).lean().exec()
	}
}

export async function updateUser(req: IRequestUser, res: Response) {
	if (!req.body.name && !req.body.lastname && !req.body.nickname && !req.body.language) {
		return res.status(404).send({ status: userKey.required, message: t('update_user-data-required') })
	}
	try {
		const userUpdated = await UserModel.findOneAndUpdate({ [iUserKey.auth0Id]: req.user[iUserKey.auth0Id] }, req.body, { new: true }).lean().exec()
		if (!userUpdated) {
			return res.status(404).send({ status: userKey.notFound, message: t('user-not-found') })
		}
		delete userUpdated.__v
		return res.status(200).send({ user: userUpdated })
	} catch (err: any) {
		if (err.code === 11000) {
			if (err.keyValue.nickname) {
				return res.status(500).send({ status: userKey.repeatedNickname, message: t('update_user-nickname-exists') })
			}
		}
		return res.status(500).send({ status: responseKey.serverError, message: t('server-error'), error: err })
	}
}

export async function deleteUserSelf(req: IRequestUser, res: Response) {
	try {
		const userDeleted = await UserModel.findOneAndDelete({ [iUserKey.auth0Id]: req.auth.payload.sub }).lean().exec()
		if (!userDeleted) {
			return res.status(404).send({ status: userKey.notFound, message: t('user-not-found') })
		}
		delete userDeleted.__v
		return res.status(200).send({ status: userKey.deletedSuccess, user: userDeleted, message: t('delete-user_success') })
	} catch (err) {
		return res.status(500).send({ status: responseKey.serverError, message: t('server-error'), error: err })
	}
}

export async function deleteUserAdmin(req: IRequestUser, res: Response) {
	const { userId } = req.params
	// Only admin can delete user
	if (req.user[iUserKey.role] !== adminRole) {
		return res.status(403).send({ status: responseKey.unauthorized, message: t('delete-user-admin_unauthorized') })
	}
	const findUser = await UserModel.findOne({ [iUserKey.auth0Id]: userId })
	// Search user
	if (!findUser) {
		return res.status(404).send({ status: userKey.notFound, message: t('user-not-found') })
	}
	// Only can delete userRole or creatorRole
	if (findUser?.role === adminRole) {
		return res.status(403).send({ status: responseKey.notAllowed, message: t('delete-user-admin_unauthorized') })
	}
	try {
		const userDeleted = await UserModel.findOneAndDelete({ [iUserKey.auth0Id]: userId }).lean().exec()
		if (!userDeleted) {
			return res.status(404).send({ status: userKey.notFound, message: t('user-not-found') })
		}
		delete userDeleted.__v
		return res.status(200).send({ status: userKey.deletedSuccess, message: t('delete-user_success') })
	} catch (err) {
		return res.status(500).send({ status: responseKey.serverError, message: t('server-error'), error: err })
	}
}

export async function updateRole(req: IRequestUser, res: Response) {
	const { user }: { user: any } = req.body
	if (!user) {
		return res.status(404).send({ status: userKey.required, message: t('data-required') })
	}
	// Only userRole and creatorRole can be updated
	if (user[iUserKey.role] !== userRole) {
		if (user[iUserKey.role] !== creatorRole) {
			return res.status(404).send({ status: responseKey.roleNotAllowed, message: t('update-user-role_unauthorized') })
		}
	}
	// Only admin can update role
	if (req.user[iUserKey.role] !== adminRole) {
		return res.status(403).send({ status: responseKey.unauthorized, message: t('update-user-role_unauthorized') })
	}
	const findUser = await UserModel.findOne({ [iUserKey.auth0Id]: user.sub })
	// Search user
	if (!findUser) {
		return res.status(404).send({ status: userKey.notFound, message: t('user-not-found') })
	}
	// Only can update role to userRole or creatorRole
	if (findUser.role === adminRole) {
		return res.status(403).send({ status: responseKey.notAllowed, message: t('update-user-role_unauthorized') })
	}
	try {
		const userUpdated = await UserModel.findOneAndUpdate({ [iUserKey.auth0Id]: user.sub }, { [iUserKey.role]: user[iUserKey.role] }, { new: true }).lean().exec()
		if (!userUpdated) {
			return res.status(404).send({ status: userKey.notFound, message: t('user-not-found') })
		}
		delete userUpdated.__v
		return res.status(200).send({ user: userUpdated, message: t('update_user_success') })
	} catch (err) {
		return res.status(500).send({ status: responseKey.serverError, message: t('server-error'), error: err })
	}
}

export async function getUsers(req: IRequestUser, res: Response) {
	try {
		const users = await UserModel.find().lean().exec()
		users.forEach((user: IUser) => {
			delete user.__v
		})
		return res.status(200).send({ users })
	} catch (err) {
		return res.status(500).send({ status: responseKey.serverError, message: t('server-error'), error: err })
	}
}

export async function updateUserAvatar(req: IRequestUser, res: Response) {
	const path = req.files.avatar && req.files.avatar.path
	if (!path) {
		return res.status(404).send({ status: 'file-required', message: t('data-required') })
	}
	try {
		const findUser = await UserModel.findOne({ [iUserKey.auth0Id]: req.user[iUserKey.auth0Id] })
		if (!findUser) {
			path && fs.unlinkSync(path)
			return res.status(404).send({ status: 'user-required', message: t('user-not-found') })
		}
		const filePathOld = uploadsAvatarPath + findUser[iUserKey.avatar]
		const fileName = path.split("/")[2]
		let fileExt = fileName.split(".")[1] && fileName.split(".")[1].toLowerCase()
		if (fileExt !== "png" && fileExt !== "jpg" && fileExt !== "jpeg") {
			res.status(400).send({ status: "extension-not-valid", message: t('avatar-extension-not-allowed') })
			path && fs.unlinkSync(path)
			return
		}
		findUser[iUserKey.avatar] = fileName
		try {
			const userSaved = await findUser.save()
			userSaved.__v = undefined
			try {
				fs.unlinkSync(filePathOld)
			} catch (error) {
				console.log(error);
			} finally {
				return res.status(200).send({ status: userKey.updatedSuccess, user: userSaved, message: t('update_user_success') })
			}
		} catch (err: any) {
			path && fs.unlinkSync(path)
			return res.status(500).send({ status: responseKey.serverError, message: t('server-error'), error: err })
		}
	} catch (err) {
		return res.status(500).send({ status: responseKey.serverError, message: t('server-error'), error: err })
	}
}

export function getAvatarImage(req: Request, res: Response) {
	const imageName = req.params.imageName
	const filePath = uploadsAvatarPath + imageName
	fs.exists(filePath, (exists: boolean) => {
		if (!exists) {
			return res.status(404).send({ status: "media-not-exists", message: t('media-not-exists') })
		} else {
			return res.sendFile(path.resolve(filePath))
		}
	})
}