import { LICENSE_MODEL, SUBSCRIPTION_MODEL, USER_MODEL } from "../../modelsConstants";
const { Schema, model } = require('mongoose');

const SubscriptionSchema = new Schema({
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

const SubscriptionModel = model(SUBSCRIPTION_MODEL, SubscriptionSchema);
export default SubscriptionModel;