const admin = require("firebase-admin");
const serviceAccount = require("../firebase-adminsdk.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

exports.sendSinglePushNotification = (device_token, notification) => {
  const message = {
    token: device_token,
    notification: notification,
  };
  admin
    .messaging()
    .send(message)
    .then((response) => {
      console.log("Message sent successfully:", response);
    })
    .catch((error) => {
      console.log("Error sending message:", error);
    });
};

exports.sendMultiPushNotification = (device_token, notification) => {
  const tokens = device_token;
  const message = { notification: notification };
  admin
    .messaging()
    .sendMulticast({ tokens: tokens, ...message })
    .then((response) => {
      //   console.log("Message sent successfully:", response);
    })
    .catch((error) => {
      console.log("Error sending message:", error);
    });
};