const { Schema, model } = require('mongoose');

const LicenseSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  project: { type: String, required: true },
  apiKey: { type: String, required: true, unique: true },
  enabled: { type: Boolean, required: true },
  online: { type: Boolean, required: true },
  size: { type: Number, default: 0 },
  totalFiles: { type: Number, default: 0 },
}, {
  timestamps: true
})

const LicenseModel = model('License', LicenseSchema);

export default LicenseModel;