import { LICENSE_MODEL, SUBSCRIPTION_MODEL, USER_MODEL } from "../../modelsConstants";
const { Schema, model } = require('mongoose');

const LicenseSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: USER_MODEL },
  subscription: { type: Schema.Types.ObjectId, ref: SUBSCRIPTION_MODEL },
  project: { type: String, required: true },
  apiKey: { type: String, required: true, unique: true },
  enabled: { type: Boolean, required: true, default: true },
  online: { type: Boolean, required: true, default: true },
  size: { type: Number, default: 0 },
  sizeT: { type: String, default: '0 B' },
  totalFiles: { type: Number, default: 0 },
  requests: [{
    media: { type: Schema.Types.ObjectId },
    reqIp: { type: String, default: 'no-ip' },
    createdAt: { type: Date, default: Date.now }
  }],
  totalRequests: { type: Number, default: 0 },
  requestsInDataRange: { type: Number, default: 0 },
}, {
  timestamps: true
})

const LicenseModel = model(LICENSE_MODEL, LicenseSchema);
export default LicenseModel;