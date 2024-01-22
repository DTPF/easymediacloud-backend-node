import { auth_0, is_verified } from "../../../middlewares";
import * as controller from "../controllers/suscriptions.controller";
const express = require('express');
const api = express.Router()

api.
  post("/create-suscription", [auth_0, is_verified], controller.createSuscription)

module.exports = api
