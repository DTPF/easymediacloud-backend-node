import moment from "moment";
import { convertBytes } from "../../../utils/getFolderSize";
import { LICENSE_MODEL, SUBSCRIPTION_MODEL, USER_MODEL } from "../../modelsConstants";
import { B500MB, FREE, REQUESTS_PER_MONTH, SUBSCRIPTION_EXPIRE_DATE, SUBSCRIPTION_EXPIRE_DATE_CICLE } from "../subscriptionsConstants";
import { iSubscriptionKey } from "../../../interfaces/subscription.interface";
const { Schema, model } = require('mongoose');

const SubscriptionSchema = new Schema({
  [iSubscriptionKey.user]: { type: Schema.Types.ObjectId, ref: USER_MODEL, required: true },
  [iSubscriptionKey.license]: { type: Schema.Types.ObjectId, ref: LICENSE_MODEL, required: true },
  [iSubscriptionKey.type]: { type: String, required: true, default: FREE },
  [iSubscriptionKey.price]: { type: Number, default: 0, required: true },
  [iSubscriptionKey.currency]: { type: String, required: true },
  [iSubscriptionKey.maxSize]: { type: Number, default: B500MB },
  [iSubscriptionKey.maxSizeT]: { type: String, default: convertBytes(B500MB) },
  [iSubscriptionKey.expire]: { type: Date, default: moment().add(SUBSCRIPTION_EXPIRE_DATE, SUBSCRIPTION_EXPIRE_DATE_CICLE) },
  [iSubscriptionKey.enabled]: { type: Boolean, default: true },
  [iSubscriptionKey.requestsPerMonth]: { type: Number, default: REQUESTS_PER_MONTH }
}, {
  timestamps: true
})

const SubscriptionModel = model(SUBSCRIPTION_MODEL, SubscriptionSchema);
export default SubscriptionModel;