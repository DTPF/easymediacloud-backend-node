import { ILicense } from "./license.interface"

//////////////////////////////////////
export interface ISubscription {
  _id?: string
  user?: string
  license?: string | ILicense
  type: SubscriptionType
  price: number
  currency: string
  maxSize: number
  maxSizeT: string
  expire: Date
  enabled: boolean
  requestsPerMonth: number
  createdAt: Date
  updatedAt: Date
  __v?: number | string | undefined
}
export const iSubscriptionKey = {
  _id: '_id' as keyof typeof Object.keys,
  user: 'user' as keyof typeof Object.keys,
  license: 'license' as keyof typeof Object.keys,
  type: 'type' as keyof typeof Object.keys,
  price: 'price' as keyof typeof Object.keys,
  currency: 'currency' as keyof typeof Object.keys,
  maxSize: 'maxSize' as keyof typeof Object.keys,
  maxSizeT: 'maxSizeT' as keyof typeof Object.keys,
  expire: 'expire' as keyof typeof Object.keys,
  enabled: 'enabled' as keyof typeof Object.keys,
  requestsPerMonth: 'requestsPerMonth' as keyof typeof Object.keys,
  createdAt: 'createdAt' as keyof typeof Object.keys,
  updatedAt: 'updatedAt' as keyof typeof Object.keys,
}
//////////////////////////////////////

export type SubscriptionType = 'free' | 'basic' | 'premium'