import moment from "moment";
import { convertBytes } from "../../../utils/getFolderSize";
import { LICENSE_MODEL, SUBSCRIPTION_MODEL, USER_MODEL } from "../../modelsConstants";
import { B500MB, FREE, REQUESTS_DATA_RANGE, SUBSCRIPTION_EXPIRE_DATE } from "../subscriptionsConstants";
import { iRequestsDataRangeKey, iSubscriptionKey } from "../../../interfaces/subscription.interface";
const { Schema, model } = require('mongoose');

const SubscriptionSchema = new Schema({
  [iSubscriptionKey.user]: { type: Schema.Types.ObjectId, ref: USER_MODEL, required: true },
  [iSubscriptionKey.license]: { type: Schema.Types.ObjectId, ref: LICENSE_MODEL, required: true },
  [iSubscriptionKey.type]: { type: String, required: true, default: FREE },
  [iSubscriptionKey.price]: { type: Number, default: 0, required: true },
  [iSubscriptionKey.currency]: { type: String, required: true },
  [iSubscriptionKey.maxSize]: { type: Number, default: B500MB },
  [iSubscriptionKey.maxSizeT]: { type: String, default: convertBytes(B500MB) },
  [iSubscriptionKey.expire]: { type: Date, default: moment().add(SUBSCRIPTION_EXPIRE_DATE.quantity, SUBSCRIPTION_EXPIRE_DATE.cicle as moment.DurationInputArg2) },
  [iSubscriptionKey.enabled]: { type: Boolean, default: true },
  [iSubscriptionKey.requestsDataRange]: {
    [iRequestsDataRangeKey.quantity]: { type: Number, default: REQUESTS_DATA_RANGE.quantity },
    [iRequestsDataRangeKey.cicle]: { type: String, default: REQUESTS_DATA_RANGE.cicle }
  },
  [iSubscriptionKey.maxRequests]: { type: Number, default: REQUESTS_DATA_RANGE.maxRequests }
}, {
  timestamps: true
})

const SubscriptionModel = model(SUBSCRIPTION_MODEL, SubscriptionSchema);
export default SubscriptionModel;