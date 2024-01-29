import moment from "moment"
import { convertBytes } from "../../utils/getFolderSize"

export const REQUESTS_PER_MONTH = 20000
export const REQUESTS_DATA_RANGE = moment().subtract(1, 'day').toDate()
export const SUBSCRIPTION_EXPIRE_DATE = 1
export const SUBSCRIPTION_EXPIRE_DATE_CICLE = 'year'
// export const REQUESTS_DATA_RANGE = moment().subtract(1, 'months').toDate()
export const FREE_LICENSES_LIMIT = 5
// Bytes
export const B10MB = 10485760
export const B500MB = 524288000
export const B5GB = 5368709120
export const B20GB = 21474836480
export const B100GB = 107374182400
// Converted
export const C500MB = convertBytes(B500MB)
export const C5GB = convertBytes(B5GB)
export const C20GB = convertBytes(B20GB)
// Subscriptions types
export const FREE = 'free'
export const BASIC = 'basic'
export const PREMIUM = 'premium'
export const CUSTOM = 'custom'