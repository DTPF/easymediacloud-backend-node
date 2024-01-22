import { auth_0, is_verified } from "../../../middlewares";
import * as controller from "../controllers/subscriptions.controller";
const express = require('express');
const api = express.Router()

api.
  post("/create-subscription", [auth_0, is_verified], controller.createSubscription)

module.exports = api
