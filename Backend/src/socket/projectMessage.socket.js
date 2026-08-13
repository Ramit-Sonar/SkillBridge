import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import { User } from "../models/user.model.js";
import { ensureProjectMessageAccess } from "../services/message.service.js";

let io;

const PROJECT_MESSAGE_ROOM_PREFIX = "project_messages:";

const parseCookies = (cookieHeader = "") =>
  cookieHeader.split(";").reduce((cookies, cookie) => {
    const [name, ...valueParts] = cookie.trim().split("=");

    if (!name) return cookies;

    cookies[name] = decodeURIComponent(valueParts.join("="));
    return cookies;
  }, {});

const getProjectMessageRoom = (projectId) =>
  `${PROJECT_MESSAGE_ROOM_PREFIX}${projectId}`;

const getSocketAccessToken = (socket) => {
  const cookies = parseCookies(socket.handshake.headers.cookie || "");

  return cookies.accessToken || socket.handshake.auth?.accessToken || "";
};

const authenticateSocket = async (socket, next) => {
  try {
    const token = getSocketAccessToken(socket);

    if (!token || typeof token !== "string") {
      throw new Error("Socket authentication token is missing");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id).select(
      "_id fullName avatar role accountStatus"
    );

    if (!user || !["student", "client"].includes(user.role)) {
      throw new Error("Socket user is not allowed");
    }

    if (user.accountStatus === "suspended") {
      throw new Error("Socket user account is suspended");
    }

    socket.user = user;
    next();
  } catch (error) {
    next(new Error(error.message || "Socket authentication failed"));
  }
};

const handleProjectJoin = async (socket, payload, callback) => {
  try {
    const projectId = payload?.projectId;

    await ensureProjectMessageAccess(projectId, socket.user._id);
    socket.join(getProjectMessageRoom(projectId));
    callback?.({ success: true });
  } catch (error) {
    callback?.({
      success: false,
      message: error.message || "Unable to join project messages",
    });
  }
};

const handleProjectLeave = (socket, payload, callback) => {
  const projectId = payload?.projectId;

  if (projectId) {
    socket.leave(getProjectMessageRoom(projectId));
  }

  callback?.({ success: true });
};

export const initializeSocketServer = (server, allowedOrigins = []) => {
  io = new Server(server, {
    cors: {
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error("Socket CORS origin not allowed"));
      },
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    socket.on("project:join", (payload, callback) =>
      handleProjectJoin(socket, payload, callback)
    );
    socket.on("project:leave", handleProjectLeave.bind(null, socket));
  });

  return io;
};

export const emitProjectMessageCreated = (message) => {
  if (!io || !message?.project) return;

  io.to(getProjectMessageRoom(message.project)).emit(
    "project:message_created",
    message
  );
};

export const emitProjectMessageRead = (message) => {
  if (!io || !message?.project) return;

  io.to(getProjectMessageRoom(message.project)).emit(
    "project:message_read",
    message
  );
};
