import { catchAsyncError } from "../../utils/catchAsyncError.js";
import { AppError } from "../../utils/AppError.js";
import { deleteOne } from "../../handlers/factor.js";
import { ApiFeatures } from "../../utils/ApiFeatures.js";
import { userModel } from "../../../Database/models/user.model.js";
import bcrypt from "bcrypt";
import { sendPushNotification } from "../../utils/sendPushNotification.js";

const addUser = catchAsyncError(async (req, res, next) => {
  const addUser = new userModel(req.body);
  await addUser.save();

  res.status(201).json({ message: "success", addUser });
});

const getAllUsers = catchAsyncError(async (req, res, next) => {
  let apiFeature = new ApiFeatures(userModel.find(), req.query)
    .pagination()
    .fields()
    .filteration()
    .search()
    .sort();
  const PAGE_NUMBER = apiFeature.queryString.page * 1 || 1;
  const getAllUsers = await apiFeature.mongooseQuery;

  res.status(201).json({ page: PAGE_NUMBER, message: "success", getAllUsers });
});

const updateUser = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const updateUser = await userModel.findByIdAndUpdate(id, req.body, {
    new: true,
  });

  updateUser && res.status(201).json({ message: "success", updateUser });

  !updateUser && next(new AppError("User was not found", 404));
});

const changeUserPassword = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  req.body.passwordChangedAt = Date.now();
  console.log(req.body.passwordChangedAt);
  const changeUserPassword = await userModel.findByIdAndUpdate(id, req.body, {
    new: true,
  });

  changeUserPassword &&
    res.status(201).json({ message: "success", changeUserPassword });

  !changeUserPassword && next(new AppError("User was not found", 404));
});
const deleteUser = deleteOne(userModel, "user");

// Guardar el token de notificación push de Expo
const savePushToken = catchAsyncError(async (req, res, next) => {
  const { userId, token } = req.body;
  if (!userId || !token) {
    return next(new AppError("userId and token are required", 400));
  }
  const user = await userModel.findByIdAndUpdate(
    userId,
    { pushToken: token },
    { new: true }
  );
  if (!user) return next(new AppError("User not found", 404));
  res.status(200).json({ message: "Push token saved", userId, token });
});

// Endpoint de prueba para enviar push notification a un token
const testPushNotification = catchAsyncError(async (req, res, next) => {
  console.log("Test push notification request:", req.body);

  const { token, title, body, data } = req.body;
  if (!token || !title || !body) {
    return next(new AppError("token, title, and body are required", 400));
  }
  // Simula un usuario temporal solo para test
  await sendPushNotificationToken(token, title, body, data || {});
  res.status(200).json({ message: "Push notification sent (test)", token });
});

// Utilidad para enviar push a un token directo (sin buscar usuario)
async function sendPushNotificationToken(token, title, body, data = {}) {
  const { Expo } = await import("expo-server-sdk");
  const expo = new Expo();
  const messages = [
    {
      to: token,
      sound: "default",
      title,
      body,
      data,
    },
  ];
  const chunks = expo.chunkPushNotifications(messages);
  for (const chunk of chunks) {
    try {
      await expo.sendPushNotificationsAsync(chunk);
    } catch (error) {
      console.error("Expo push error:", error);
    }
  }
}

// Cambiar el pushToken del usuario (por ejemplo, al loguearse)
const updatePushToken = catchAsyncError(async (req, res, next) => {
  const { userId, token } = req.body;
  if (!userId || !token) {
    return next(new AppError("userId and token are required", 400));
  }
  const user = await userModel.findByIdAndUpdate(
    userId,
    { pushToken: token },
    { new: true }
  );
  if (!user) return next(new AppError("User not found", 404));
  res.status(200).json({ message: "Push token updated", userId, token });
});

export {
  addUser,
  getAllUsers,
  updateUser,
  deleteUser,
  changeUserPassword,
  savePushToken,
  testPushNotification,
  updatePushToken,
};
