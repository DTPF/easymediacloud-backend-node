import { ensure_admin, auth_0, is_verified } from "../../../middlewares";
import * as controller from "../controllers/licenses.controller";
const express = require('express');
const api = express.Router()

api.
  post("/create-license", [auth_0, is_verified], controller.createLicense).
  get("/get-license/:licenseId", [auth_0, is_verified], controller.getLicenseById).
  get("/get-license-token/:licenseId", [auth_0, is_verified], controller.getLicenseToken).
  get("/get-license-token-decrypted/:licenseId", [auth_0, ensure_admin], controller.getLicenseTokenDecrypted).
  get("/refresh-license-token/:licenseId", [auth_0, is_verified], controller.refreshLicenseToken).
  get("/get-my-licenses", [auth_0, is_verified], controller.getMyLicenses).
  patch("/enable-license", [auth_0, ensure_admin], controller.enableLicense).
  patch("/set-online-license", [auth_0, is_verified], controller.setOnlineLicense).
  patch("/update-license-project", [auth_0, is_verified], controller.updateLicenseProject).
  //Pending
  delete("/delete-license", [auth_0, ensure_admin], controller.deleteLicense)

module.exports = api
