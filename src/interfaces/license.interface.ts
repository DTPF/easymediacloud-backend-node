import { ObjectId } from 'mongoose';
import { ISubscription } from './subscription.interface';
import { IUser } from './user.interface';

//////////////////////////////////////
export interface ILicense {
  _id: string;
  user: IUser;
  name: string;
  project: string;
  apiKey: string;
  enabled: boolean;
  online: boolean;
  size: number;
  sizeT: string;
  totalFiles: number;
  subscription: ISubscription;
  requests: TRequests[];
  totalRequests: number;
  requestsInDataRange: number;
  createdAt: Date;
  updatedAt: Date;
  __v: any;
}
export const iLicenseKey = {
  _id: '_id' as keyof typeof Object.keys,
  user: 'user' as keyof typeof Object.keys,
  name: 'name' as keyof typeof Object.keys,
  project: 'project' as keyof typeof Object.keys,
  apiKey: 'apiKey' as keyof typeof Object.keys,
  enabled: 'enabled' as keyof typeof Object.keys,
  online: 'online' as keyof typeof Object.keys,
  size: 'size' as keyof typeof Object.keys,
  sizeT: 'sizeT' as keyof typeof Object.keys,
  totalFiles: 'totalFiles' as keyof typeof Object.keys,
  subscription: 'subscription' as keyof typeof Object.keys,
  requests: 'requests' as keyof typeof Object.keys,
  totalRequests: 'totalRequests' as keyof typeof Object.keys,
  requestsInDataRange: 'requestsInDataRange' as keyof typeof Object.keys,
  createdAt: 'createdAt' as keyof typeof Object.keys,
  updatedAt: 'updatedAt' as keyof typeof Object.keys,
};
//////////////////////////////////////

//////////////////////////////////////
export type TRequests = {
  media: string;
  reqIp: string;
  createdAt: Date;
};
export const iRequestsKey = {
  media: 'media' as keyof typeof Object.keys,
  reqIp: 'reqIp' as keyof typeof Object.keys,
  createdAt: 'createdAt' as keyof typeof Object.keys,
};
//////////////////////////////////////

//////////////////////////////////////
export interface IApiKeyToken {
  id: string;
  user: string;
  project: string;
  apiKey: string | ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
export const iApiKeyTokenKey = {
  id: 'id' as keyof typeof Object.keys,
  user: 'user' as keyof typeof Object.keys,
  project: 'project' as keyof typeof Object.keys,
  apiKey: 'apiKey' as keyof typeof Object.keys,
  createdAt: 'createdAt' as keyof typeof Object.keys,
  updatedAt: 'updatedAt' as keyof typeof Object.keys,
};
//////////////////////////////////////

export interface ILicenseResponse extends ILicense {
  _id: string;
  user: IUser | any;
  project: string;
  apiKey: string | any;
  enabled: boolean;
  online: boolean;
  size: number;
  sizeT: string;
  totalFiles: number;
  subscription: ISubscription;
  requests: TRequests[] | any;
  totalRequests: number;
  requestsInDataRange: number;
  createdAt: Date;
  updatedAt: Date;
  __v: any;
}
