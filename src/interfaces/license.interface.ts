import { ObjectId } from "mongoose"
import { ISubscription } from "./subscription.interface"
import { IUser } from "./user.interface"

export interface ILicense {
  _id: string
  user: IUser
  project: string
  apiKey: string
  enabled: boolean
  online: boolean
  size: number
  sizeT: string
  totalFiles: number
  subscription: ISubscription
  requests: number
  createdAt: Date
  updatedAt: Date
  __v: any
}

export interface IApiKeyToken {
  id: string
  project: string
  apiKey: string | ObjectId
  createdAt: Date
  updatedAt: Date
}

export interface ILicenseResponse {
  _id: string
  user?: IUser
  project: string
  apiKey?: string
  enabled: boolean
  online: boolean
  size: number
  sizeT: string
  totalFiles: number
  subscription: ISubscription
  createdAt: Date
  updatedAt: Date
  __v: any
}