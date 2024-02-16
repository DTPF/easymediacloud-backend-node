import * as MediaController from "../controllers/media.controller";
import { dauth_md, is_verified } from "../../../middlewares";
const express = require('express');
const api = express.Router()

api
	.post("/post-media/:folders?", MediaController.postMedia)
	.get("/media/:mainFolder/:project/:media", MediaController.getMedia)
	.get("/media/:mainFolder/:project/:folders/:media", MediaController.getMedia)
	.delete("/delete-media/:mediaId", MediaController.deleteMedia)
	.get("/get-my-media", [dauth_md, is_verified], MediaController.getMyMedia)
	.get("/get-media-by-license/:licenseId", [dauth_md, is_verified], MediaController.getMediaByLicense)
	
module.exports = api