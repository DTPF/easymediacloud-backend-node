import { ISuscription } from "./suscription.interface"
import { IUser } from "./user.interface"

export interface ILicense {
  _id?: string
  userId?: IUser
  project: string
  apiKey?: string
  enabled?: boolean
  online?: boolean
  size: number
  sizeT: string
  totalFiles?: number
  suscription: ISuscription
  __v: any
}

export interface IApiKey {
  project: string
  nickname: string
  apiKey: string
}