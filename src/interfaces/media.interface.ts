import { ILicense } from "./license.interface"

export interface IMedia {
  _id: string
  license: ILicense
  directory: string
  url: string
  fileName: string
  size?: number
  sizeT?: string
  enabled: boolean
  createdAt: Date
  updatedAt: Date
  __v: any
}