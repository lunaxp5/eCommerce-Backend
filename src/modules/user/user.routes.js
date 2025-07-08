import express from "express";
import * as User from "./user.controller.js";
import { validate } from "../../middlewares/validate.js";
import {
  addUserValidation,
  changeUserPasswordValidation,
  deleteUserValidation,
  updateUserValidation,
} from "./user.validation.js";
import { protectedRoutes } from "../auth/auth.controller.js";

const userRouter = express.Router();

userRouter
  .route("/")
  .post(validate(addUserValidation), User.addUser)
  .get(User.getAllUsers);

userRouter
  .route("/:id")
  .put(validate(updateUserValidation), User.updateUser)
  .delete(validate(deleteUserValidation), User.deleteUser)
  .patch(validate(changeUserPasswordValidation), User.changeUserPassword);

userRouter.post("/push-token", User.savePushToken);
userRouter.post("/test-push", User.testPushNotification);
userRouter.post("/update-push-token", User.updatePushToken);
userRouter.get("/me", protectedRoutes, User.getProfile);

export default userRouter;
