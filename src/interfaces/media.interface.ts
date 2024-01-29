import { ILicense } from "./license.interface"

//////////////////////////////////////
export interface IMedia {
  _id: string
  license: ILicense
  directory: string
  url: string
  fileName: string
  size: number
  sizeT?: string
  enabled: boolean
  createdAt: Date
  updatedAt: Date
  totalRequests: number
  __v: any
}
export const iMediaKey = {
  _id: '_id' as keyof typeof Object.keys,
  license: 'license' as keyof typeof Object.keys,
  directory: 'directory' as keyof typeof Object.keys,
  url: 'url' as keyof typeof Object.keys,
  fileName: 'fileName' as keyof typeof Object.keys,
  online: 'online' as keyof typeof Object.keys,
  size: 'size' as keyof typeof Object.keys,
  sizeT: 'sizeT' as keyof typeof Object.keys,
  enabled: 'enabled' as keyof typeof Object.keys,
  createdAt: 'createdAt' as keyof typeof Object.keys,
  updatedAt: 'updatedAt' as keyof typeof Object.keys,
  totalRequests: 'totalRequests' as keyof typeof Object.keys,
}
//////////////////////////////////////