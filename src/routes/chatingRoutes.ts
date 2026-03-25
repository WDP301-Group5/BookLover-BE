import express from "express";
import {
	checkAndCreateConversation,
	getChatingContent,
	getListChatingUser,
	getSearchChatingUser,
} from "../controllers/chatingController";
import { checkToken } from "./../middleware/auth";

const chatingRouter = express.Router();

chatingRouter.get("/contact", checkToken, getListChatingUser);
chatingRouter.get("/user/search", checkToken, getSearchChatingUser);
chatingRouter.get("/message/:conversationId", checkToken, getChatingContent);
chatingRouter.post(
	"/conversation/:memberId",
	checkToken,
	checkAndCreateConversation,
);

export default chatingRouter;
