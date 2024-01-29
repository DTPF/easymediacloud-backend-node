import { Request } from "express"
import { ILicense } from "./license.interface"
import mongoose from "mongoose"

export interface IUser {
  _id: mongoose.Types.ObjectId | string
  auth0Id: string
  name: string
  lastname: string
  email: string
  role: string
  isVerified: boolean
  language: string
  avatar: string
  licenses: ILicense[]
  createdAt: Date
  updatedAt: Date
  lastLogin: Date
  __v: string | any
}
export const iUserKey = {
  _id: '_id' as keyof typeof Object.keys,
  auth0Id: 'auth0Id' as keyof typeof Object.keys,
  name: 'name' as keyof typeof Object.keys,
  lastname: 'lastname' as keyof typeof Object.keys,
  email: 'email' as keyof typeof Object.keys,
  role: 'role' as keyof typeof Object.keys,
  isVerified: 'isVerified' as keyof typeof Object.keys,
  language: 'language' as keyof typeof Object.keys,
  avatar: 'avatar' as keyof typeof Object.keys,
  licenses: 'licenses' as keyof typeof Object.keys,
  createdAt: 'createdAt' as keyof typeof Object.keys,
  updatedAt: 'updatedAt' as keyof typeof Object.keys,
  lastLogin: 'lastLogin' as keyof typeof Object.keys,
}

export interface IAuth0User {
  nickname: string
  name: string
  picture: string
  updated_at: string
  email: string
  email_verified: boolean
  sub: string
  locale: string
}

export interface IRequestUser extends Request {
  user: IUser
  auth: Auth0Request
  files: {
    image: { path: string },
    avatar: { path: string }
  },
  headers: {
    authorization: string
  }
}

interface Auth0Request {
  payload: {
    iss: string,
    sub: string,
    aud: string[],
    iat: number,
    exp: number,
    azp: string,
    scope: string
  },
  header: { alg: string, typ: string, kid: string },
  token: string
}