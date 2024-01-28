import express from "express"
import * as MediaController from "../controllers/media.controller";
const api = express.Router()

api
	.post("/post-media/:folders?", MediaController.postMedia)
	.get("/media/:mainFolder/:project/:media", MediaController.getMedia)
	.get("/media/:mainFolder/:project/:folders/:media", MediaController.getMedia)
	.delete("/delete-media/:mediaId", MediaController.deleteMedia)

module.exports = api