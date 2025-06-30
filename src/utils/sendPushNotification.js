import { Expo } from "expo-server-sdk";
import { userModel } from "../../Database/models/user.model.js";

const expo = new Expo();

/**
 * Envía una notificación push a uno o varios usuarios usando expo-server-sdk-node.
 * @param {string|string[]} userId - ID o array de IDs de usuario(s)
 * @param {string} title - Título de la notificación
 * @param {string} body - Cuerpo de la notificación
 * @param {object} data - Objeto de datos adicional (opcional)
 */
export async function sendPushNotification(userId, title, body, data = {}) {
  const userIds = Array.isArray(userId) ? userId : [userId];
  const users = await userModel.find({
    _id: { $in: userIds },
    pushToken: { $ne: null },
  });
  if (!users.length) return;
  const messages = users.map((u) => ({
    to: u.pushToken,
    sound: "default",
    title,
    body,
    data,
  }));
  const chunks = expo.chunkPushNotifications(messages);
  for (const chunk of chunks) {
    try {
      await expo.sendPushNotificationsAsync(chunk);
    } catch (error) {
      console.error("Expo push error:", error);
    }
  }
}
