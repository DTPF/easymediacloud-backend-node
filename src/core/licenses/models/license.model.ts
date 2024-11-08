import { iLicenseKey, iRequestsKey } from '../../../interfaces/license.interface';
import { LICENSE_MODEL, SUBSCRIPTION_MODEL, USER_MODEL } from '../../modelsConstants';
const { Schema, model } = require('mongoose');

const LicenseSchema = new Schema(
  {
    [iLicenseKey.user]: { type: Schema.Types.ObjectId, ref: USER_MODEL },
    [iLicenseKey.subscription]: { type: Schema.Types.ObjectId, ref: SUBSCRIPTION_MODEL },
    [iLicenseKey.project]: { type: String, required: true },
    [iLicenseKey.apiKey]: { type: String, required: true, unique: true },
    [iLicenseKey.enabled]: { type: Boolean, required: true, default: true },
    [iLicenseKey.online]: { type: Boolean, required: true, default: true },
    [iLicenseKey.size]: { type: Number, default: 0 },
    [iLicenseKey.sizeT]: { type: String, default: '0 B' },
    [iLicenseKey.totalFiles]: { type: Number, default: 0 },
    [iLicenseKey.requests]: [
      {
        [iRequestsKey.media]: { type: Schema.Types.ObjectId },
        [iRequestsKey.reqIp]: { type: String, default: 'no-ip' },
        [iRequestsKey.createdAt]: { type: Date, default: Date.now },
      },
    ],
    [iLicenseKey.totalRequests]: { type: Number, default: 0 },
    [iLicenseKey.requestsInDataRange]: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

const LicenseModel = model(LICENSE_MODEL, LicenseSchema);
export default LicenseModel;
