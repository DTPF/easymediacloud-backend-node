import { LICENSE_MODEL, USER_MODEL } from "../../modelsConstants";
const { Schema, model, Types } = require('mongoose');

const UserSchema = new Schema({
  auth0Id: { type: String, required: true, unique: true },
  name: { type: String },
  lastname: String,
  email: { type: String, required: true, unique: true },
  role: String,
  isVerified: Boolean,
  language: String,
  avatar: String,
  licenses: [{ type: Schema.Types.ObjectId, ref: LICENSE_MODEL }],
  lastLogin: Date,
}, {
  timestamps: true
})

const UserModel = model(USER_MODEL, UserSchema);
export default UserModel;