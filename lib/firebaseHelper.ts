import * as admin from "firebase-admin";

const serviceAccount = {};

const app =
  !admin.apps.length
    ? admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      })
    : admin.app();

export const messaging = app.messaging();

export const sendNotification = async (
  token: string,
  title: string,
  body: string,
  data: Record<string, any>
) => {
  const stringData = Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, String(value)])
  );

  const message = {
    token,
    notification: {
      title,
      body,
    },
    data: stringData,
  };

  try {
    await messaging.send(message);
  } catch (err) {
    console.error("Error sending notification:", err);
  }
};

export function sendNotificationToTopic(
  topic: string,
  title: string,
  body: string,
  data: Record<string, any>
): Promise<any> {
  const stringifiedData: Record<string, string> = {};
  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      stringifiedData[key] = String(data[key]);
    }
  }

  const message = {
    topic,
    notification: {
      title,
      body,
    },
    data: stringifiedData,
  };

  return messaging.send(message).catch((err) => {
    console.error("Error sending topic notification:", err);
  });
}
