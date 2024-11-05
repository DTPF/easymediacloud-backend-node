import { ILicense } from "./license.interface"

//////////////////////////////////////
export interface IMedia {
  _id: string
  license: ILicense
  user: string
  directory: string
  url: string
  fileName: string
  size: number
  sizeT?: string
  type: string
  enabled: boolean
  createdAt: Date
  updatedAt: Date
  totalRequests: number
  __v: any
}
export const iMediaKey = {
  _id: '_id' as keyof typeof Object.keys,
  license: 'license' as keyof typeof Object.keys,
  user: 'user' as keyof typeof Object.keys,
  directory: 'directory' as keyof typeof Object.keys,
  url: 'url' as keyof typeof Object.keys,
  fileName: 'fileName' as keyof typeof Object.keys,
  online: 'online' as keyof typeof Object.keys,
  size: 'size' as keyof typeof Object.keys,
  sizeT: 'sizeT' as keyof typeof Object.keys,
  type: 'type' as keyof typeof Object.keys,
  enabled: 'enabled' as keyof typeof Object.keys,
  createdAt: 'createdAt' as keyof typeof Object.keys,
  updatedAt: 'updatedAt' as keyof typeof Object.keys,
  totalRequests: 'totalRequests' as keyof typeof Object.keys,
}
//////////////////////////////////////

export interface IMediaResponse {
  _id: string
  url: string
  size?: string
  type: string
  enabled: boolean
  totalRequests: number
  createdAt: Date
}