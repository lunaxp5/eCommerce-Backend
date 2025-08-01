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

const verifyUserIdentityAndPassword = async (
  req,
  idFromtoken,
  currentPassword
) => {
  if (req.user._id.toString() !== idFromtoken) {
    console.log("flag 1");

    throw new AppError("Not authorized to update this user", 403);
  }
  if (!currentPassword) {
    console.log("flag 2");

    throw new AppError("Password is required to update profile", 400);
  }
  const userDatabase = await userModel.findById(idFromtoken);
  if (!userDatabase) {
    console.log("flag 3");
    throw new AppError("User was not found", 404);
  }
  const isMatch = await bcrypt.compare(currentPassword, userDatabase.password);
  if (!isMatch) {
    console.log("flag 4");
    throw new AppError("Incorrect password", 401);
  }
};

const updateUser = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const { currentPassword, name, email } = req.body;
  // Solo permitir actualizar nombre y correo
  const updateFields = {};
  if (name) updateFields.name = name;
  if (email) updateFields.email = email;

  // Solo el usuario dueño o un admin pueden actualizar
  if (req.user.role !== "admin") {
    await verifyUserIdentityAndPassword(req, id, currentPassword);
  }

  const updatedUser = await userModel.findByIdAndUpdate(id, updateFields, {
    new: true,
  });
  if (!updatedUser) {
    return next(new AppError("User was not found", 404));
  }
  return res.status(201).json({
    message: "success",
    user: {
      name: updatedUser.name,
      email: updatedUser.email,
    },
  });
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

// Obtener el perfil del usuario autenticado
const getProfile = catchAsyncError(async (req, res, next) => {
  const user = await userModel.findById(req.user._id).select("-password");
  if (!user) return next(new AppError("User not found", 404));
  res.status(200).json({ message: "success", user });
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
  getProfile,
};
