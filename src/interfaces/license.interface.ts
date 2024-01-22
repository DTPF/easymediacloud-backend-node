import { IUser } from "./user.interface"

export interface ILicense {
  _id: string
  userId?: IUser
  project: string
  apiKey?: string
  enabled?: boolean
  online?: boolean
  size: string
  totalFiles?: number
  __v: any
}

export interface IApiKey {
  project: string
  email: string
  apiKey: string
}

interface ISuscription {
  id: string
  name: string
  price: number
  currency: string
  maxSize: number
}