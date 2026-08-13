import { io, type Socket } from "socket.io-client";
import { getSocketBaseUrl } from "./apiConfig";
import type { ProjectMessage } from "./messageService";

type JoinResponse = {
  success: boolean;
  message?: string;
};

type ProjectMessageEvents = {
  onMessageCreated: (message: ProjectMessage) => void;
  onMessageRead: (message: ProjectMessage) => void;
  onConnectionError?: (message: string) => void;
};

let projectMessageSocket: Socket | null = null;

const getProjectMessageSocket = () => {
  if (!projectMessageSocket) {
    projectMessageSocket = io(getSocketBaseUrl(), {
      autoConnect: false,
      withCredentials: true,
      transports: ["polling", "websocket"],
    });
  }

  return projectMessageSocket;
};

export const joinProjectMessageSocket = (projectId: string, events: ProjectMessageEvents) => {
  const socket = getProjectMessageSocket();

  const handleConnect = () => {
    socket.emit("project:join", { projectId }, (response: JoinResponse = { success: false }) => {
      if (!response.success) {
        events.onConnectionError?.(response.message || "Project message socket could not join.");
      }
    });
  };

  const handleConnectError = (error: Error) => {
    events.onConnectionError?.(error.message || "Project message socket failed.");
  };

  socket.on("connect", handleConnect);
  socket.on("connect_error", handleConnectError);
  socket.on("project:message_created", events.onMessageCreated);
  socket.on("project:message_read", events.onMessageRead);

  if (socket.connected) {
    handleConnect();
  } else {
    socket.connect();
  }

  return () => {
    socket.emit("project:leave", { projectId });
    socket.off("connect", handleConnect);
    socket.off("connect_error", handleConnectError);
    socket.off("project:message_created", events.onMessageCreated);
    socket.off("project:message_read", events.onMessageRead);
  };
};
