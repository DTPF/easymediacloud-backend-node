export interface ISubscription {
  _id?: string
  user?: string
  license?: string
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

export type SubscriptionType = 'free' | 'basic' | 'premium'