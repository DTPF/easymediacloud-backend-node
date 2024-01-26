import { Request } from "express"
import { ILicense } from "./license.interface"

export interface IUser {
  _id: string
  auth0Id: string
  name: string
  lastname: string
  nickname: string
  email: string
  role: string
  isVerified: boolean
  language: string
  avatar: string
  licenses: ILicense[]
  createdAt: Date
  updatedAt: Date
  lastLogin: Date
  folderId: Object | string
  __v: string | any
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