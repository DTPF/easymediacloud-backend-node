import { User } from "./user.interface"

export interface LicenseInterface {
  _id: string
  userId?: User
  project: string
  apiKey?: string
  enabled?: boolean
  size: string
  __v: any
}

export interface ApiKeyInterface {
  project: string
  email: string
  apiKey: string
}