import { convertBytes } from '../../utils/getFolderSize';

export const REQUESTS_DATA_RANGE = {
  quantity: 1,
  cicle: 'months',
  maxRequests: 20000,
};
export const SUBSCRIPTION_EXPIRE_DATE = {
  quantity: 1,
  cicle: 'year',
};
export const FREE_LICENSES_LIMIT = 5;
// Bytes
export const B10MB = 10485760;
export const B500MB = 524288000;
export const B5GB = 5368709120;
export const B20GB = 21474836480;
export const B100GB = 107374182400;
// Converted
export const C500MB = convertBytes(B500MB);
export const C5GB = convertBytes(B5GB);
export const C20GB = convertBytes(B20GB);
// Subscriptions types
export const FREE = 'free';
export const BASIC = 'basic';
export const PREMIUM = 'premium';
export const CUSTOM = 'custom';
