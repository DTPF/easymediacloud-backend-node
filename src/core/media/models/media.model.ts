import { iMediaKey } from "../../../interfaces/media.interface";
import { LICENSE_MODEL, MEDIA_MODEL } from "../../modelsConstants";
const { Schema, model } = require('mongoose');

const MediaSchema = new Schema({
  [iMediaKey.license]: { type: Schema.Types.ObjectId, ref: LICENSE_MODEL },
  [iMediaKey.directory]: { type: String },
  [iMediaKey.url]: { type: String, required: true },
  [iMediaKey.fileName]: { type: String, required: true },
  [iMediaKey.size]: { type: Number, default: 0 },
  [iMediaKey.sizeT]: { type: String, default: '0 B' },
  [iMediaKey.enabled]: { type: Boolean, default: true },
  [iMediaKey.totalRequests]: { type: Number, default: 0 },
}, {
  timestamps: true
})

const MediaModel = model(MEDIA_MODEL, MediaSchema)
export default MediaModel;