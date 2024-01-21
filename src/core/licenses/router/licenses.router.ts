import { ensure_admin, auth_0, is_verified } from "../../../middlewares";
import * as controller from "../controllers/licenses.controller";
const express = require('express');
const api = express.Router()

api.
  post("/create-license", [auth_0, is_verified], controller.createLicense).
  get("/get-license/:licenseId", [auth_0, is_verified], controller.getLicenseById).
  get("/get-api-key/:licenseId", [auth_0, is_verified], controller.getApiKey).
  get("/get-my-licenses", [auth_0, is_verified], controller.getMyLicenses).
  patch("/enable-license", [auth_0, ensure_admin], controller.enableLicense).
  patch("/update-license-project", [auth_0, is_verified], controller.updateLicenseProject).
  //Pending
  delete("/delete-license", [auth_0, ensure_admin], controller.deleteLicense)

module.exports = api
