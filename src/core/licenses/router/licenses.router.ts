import { ensure_admin, dauth_md, is_verified } from '../../../middlewares';
import * as controller from '../controllers/licenses.controller';
const express = require('express');
const api = express.Router();

api
  .post('/create-license', [dauth_md, is_verified], controller.createLicense)
  .get('/get-license/:licenseId', [dauth_md, is_verified], controller.getLicenseById)
  .get('/get-license-token/:licenseId', [dauth_md, is_verified], controller.getLicenseToken)
  .get(
    '/get-license-token-decrypted/:licenseId',
    [dauth_md, ensure_admin],
    controller.getLicenseTokenDecrypted
  )
  .get('/refresh-license-token/:licenseId', [dauth_md, is_verified], controller.refreshLicenseToken)
  .get('/get-my-licenses', [dauth_md, is_verified], controller.getMyLicenses)
  .patch('/enable-license/:licenseId', [dauth_md, ensure_admin], controller.enableLicense)
  .patch('/set-license-online/:licenseId', [dauth_md, is_verified], controller.setOnlineLicense)
  .patch('/update-license-project/:licenseId', [dauth_md, is_verified], controller.updateLicenseProject)
  .delete('/delete-license/:licenseId', [dauth_md, is_verified], controller.deleteLicense);

module.exports = api;
