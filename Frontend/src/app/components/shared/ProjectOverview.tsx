import { useEffect, useRef, useState } from "react";
import {
  Check,
  CheckCheck,
  Clock,
  Download,
  Paperclip,
  MessageSquare,
  Send,
  X,
} from "lucide-react";
import { type ProjectStatus } from "../../data/projects";
import { formatProjectRelativeDate, getProjectOverviewAction } from "./projectPresentation";
import {
  getProjectMessages,
  markProjectMessageRead,
  sendProjectMessage,
  type ProjectMessage,
} from "../../../services/messageService";
import { joinProjectMessageSocket } from "../../../services/messageSocketService";
import {
  downloadAttachment,
  formatFileSize,
  getFileIcon,
  isValidAttachmentUrl,
  truncateFileName,
  type FileAttachment,
} from "../../../utils/fileUtils";
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

const MESSAGE_ATTACHMENT_LIMIT = 3;
const MESSAGE_ATTACHMENT_SIZE_LIMIT = 20 * 1024 * 1024;
const MESSAGE_ATTACHMENT_ACCEPT =
  ".pdf,.png,.jpg,.jpeg,.gif,.webp,.txt,.zip,.doc,.docx,.ppt,.pptx,.xls,.xlsx";

type MessageAttachmentDraft = {
  file: File;
  name: string;
  size: number;
  type: string;
};

const isImageAttachment = (attachment: FileAttachment) =>
  attachment.mimeType?.toLowerCase().startsWith("image/");

const isPdfAttachment = (attachment: FileAttachment) =>
  attachment.mimeType?.toLowerCase() === "application/pdf";

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
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);
  const mountedRef = useRef(false);
  const messagesSnapshotRef = useRef<ProjectMessage[]>([]);
  const socketErrorNotifiedRef = useRef(false);
  const [messages, setMessages] = useState<ProjectMessage[]>([]);
  const [messageDraft, setMessageDraft] = useState("");
  const [messageAttachments, setMessageAttachments] = useState<MessageAttachmentDraft[]>([]);
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

  const upsertDiscussionMessage = (nextMessage: ProjectMessage) => {
    if (nextMessage.project !== projectId) return messagesSnapshotRef.current;

    const currentMessages = messagesSnapshotRef.current;
    const existingMessage = currentMessages.find((message) => message.id === nextMessage.id);
    const nextMessages = existingMessage
      ? currentMessages.map((message) => (message.id === nextMessage.id ? nextMessage : message))
      : [...currentMessages, nextMessage];

    setDiscussionMessages(nextMessages);
    return nextMessages;
  };

  const markUnreadReceivedMessages = async (nextMessages: ProjectMessage[]) => {
    const unreadMessages = nextMessages.filter(
      (message) => message.sender.role !== role && !message.isRead
    );

    if (unreadMessages.length === 0) return;

    try {
      await Promise.all(unreadMessages.map((message) => markProjectMessageRead(message.id)));

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
    socketErrorNotifiedRef.current = false;

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

    fetchMessages();
    const cleanupSocket = joinProjectMessageSocket(projectId, {
      onMessageCreated(message) {
        if (!mountedRef.current || message.project !== projectId) return;

        setMessagesError("");
        const nextMessages = upsertDiscussionMessage(message);
        markUnreadReceivedMessages(nextMessages);
        scrollMessagesToBottom();
      },
      onMessageRead(message) {
        if (!mountedRef.current || message.project !== projectId) return;

        upsertDiscussionMessage(message);
      },
      onConnectionError(message) {
        if (socketErrorNotifiedRef.current) return;

        socketErrorNotifiedRef.current = true;
        onNotify?.({
          type: "error",
          text: message || "Live message connection failed.",
        });
      },
    });

    return () => {
      mountedRef.current = false;
      cleanupSocket();
    };
  }, [projectId, onNotify]);

  const handleSendMessage = async () => {
    const messageText = messageDraft.trim();
    const attachments = messageAttachments.map((attachment) => attachment.file);
    if ((!messageText && attachments.length === 0) || messageSending) return;

    setMessageSending(true);

    try {
      const response = await sendProjectMessage(projectId, messageText, attachments);
      setMessageDraft("");
      setMessageAttachments([]);
      upsertDiscussionMessage(response.data);
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

  const handleAddMessageFiles = (files: FileList | null) => {
    if (!files || messageSending) return;

    const nextAttachments = [...messageAttachments];

    Array.from(files).forEach((file) => {
      if (nextAttachments.length >= MESSAGE_ATTACHMENT_LIMIT) return;

      const isDuplicate = nextAttachments.some((attachment) => attachment.name === file.name);

      if (isDuplicate) return;

      if (file.size > MESSAGE_ATTACHMENT_SIZE_LIMIT) {
        onNotify?.({
          type: "error",
          text: `${file.name} is larger than 20 MB.`,
        });
        return;
      }

      nextAttachments.push({
        file,
        name: file.name,
        size: file.size,
        type: file.type || "application/octet-stream",
      });
    });

    setMessageAttachments(nextAttachments);
  };

  const removeMessageAttachment = (fileName: string) => {
    setMessageAttachments((currentAttachments) =>
      currentAttachments.filter((attachment) => attachment.name !== fileName)
    );
  };

  const handleDownloadMessageAttachment = async (attachment: FileAttachment) => {
    try {
      await downloadAttachment(attachment);
    } catch (error) {
      onNotify?.({
        type: "error",
        text: error instanceof Error ? error.message : "Attachment could not be downloaded.",
      });
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
              const attachments = message.attachments ?? [];
              const isImageOnlyMessage =
                !message.message &&
                attachments.length > 0 &&
                attachments.every(
                  (attachment) =>
                    isValidAttachmentUrl(attachment.url) && isImageAttachment(attachment)
                );

              return (
                <div
                  key={message.id}
                  className={`flex ${isCurrentViewer ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={
                      isImageOnlyMessage
                        ? "max-w-[78%]"
                        : `max-w-[86%] rounded-2xl px-3 py-2 border ${
                            isCurrentViewer
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white text-slate-700 border-black/[0.06]"
                          }`
                    }
                  >
                    {!isCurrentViewer && (
                      <div
                        className={`flex items-center justify-between gap-3 ${
                          isImageOnlyMessage ? "mb-1 px-1" : "mb-1"
                        }`}
                      >
                        <span
                          className="text-slate-500"
                          style={{ fontSize: "0.62rem", fontWeight: 700 }}
                        >
                          {senderName}
                        </span>
                        <span className="text-slate-400" style={{ fontSize: "0.6rem" }}>
                          {formatMessageTime(message.createdAt)}
                        </span>
                      </div>
                    )}
                    {message.message && (
                      <p style={{ fontSize: "0.72rem", lineHeight: 1.45 }}>{message.message}</p>
                    )}
                    {attachments.length > 0 && (
                      <div className={`${message.message ? "mt-2" : ""} flex flex-col gap-1.5`}>
                        {attachments.map((attachment) => {
                          const fileDisplay = getFileIcon(attachment.mimeType);
                          const Icon = fileDisplay.icon;
                          const hasValidUrl = isValidAttachmentUrl(attachment.url);
                          const isImage = isImageAttachment(attachment);
                          const isPdf = isPdfAttachment(attachment);
                          const previewUrl = attachment.url || "";

                          if (hasValidUrl && isImage) {
                            return (
                              <div
                                key={`${message.id}-${attachment.originalName}-${attachment.url}`}
                                className="relative w-64 max-w-full overflow-hidden rounded-2xl bg-slate-100 shadow-sm"
                              >
                                <a
                                  href={previewUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block"
                                  title={attachment.originalName || "Image attachment"}
                                >
                                  <img
                                    src={previewUrl}
                                    alt={attachment.originalName || "Image attachment"}
                                    loading="lazy"
                                    className="max-h-60 min-h-32 w-full object-cover"
                                  />
                                </a>
                                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/70 via-black/35 to-transparent px-2.5 pb-2 pt-5 text-white">
                                  <span style={{ fontSize: "0.62rem" }}>
                                    {formatFileSize(attachment.size)}
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleDownloadMessageAttachment(attachment)}
                                      className="flex h-6 w-6 items-center justify-center rounded-md text-white transition-colors hover:bg-white/15"
                                      aria-label={`Download ${attachment.originalName || "attachment"}`}
                                      title="Download attachment"
                                    >
                                      <Download className="h-3.5 w-3.5" />
                                    </button>
                                    {isImageOnlyMessage && isCurrentViewer && (
                                      <>
                                        <span style={{ fontSize: "0.6rem" }}>
                                          {formatMessageTime(message.createdAt)}
                                        </span>
                                        {message.isRead ? (
                                          <CheckCheck
                                            className="h-3 w-3"
                                            aria-label="Message read"
                                          />
                                        ) : (
                                          <Check className="h-3 w-3" aria-label="Message sent" />
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          if (hasValidUrl && isPdf) {
                            return (
                              <div
                                key={`${message.id}-${attachment.originalName}-${attachment.url}`}
                                className={`w-52 max-w-full overflow-hidden rounded-xl border ${
                                  isCurrentViewer
                                    ? "border-white/20 bg-white/10"
                                    : "border-slate-200 bg-white"
                                }`}
                              >
                                <div className="relative h-28 w-full overflow-hidden bg-white">
                                  <iframe
                                    src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                                    title={attachment.originalName || "PDF attachment"}
                                    className="h-full w-full pointer-events-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      window.open(previewUrl, "_blank", "noopener,noreferrer")
                                    }
                                    className="absolute inset-0"
                                    aria-label={`Open ${attachment.originalName || "PDF attachment"}`}
                                    title={attachment.originalName || "PDF attachment"}
                                  />
                                </div>
                                <div
                                  className={`flex items-center justify-between gap-2 px-2 py-1.5 ${
                                    isCurrentViewer ? "text-blue-100" : "text-slate-500"
                                  }`}
                                >
                                  <span className="font-semibold" style={{ fontSize: "0.58rem" }}>
                                    PDF - {formatFileSize(attachment.size)}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadMessageAttachment(attachment)}
                                    className={`flex h-6 w-6 items-center justify-center rounded-md transition-colors ${
                                      isCurrentViewer
                                        ? "text-white hover:bg-white/15"
                                        : "text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                                    }`}
                                    aria-label={`Download ${attachment.originalName || "attachment"}`}
                                    title="Download attachment"
                                  >
                                    <Download className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={`${message.id}-${attachment.originalName}-${attachment.url}`}
                              className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 ${
                                isCurrentViewer
                                  ? "border-white/20 bg-white/10 text-white"
                                  : "border-slate-200 bg-slate-50 text-slate-700"
                              } ${hasValidUrl ? "" : "opacity-70"}`}
                            >
                              <Icon
                                className="h-3.5 w-3.5 shrink-0"
                                style={{ color: isCurrentViewer ? "#DBEAFE" : fileDisplay.color }}
                              />
                              <span
                                className="min-w-0 flex-1 truncate font-semibold"
                                title={attachment.originalName}
                                style={{ fontSize: "0.66rem" }}
                              >
                                {truncateFileName(attachment.originalName, 26)}
                              </span>
                              <span
                                className={isCurrentViewer ? "text-blue-100" : "text-slate-400"}
                                style={{ fontSize: "0.58rem" }}
                              >
                                {formatFileSize(attachment.size)}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDownloadMessageAttachment(attachment)}
                                disabled={!hasValidUrl}
                                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                                  isCurrentViewer
                                    ? "text-white hover:bg-white/15"
                                    : "text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                                }`}
                                aria-label={`Download ${attachment.originalName || "attachment"}`}
                                title="Download attachment"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {isCurrentViewer && !isImageOnlyMessage && (
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
        {messageAttachments.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {messageAttachments.map((attachment) => {
              const fileDisplay = getFileIcon(attachment.type);
              const Icon = fileDisplay.icon;

              return (
                <span
                  key={attachment.name}
                  className="flex max-w-full items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-slate-600"
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: fileDisplay.color }} />
                  <span
                    className="truncate font-semibold"
                    title={attachment.name}
                    style={{ fontSize: "0.66rem" }}
                  >
                    {truncateFileName(attachment.name, 24)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeMessageAttachment(attachment.name)}
                    disabled={messageSending}
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={`Remove ${attachment.name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              );
            })}
          </div>
        )}
        <div className="flex items-center gap-2 bg-slate-50 rounded-xl border border-black/[0.06] px-3 py-2 focus-within:border-blue-200 focus-within:ring-4 focus-within:ring-blue-50 transition-all">
          <input
            ref={attachmentInputRef}
            type="file"
            multiple
            accept={MESSAGE_ATTACHMENT_ACCEPT}
            className="hidden"
            disabled={messageSending || messageAttachments.length >= MESSAGE_ATTACHMENT_LIMIT}
            onChange={(event) => {
              handleAddMessageFiles(event.target.files);
              event.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => attachmentInputRef.current?.click()}
            disabled={messageSending || messageAttachments.length >= MESSAGE_ATTACHMENT_LIMIT}
            className="w-8 h-8 rounded-xl text-slate-500 flex items-center justify-center shrink-0 hover:bg-white hover:text-blue-600 disabled:text-slate-300 disabled:cursor-not-allowed transition-colors"
            aria-label="Attach files"
            title="Attach files"
          >
            <Paperclip className="w-3.5 h-3.5" />
          </button>
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
            disabled={(!messageDraft.trim() && messageAttachments.length === 0) || messageSending}
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
