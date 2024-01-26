import moment from "moment";
import { convertBytes } from "../../../utils/getFolderSize";
import { LICENSE_MODEL, SUBSCRIPTION_MODEL, USER_MODEL } from "../../modelsConstants";
import { B500MB, FREE, REQUESTS_PER_MONTH } from "../subscriptionsConstants";
const { Schema, model } = require('mongoose');

const SubscriptionSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: USER_MODEL, required: true },
  license: { type: Schema.Types.ObjectId, ref: LICENSE_MODEL, required: true },
  type: { type: String, required: true, default: FREE },
  price: { type: Number, default: 0, required: true },
  currency: { type: String, required: true },
  maxSize: { type: Number, default: B500MB },
  maxSizeT: { type: String, default: convertBytes(B500MB) },
  expire: { type: Date, default: moment().add(1, 'year') },
  enabled: { type: Boolean, default: true },
  requestsPerMonth: { type: Number, default: REQUESTS_PER_MONTH }
}, {
  timestamps: true
})

const SubscriptionModel = model(SUBSCRIPTION_MODEL, SubscriptionSchema);
export default SubscriptionModel;