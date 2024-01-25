import { auth_0, ensure_admin, is_verified } from "../../../middlewares";
import * as controller from "../controllers/subscriptions.controller";
const express = require('express');
const api = express.Router()

api.
  patch("/custom-subscription/:subscriptionId", [auth_0, ensure_admin], controller.customSubscription).
  patch("/renew-free-subscription/:subscriptionId", [auth_0, is_verified], controller.renewFreeSubscription)
  // Pending
  // patch("/get-basic-subscription", [auth_0, hydrate], controller.renewFreeSubscription).
  // patch("/get-premium-subscription", [auth_0, hydrate], controller.renewFreeSubscription).

module.exports = api
