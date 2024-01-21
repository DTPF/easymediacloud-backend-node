import { Request } from "express"
import { LicenseInterface } from "./license.interface"

export interface MediaInterface {
  _id: string
  license: LicenseInterface
  directory: string
  url: string
  fileName: string
  enabled: boolean
  createdAt: Date
  updatedAt: Date
  __v: any
}