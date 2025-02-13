import express from "express";
import * as auth from "./auth.controller.js";

const authRouter = express.Router();

// #swagger.tags = ['Users']
// #swagger.description = 'Endpoint to sign up a user'
authRouter.post("/signup", auth.signUp);

authRouter.post("/signin", auth.signIn);

export default authRouter;
