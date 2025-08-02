import io from "socket.io-client";
const sendSocketNotification = (userId: string, message: string) => {
  const socket = io(
    `${process.env.NEXT_PUBLIC_SOCKET_PROTOCOL}://${process.env.NEXT_PUBLIC_SOCKET_HOST}:${process.env.NEXT_PUBLIC_SOCKET_PORT}`
  );

  socket.emit("message", {
    userId: `${process.env.NEXT_PUBLIC_URL}${userId}`,
    message,
  });
};
export { sendSocketNotification };
