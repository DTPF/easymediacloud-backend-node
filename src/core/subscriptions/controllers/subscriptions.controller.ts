import { Response } from "express";
import { IRequestUser } from "../../../interfaces/user.interface";
import i18next from "i18next";
import { ServerConfig } from "../../../config/config";
const config: ServerConfig = require('../../../config/config')
const t = i18next.t

export async function createSubscription(req: IRequestUser, res: Response) { }