const { Schema, model } = require('mongoose');

const LicenseSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  project: { type: String, required: true },
  apiKey: { type: String, required: true, unique: true },
  enabled: { type: Boolean, required: true },
  size: { type: String, default: '0 B' },
}, {
  timestamps: true
})

const LicenseModel = model('License', LicenseSchema);

export default LicenseModel;