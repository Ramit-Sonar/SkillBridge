import { useEffect, useRef, useState } from "react";
import { Check, CheckCheck, Clock, MessageSquare, Send } from "lucide-react";
import { type ProjectStatus } from "../../data/projects";
import { formatProjectRelativeDate, getProjectOverviewAction } from "./projectPresentation";
import {
  getProjectMessages,
  markProjectMessageRead,
  sendProjectMessage,
  type ProjectMessage,
} from "../../../services/messageService";
import type { NotificationMessage } from "./ui";

type ProjectOverviewPerson = {
  name: string;
  initials: string;
  avatar?: string;
};

export type ProjectOverviewData = {
  status: ProjectStatus;
  startedAt: string;
  completedAt?: string;
  deadline: string;
  budget: string;
  partner: ProjectOverviewPerson | null;
};

type ProjectOverviewProps = {
  projectId: string;
  project: ProjectOverviewData;
  status: ProjectStatus;
  role: "student" | "client";
  lastUpdated: string;
  action?: React.ReactNode;
  profileAction?: React.ReactNode;
  onNotify?: (message: NotificationMessage) => void;
};

const formatMessageTime = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

const DISCUSSION_POLL_INTERVAL_MS = 5000;

const didMessageListChange = (
  currentMessages: ProjectMessage[],
  nextMessages: ProjectMessage[]
) => {
  if (currentMessages.length !== nextMessages.length) return true;

  const currentLastMessage = currentMessages[currentMessages.length - 1];
  const nextLastMessage = nextMessages[nextMessages.length - 1];

  if (currentLastMessage?.id !== nextLastMessage?.id) return true;

  return nextMessages.some((message, index) => {
    const currentMessage = currentMessages[index];

    return currentMessage.id !== message.id || currentMessage.isRead !== message.isRead;
  });
};

export function ProjectOverview({
  projectId,
  project,
  status,
  role,
  lastUpdated,
  action,
  profileAction,
  onNotify,
}: ProjectOverviewProps) {
  const currentAction = getProjectOverviewAction(status, role);
  const partner = project.partner;
  const partnerRole = role === "student" ? "Client" : "Student";
  const lastActivity = formatProjectRelativeDate(lastUpdated);
  const messageListRef = useRef<HTMLDivElement | null>(null);
  const mountedRef = useRef(false);
  const messagesSnapshotRef = useRef<ProjectMessage[]>([]);
  const [messages, setMessages] = useState<ProjectMessage[]>([]);
  const [messageDraft, setMessageDraft] = useState("");
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [messageSending, setMessageSending] = useState(false);
  const [messagesError, setMessagesError] = useState("");
  const latestMessages = messages.slice(-8);

  const scrollMessagesToBottom = () => {
    window.setTimeout(() => {
      messageListRef.current?.scrollTo({
        top: messageListRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 0);
  };

  const setDiscussionMessages = (nextMessages: ProjectMessage[]) => {
    messagesSnapshotRef.current = nextMessages;
    setMessages(nextMessages);
  };

  const markUnreadReceivedMessages = async (nextMessages: ProjectMessage[]) => {
    const unreadMessages = nextMessages.filter(
      (message) => message.sender.role !== role && !message.isRead
    );

    if (unreadMessages.length === 0) return;

    try {
      await Promise.all(
        unreadMessages.map((message) => markProjectMessageRead(message.id))
      );

      if (!mountedRef.current) return;

      const readMessageIds = new Set(unreadMessages.map((message) => message.id));
      const updatedMessages = messagesSnapshotRef.current.map((message) =>
        readMessageIds.has(message.id) ? { ...message, isRead: true } : message
      );

      setDiscussionMessages(updatedMessages);
    } catch {
      // Read receipts are retried on the next message refresh.
    }
  };

  const loadMessages = async (showLoading = true) => {
    if (showLoading) setMessagesLoading(true);
    setMessagesError("");

    try {
      const response = await getProjectMessages(projectId);

      if (!mountedRef.current) return;

      setDiscussionMessages(response.data.messages);
      markUnreadReceivedMessages(response.data.messages);
      scrollMessagesToBottom();
    } catch (error) {
      if (!mountedRef.current) return;

      const message = error instanceof Error ? error.message : "Failed to fetch project messages.";
      setMessagesError(message);
    } finally {
      if (showLoading && mountedRef.current) setMessagesLoading(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    const fetchMessages = async () => {
      setMessagesLoading(true);
      setMessagesError("");

      try {
        const response = await getProjectMessages(projectId);

        if (!mountedRef.current) return;

        setDiscussionMessages(response.data.messages);
        markUnreadReceivedMessages(response.data.messages);
        scrollMessagesToBottom();
      } catch (error) {
        if (!mountedRef.current) return;

        const message =
          error instanceof Error ? error.message : "Failed to fetch project messages.";
        setMessagesError(message);
      } finally {
        if (mountedRef.current) setMessagesLoading(false);
      }
    };

    const pollMessages = async () => {
      try {
        const response = await getProjectMessages(projectId);

        if (!mountedRef.current) return;

        const nextMessages = response.data.messages;

        if (!didMessageListChange(messagesSnapshotRef.current, nextMessages)) return;

        setMessagesError("");
        setDiscussionMessages(nextMessages);
        markUnreadReceivedMessages(nextMessages);
        scrollMessagesToBottom();
      } catch (error) {
        if (!mountedRef.current || messagesSnapshotRef.current.length > 0) return;

        const message =
          error instanceof Error ? error.message : "Failed to fetch project messages.";
        setMessagesError(message);
      }
    };

    fetchMessages();
    const pollingIntervalId = window.setInterval(pollMessages, DISCUSSION_POLL_INTERVAL_MS);

    return () => {
      mountedRef.current = false;
      window.clearInterval(pollingIntervalId);
    };
  }, [projectId]);

  const handleSendMessage = async () => {
    const messageText = messageDraft.trim();
    if (!messageText || messageSending) return;

    setMessageSending(true);

    try {
      await sendProjectMessage(projectId, messageText);
      setMessageDraft("");
      await loadMessages(false);
      scrollMessagesToBottom();
    } catch (error) {
      if (!mountedRef.current) return;

      const message = error instanceof Error ? error.message : "Failed to send project message.";
      if (messages.length === 0) {
        setMessagesError(message);
      }
      onNotify?.({ type: "error", text: message });
    } finally {
      if (mountedRef.current) setMessageSending(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-4 items-start">
      <section
        tabIndex={-1}
        className="bg-white rounded-2xl border border-black/[0.05] shadow-sm p-5 flex flex-col gap-4 outline-none focus:border-blue-200 focus:ring-4 focus:ring-blue-50"
      >
        <h2 className="text-slate-900 font-bold" style={{ fontSize: "0.95rem" }}>
          Project Discussion
        </h2>
        <div
          ref={messageListRef}
          className="bg-slate-50 rounded-xl border border-black/[0.04] p-3 max-h-[214px] overflow-y-auto flex flex-col gap-2.5"
        >
          {messagesLoading ? (
            <div className="min-h-[190px] flex items-center justify-center text-center">
              <p className="text-slate-400" style={{ fontSize: "0.78rem" }}>
                Loading messages...
              </p>
            </div>
          ) : messagesError ? (
            <div className="min-h-[190px] flex flex-col items-center justify-center text-center gap-2">
              <p className="text-red-500 font-semibold" style={{ fontSize: "0.78rem" }}>
                {messagesError}
              </p>
              <button
                type="button"
                onClick={() => loadMessages()}
                className="text-blue-600 font-semibold hover:text-blue-700"
                style={{ fontSize: "0.72rem" }}
              >
                Try again
              </button>
            </div>
          ) : latestMessages.length > 0 ? (
            latestMessages.map((message) => {
              const isCurrentViewer = message.sender.role === role;
              const senderName =
                message.sender.fullName ||
                (message.sender.role === "client" ? "Client" : "Student");

              return (
                <div
                  key={message.id}
                  className={`flex ${isCurrentViewer ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[86%] rounded-2xl px-3 py-2 border ${
                      isCurrentViewer
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-slate-700 border-black/[0.06]"
                    }`}
                  >
                    {!isCurrentViewer && (
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <span
                          className="text-slate-500"
                          style={{ fontSize: "0.62rem", fontWeight: 700 }}
                        >
                          {senderName}
                        </span>
                      <span
                        className="text-slate-400"
                        style={{ fontSize: "0.6rem" }}
                      >
                        {formatMessageTime(message.createdAt)}
                      </span>
                      </div>
                    )}
                    <p style={{ fontSize: "0.72rem", lineHeight: 1.45 }}>{message.message}</p>
                    {isCurrentViewer && (
                      <div className="flex items-center justify-end gap-1 mt-1 text-blue-100">
                        <span style={{ fontSize: "0.6rem" }}>
                          {formatMessageTime(message.createdAt)}
                        </span>
                        {message.isRead ? (
                          <CheckCheck className="w-3 h-3" aria-label="Message read" />
                        ) : (
                          <Check className="w-3 h-3" aria-label="Message sent" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="min-h-[190px] flex items-center justify-center text-center">
              <p className="text-slate-400" style={{ fontSize: "0.78rem" }}>
                No messages yet. Start the discussion.
              </p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 bg-slate-50 rounded-xl border border-black/[0.06] px-3 py-2 focus-within:border-blue-200 focus-within:ring-4 focus-within:ring-blue-50 transition-all">
          <input
            type="text"
            value={messageDraft}
            onChange={(event) => setMessageDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type a message..."
            className="min-w-0 flex-1 bg-transparent text-slate-900 placeholder:text-slate-400 outline-none"
            style={{ fontSize: "0.78rem" }}
          />
          <button
            type="button"
            onClick={handleSendMessage}
            disabled={!messageDraft.trim() || messageSending}
            className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-blue-100 shadow-sm p-5 flex flex-col gap-4">
        <h2 className="text-slate-900 font-bold" style={{ fontSize: "0.95rem" }}>
          Current Action Required
        </h2>
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex flex-col gap-3 flex-1">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-white border border-blue-200 flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4 text-blue-600" />
            </span>
            <span className="text-blue-700 font-bold" style={{ fontSize: "0.9rem" }}>
              {currentAction}
            </span>
          </div>
          {action}
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-black/[0.05] shadow-sm p-5 flex flex-col gap-4">
        <h2 className="text-slate-900 font-bold" style={{ fontSize: "0.95rem" }}>
          Project Partner
        </h2>
        <div className="flex flex-col gap-3">
          {partner ? (
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0 overflow-hidden">
                {partner.avatar ? (
                  <img
                    src={partner.avatar}
                    alt={partner.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span style={{ fontSize: "0.78rem" }}>{partner.initials}</span>
                )}
              </div>
              <div className="min-w-0">
                <p
                  className="text-slate-900 font-semibold truncate"
                  style={{ fontSize: "0.86rem" }}
                >
                  {partner.name}
                </p>
                <p className="text-slate-400" style={{ fontSize: "0.68rem" }}>
                  {partnerRole}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-black/[0.04] rounded-xl p-3">
              <p className="text-slate-400" style={{ fontSize: "0.78rem" }}>
                Partner information is unavailable.
              </p>
            </div>
          )}
        </div>
        <div
          title={lastUpdated}
          className="flex items-center gap-2 text-slate-500 bg-slate-50 rounded-xl p-3 border border-black/[0.04]"
        >
          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span style={{ fontSize: "0.74rem" }}>Last updated {lastActivity}</span>
        </div>
        {profileAction}
      </section>
    </div>
  );
}
