import { ISubscription } from "./subscription.interface"
import { IUser } from "./user.interface"

export interface ILicense {
  _id?: string
  user?: IUser
  project: string
  apiKey?: string
  enabled?: boolean
  online?: boolean
  size: number
  sizeT: string
  totalFiles?: number
  subscription: ISubscription
  __v: any
}

export interface IApiKey {
  project: string
  nickname: string
  apiKey: string
}