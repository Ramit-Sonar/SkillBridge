import { useRef, useState } from "react";
import { Clock, MessageSquare, Send } from "lucide-react";
import { type ProjectStatus } from "../../data/projects";
import { formatProjectRelativeDate, getProjectOverviewAction } from "./projectPresentation";

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
  project: ProjectOverviewData;
  status: ProjectStatus;
  role: "student" | "client";
  lastUpdated: string;
  action?: React.ReactNode;
  profileAction?: React.ReactNode;
};

type ProjectMessagePreview = {
  id: string;
  senderRole: "student" | "client";
  senderName: string;
  message: string;
  timestamp: string;
};

const projectMessagePreviews: ProjectMessagePreview[] = [
  {
    id: "msg-1",
    senderRole: "client",
    senderName: "Client",
    message: "Please use the brand blue from the reference file for the primary buttons.",
    timestamp: "10:15 AM",
  },
  {
    id: "msg-2",
    senderRole: "student",
    senderName: "Student",
    message: "Got it. I will update the first draft and share the preview today.",
    timestamp: "10:22 AM",
  },
  {
    id: "msg-3",
    senderRole: "client",
    senderName: "Client",
    message: "Can you also make the dashboard cards easier to scan on mobile?",
    timestamp: "11:05 AM",
  },
  {
    id: "msg-4",
    senderRole: "student",
    senderName: "Student",
    message: "Yes, I will adjust the card spacing without changing the layout.",
    timestamp: "11:18 AM",
  },
  {
    id: "msg-5",
    senderRole: "student",
    senderName: "Student",
    message: "Latest files are ready for review in the deliverables tab.",
    timestamp: "1:40 PM",
  },
  {
    id: "msg-6",
    senderRole: "client",
    senderName: "Client",
    message: "Thanks, I will review them and send feedback before evening.",
    timestamp: "2:10 PM",
  },
];

export function ProjectOverview({
  project,
  status,
  role,
  lastUpdated,
  action,
  profileAction,
}: ProjectOverviewProps) {
  const currentAction = getProjectOverviewAction(status, role);
  const partner = project.partner;
  const partnerRole = role === "student" ? "Client" : "Student";
  const lastActivity = formatProjectRelativeDate(lastUpdated);
  const messagesRef = useRef<HTMLElement | null>(null);
  const messageListRef = useRef<HTMLDivElement | null>(null);
  const messageInputRef = useRef<HTMLInputElement | null>(null);
  const [messages, setMessages] = useState(projectMessagePreviews);
  const [messageDraft, setMessageDraft] = useState("");
  const latestMessages = messages.slice(-8);

  const handleMessageClick = () => {
    messagesRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    messagesRef.current?.focus({ preventScroll: true });
    messageInputRef.current?.focus({ preventScroll: true });
  };

  const handleSendMessage = () => {
    const messageText = messageDraft.trim();
    if (!messageText) return;

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: `draft-${Date.now()}`,
        senderRole: role,
        senderName: role === "client" ? "Client" : "Student",
        message: messageText,
        timestamp: new Intl.DateTimeFormat("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }).format(new Date()),
      },
    ]);
    setMessageDraft("");

    window.setTimeout(() => {
      messageListRef.current?.scrollTo({
        top: messageListRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 0);
  };

  return (
    <div className="grid lg:grid-cols-3 gap-4 items-start">
      <section
        ref={messagesRef}
        tabIndex={-1}
        className="bg-white rounded-2xl border border-black/[0.05] shadow-sm p-5 flex flex-col gap-4 outline-none focus:border-blue-200 focus:ring-4 focus:ring-blue-50"
      >
        <h2 className="text-slate-900 font-bold" style={{ fontSize: "0.95rem" }}>
          Project Messages
        </h2>
        <div
          ref={messageListRef}
          className="bg-slate-50 rounded-xl border border-black/[0.04] p-3 max-h-[214px] overflow-y-auto flex flex-col gap-2.5"
        >
          {latestMessages.length > 0 ? (
            latestMessages.map((message) => {
              const isCurrentViewer = message.senderRole === role;

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
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <span
                        className={isCurrentViewer ? "text-blue-50" : "text-slate-500"}
                        style={{ fontSize: "0.62rem", fontWeight: 700 }}
                      >
                        {message.senderName}
                      </span>
                      <span
                        className={isCurrentViewer ? "text-blue-100" : "text-slate-400"}
                        style={{ fontSize: "0.6rem" }}
                      >
                        {message.timestamp}
                      </span>
                    </div>
                    <p style={{ fontSize: "0.72rem", lineHeight: 1.45 }}>{message.message}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="min-h-[190px] flex items-center justify-center text-center">
              <p className="text-slate-400" style={{ fontSize: "0.78rem" }}>
                No messages yet. Start discussing your project.
              </p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 bg-slate-50 rounded-xl border border-black/[0.06] px-3 py-2 focus-within:border-blue-200 focus-within:ring-4 focus-within:ring-blue-50 transition-all">
          <input
            ref={messageInputRef}
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
            disabled={!messageDraft.trim()}
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
          <button
            type="button"
            onClick={handleMessageClick}
            className="w-full flex items-center justify-center gap-2 bg-white text-blue-600 font-semibold py-2.5 rounded-xl border border-blue-200 hover:bg-blue-50 transition-colors"
            style={{ fontSize: "0.82rem" }}
          >
            Message
          </button>
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
