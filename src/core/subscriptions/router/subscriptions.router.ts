import { dauth_md, ensure_admin, is_verified } from '../../../middlewares';
import * as controller from '../controllers/subscriptions.controller';
const express = require('express');
const subscriptionApi = express.Router();

subscriptionApi
  .patch('/custom-subscription/:subscriptionId', [dauth_md, ensure_admin], controller.customSubscription)
  .patch(
    '/renew-free-subscription/:subscriptionId',
    [dauth_md, is_verified],
    controller.renewFreeSubscription
  );
// Pending
// patch("/get-basic-subscription", [dauth_md, hydrate], controller.renewFreeSubscription).
// patch("/get-premium-subscription", [dauth_md, hydrate], controller.renewFreeSubscription).

export default subscriptionApi;
