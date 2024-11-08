import { Request } from 'express';
import { ILicense } from './license.interface';
import { Types } from 'mongoose';

export interface IUser {
  _id: Types.ObjectId | string;
  dauthLicense?: ILicense;
  sid: string;
  name: string;
  lastname: string;
  nickname: string;
  email: string;
  password?: string;
  is_verified: boolean;
  language: string;
  avatar: string;
  role: string;
  tel_prefix: string;
  tel_suffix: string;
  createdAt: Date;
  updatedAt: Date;
  last_login: Date;
}
export const iUserKey = {
  _id: '_id' as keyof typeof Object.keys,
  dauthLicense: 'dauthLicense' as keyof typeof Object.keys,
  sid: 'sid' as keyof typeof Object.keys,
  name: 'name' as keyof typeof Object.keys,
  lastname: 'lastname' as keyof typeof Object.keys,
  nickname: 'nickname' as keyof typeof Object.keys,
  email: 'email' as keyof typeof Object.keys,
  password: 'password' as keyof typeof Object.keys,
  is_verified: 'is_verified' as keyof typeof Object.keys,
  language: 'language' as keyof typeof Object.keys,
  avatar: 'avatar' as keyof typeof Object.keys,
  role: 'role' as keyof typeof Object.keys,
  tel_prefix: 'tel_prefix' as keyof typeof Object.keys,
  tel_suffix: 'tel_suffix' as keyof typeof Object.keys,
  createdAt: 'createdAt' as keyof typeof Object.keys,
  updatedAt: 'updatedAt' as keyof typeof Object.keys,
  last_login: 'last_login' as keyof typeof Object.keys,
};

export interface IRequestUser extends Request {
  user: IUser;
  auth: IAccessToken;
  files: {
    image: { path: string };
    avatar: { path: string };
  };
  headers: {
    authorization: string;
  };
}

export interface IAccessToken {
  _id: string | Types.ObjectId;
  sid: string;
  email: string;
  createToken?: number;
  exp?: number;
  iat?: number;
}
