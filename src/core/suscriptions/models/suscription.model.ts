import { LICENSE_MODEL, SUSCRIPTION_MODEL, USER_MODEL } from "../../modelsConstants";
const { Schema, model } = require('mongoose');

const SuscriptionSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: USER_MODEL, required: true },
  license: { type: Schema.Types.ObjectId, ref: LICENSE_MODEL, required: true },
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

const SuscriptionModel = model(SUSCRIPTION_MODEL, SuscriptionSchema);
export default SuscriptionModel;