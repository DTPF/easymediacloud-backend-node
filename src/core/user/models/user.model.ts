import { iUserKey } from "../../../interfaces/user.interface";
import { LICENSE_MODEL, USER_MODEL } from "../../modelsConstants";
const { Schema, model, Types } = require('mongoose');

const UserSchema = new Schema({
  [iUserKey.auth0Id]: { type: String, required: true, unique: true },
  [iUserKey.name]: { type: String },
  [iUserKey.lastname]: String,
  [iUserKey.email]: { type: String, required: true, unique: true },
  [iUserKey.role]: String,
  [iUserKey.isVerified]: Boolean,
  [iUserKey.language]: String,
  [iUserKey.avatar]: String,
  [iUserKey.licenses]: [{ type: Schema.Types.ObjectId, ref: LICENSE_MODEL }],
  [iUserKey.lastLogin]: Date,
}, {
  timestamps: true
})

const UserModel = model(USER_MODEL, UserSchema);
export default UserModel;