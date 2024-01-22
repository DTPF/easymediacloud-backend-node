import { LICENSE_MODEL, MEDIA_MODEL } from "../../modelsConstants";
const { Schema, model } = require('mongoose');

const MediaSchema = new Schema({
  license: { type: Schema.Types.ObjectId, ref: LICENSE_MODEL },
  directory: { type: String },
  url: { type: String, required: true },
  fileName: { type: String, required: true },
  size: { type: Number, default: 0 },
  sizeT: { type: String, default: '0 B' },
  enabled: { type: Boolean, default: true },
}, {
  timestamps: true
})

const MediaModel = model(MEDIA_MODEL, MediaSchema)
export default MediaModel;