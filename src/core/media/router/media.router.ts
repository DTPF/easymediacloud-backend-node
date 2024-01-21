import express from "express"
import * as MediaController from "../controllers/media.controller";
const api = express.Router()

api
	.post("/post-media/:folders?", MediaController.postMedia)
	.get("/media/:project/:media", MediaController.getMedia)
	.get("/media/:project/:folders/:media", MediaController.getMedia)

module.exports = api