import { convertBytes } from "../../utils/getFolderSize";
// Bytes
export const B10MB = 10485760
export const B500MB = 524288000
export const B5GB = 5368709120
export const B20GB = 21474836480
// Converted
export const C500MB = convertBytes(B500MB)
export const C5GB = convertBytes(B5GB)
export const C20GB = convertBytes(B20GB)
// Suscriptions types
export const FREE = 'free'
export const BASIC = 'basic'
export const PREMIUM = 'premium'