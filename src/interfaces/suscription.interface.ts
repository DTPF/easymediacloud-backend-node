export interface ISuscription {
  _id?: string
  user?: string
  license?: string
  type: string
  price: number
  currency: string
  maxSize?: number
  maxSizeT?: string
  expire?: Date
  enabled: boolean
  __v?: number | string | undefined
}

export type SuscriptionType = 'free' | 'basic' | 'premium'