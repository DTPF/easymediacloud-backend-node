const { Schema, model } = require('mongoose');

const SuscriptionSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  license: { type: Schema.Types.ObjectId, ref: 'License', required: true },
  type: { type: String, required: true },
  price: { type: Number, default: 0, required: true },
  currency: { type: String, required: true },
  maxSize: { type: Number, default: 0 },
  maxSizeT: { type: String, default: '0 B' },
  expire: { type: Date, required: true },
  enabled: { type: Boolean, default: true },
}, {
  timestamps: true
})

const SuscriptionModel = model('Suscription', SuscriptionSchema);

export default SuscriptionModel;