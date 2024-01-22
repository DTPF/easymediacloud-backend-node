const { Schema, model } = require('mongoose');

const MediaSchema = new Schema({
  license: { type: Schema.Types.ObjectId, ref: 'License' },
  directory: { type: String },
  url: { type: String, required: true },
  fileName: { type: String, required: true },
  sizeT: { type: String, default: '0 B' },
  size: { type: Number, default: 0 },
  enabled: { type: Boolean, default: true },
}, {
  timestamps: true
})

const MediaModel = model("Media", MediaSchema)

export default MediaModel;