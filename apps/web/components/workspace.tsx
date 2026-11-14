"use client";
import { useEffect, useRef, useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowUp,
  ArrowUpRight,
  AudioLines,
  Bell,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Copy,
  Download,
  FileText,
  FolderKanban,
  HelpCircle,
  LayoutGrid,
  LogOut,
  Menu,
  MessageSquare,
  MoreHorizontal,
  PanelLeftClose,
  Paperclip,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Square,
  Sun,
  Users,
  X,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { Button } from "./ui/button";
import { api, downloadText } from "@/lib/api";
import { translations, type Language } from "@/lib/i18n";

const client = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
});
export default function Workspace() {
  return (
    <QueryClientProvider client={client}>
      <App />
    </QueryClientProvider>
  );
}
type Row = Record<string, any>;
type View =
  | "chat"
  | "projects"
  | "documents"
  | "outreach"
  | "assistant"
  | "customize"
  | "profile"
  | "audit"
  | "help";
const titleSchema = z.object({
  title: z.string().min(1, "Enter a title").max(200),
});
function Brand() {
  return (
    <div className="brand">
      <div className="brand-mark">ब</div>
      <span>
        Brahma<span className="muted-brand">GPT</span>
        <small>BY SINGULARITY</small>
      </span>
    </div>
  );
}

function App() {
  const qc = useQueryClient();
  const me = useQuery<Row>({ queryKey: ["me"], queryFn: () => api("/me") });
  const [view, setView] = useState<View>("chat"),
    [mode, setMode] = useState("chat"),
    [collapsed, setCollapsed] = useState(false),
    [chatId, setChatId] = useState<number | null>(() => {
      if (typeof window === "undefined") return null;
      const id = new URLSearchParams(window.location.search).get("chat");
      return id && /^\d+$/.test(id) ? Number(id) : null;
    }),
    [searchChats, setSearchChats] = useState(""),
    [notificationOpen, setNotificationOpen] = useState(false),
    [chatMenu, setChatMenu] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const language = (me.data?.preferences?.language || "en") as Language;
  const theme = me.data?.preferences?.theme || "system";
  const t = translations[language];
  const signed = !!me.data;
  const chats = useQuery<Row[]>({
    queryKey: ["conversations"],
    queryFn: () => api("/conversations"),
    enabled: signed,
  });
  const notifications = useQuery<Row[]>({
    queryKey: ["notifications"],
    queryFn: () => api("/notifications"),
    enabled: signed,
    refetchInterval: 30000,
  });
  const caps = useQuery<Row>({
    queryKey: ["capabilities"],
    queryFn: () => api("/capabilities"),
    enabled: signed,
  });
  const users = useQuery<Row[]>({
    queryKey: ["users"],
    queryFn: () => api("/users"),
    enabled: signed,
  });
  const docs = useQuery<Row[]>({
    queryKey: ["documents"],
    queryFn: () => api("/documents"),
    enabled: signed,
  });
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dataset.theme = theme;
  }, [language, theme]);
  async function run(fn: () => Promise<unknown>, message = "") {
    setBusy(true);
    setError("");
    try {
      await fn();
      await qc.invalidateQueries();
      if (message) setNotice(message);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Operation failed");
    } finally {
      setBusy(false);
    }
  }
  async function changePreference(lang: Language, nextTheme = theme) {
    await run(() =>
      api("/me/preferences", "PUT", {
        language: lang,
        theme: nextTheme,
        pinned_tools: me.data?.preferences?.pinned_tools || [],
        notifications: me.data?.preferences?.notifications !== false,
      }),
    );
  }
  async function newChat() {
    await run(async () => {
      const chat = await api("/conversations", "POST");
      setChatId(chat.id);
      setView("chat");
      setMode("chat");
    });
  }
  const shared = {
    run,
    busy,
    t,
    user: me.data || {},
    users: users.data || [],
    caps: caps.data || {},
    language,
  };
  if (me.isPending) return <div className="loading">Opening BrahmaGPT…</div>;
  if (!signed) return <Login onLogin={() => qc.invalidateQueries()} />;
  const nav = [
    { key: "projects", label: t.projects, icon: FolderKanban },
    { key: "customize", label: t.customize, icon: Settings2 },
    { key: "documents", label: t.documents, icon: FileText },
    { key: "outreach", label: t.outreach, icon: AudioLines },
    { key: "assistant", label: t.assistant, icon: Sparkles },
  ] as const;
  const selected = chats.data?.find((x) => x.id === chatId);
  return (
    <div className={`app-shell ${collapsed ? "collapsed" : ""}`}>
      <aside className="sidebar">
        <div className="sidebar-head">
          <Brand />
          <button
            className="icon-button collapse"
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
            onClick={() => setCollapsed(!collapsed)}
          >
            <PanelLeftClose size={18} />
          </button>
        </div>
        <div className="workspace-label">
          WORKSPACE <span>D–36</span>
        </div>
        <nav aria-label="Workspace">
          {nav.map((item) => (
            <button
              title={item.label}
              key={item.key}
              className={`nav-item ${view === item.key ? "active" : ""}`}
              onClick={() => {
                setView(item.key);
                if (window.innerWidth <= 580) setCollapsed(false);
              }}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
              {item.key === "assistant" && (
                <span className="tiny-badge">AI</span>
              )}
            </button>
          ))}
        </nav>
        <div className="chat-nav">
          <Button
            className="new-chat"
            variant="outline"
            onClick={newChat}
            aria-label={t.newChat}
          >
            <Plus size={17} />
            <span>{t.newChat}</span>
            <kbd>＋</kbd>
          </Button>
          <label className="chat-search">
            <Search size={16} />
            <input
              aria-label={t.searchChats}
              placeholder={t.searchChats}
              value={searchChats}
              onChange={(e) => setSearchChats(e.target.value)}
            />
          </label>
          {["pinned", "recent"].map((group) => (
            <div key={group} className="chat-group">
              <div className="section-label">
                {group === "pinned" ? t.pinned : t.recent}
              </div>
              {chats.data
                ?.filter(
                  (c) =>
                    !c.archived &&
                    (group === "pinned" ? c.pinned : !c.pinned) &&
                    c.title.toLowerCase().includes(searchChats.toLowerCase()),
                )
                .map((c) => (
                  <button
                    key={c.id}
                    className={`chat-item ${view === "chat" && chatId === c.id ? "selected" : ""}`}
                    onClick={() => {
                      setChatId(c.id);
                      setView("chat");
                      setMode("chat");
                    }}
                  >
                    <MessageSquare size={14} />
                    <span>{c.title}</span>
                  </button>
                ))}
              {group === "recent" && !chats.data?.length && (
                <p className="sidebar-empty">
                  Your conversations will appear here.
                </p>
              )}
            </div>
          ))}
        </div>
        <div className="sidebar-bottom">
          <div className="private-note">
            <ShieldCheck size={15} />
            <span>Human decisions. Assisted by AI.</span>
          </div>
          <button className="profile-button" onClick={() => setView("profile")}>
            <span className="avatar">
              {me.data.name
                .split(" ")
                .map((n: string) => n[0])
                .join("")}
            </span>
            <span>
              <strong>{me.data.name}</strong>
              <small>{me.data.designation}</small>
            </span>
            <ChevronDown size={14} />
          </button>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button"
              aria-label="Toggle sidebar"
              onClick={() => setCollapsed(!collapsed)}
            >
              <Menu size={18} />
            </button>
            <span>Workspace</span>
            <ChevronRight size={14} />
            <strong>
              {view === "chat"
                ? "Brahma"
                : nav.find((x) => x.key === view)?.label || view}
            </strong>
          </div>
          <div className="top-actions">
            {caps.data?.demo && (
              <span className="demo-pill">
                <i />
                {t.demo}
              </span>
            )}
            <select
              className="language-select"
              aria-label={t.language}
              value={language}
              onChange={(e) => changePreference(e.target.value as Language)}
            >
              <option value="en">EN</option>
              <option value="as">অসমীয়া</option>
              <option value="hi">हिन्दी</option>
            </select>
            <button
              className="icon-button notification-button"
              title={t.notifications}
              aria-label={t.notifications}
              onClick={() => setNotificationOpen(!notificationOpen)}
            >
              <Bell size={18} />
              {!!notifications.data?.filter((x) => !x.read).length && (
                <span className="notification-count">
                  {notifications.data.filter((x) => !x.read).length}
                </span>
              )}
            </button>
            <button
              className="icon-button hide-mobile"
              title="Change theme"
              aria-label="Change theme"
              onClick={() =>
                changePreference(language, theme === "dark" ? "light" : "dark")
              }
            >
              <Sun size={18} />
            </button>
            <button
              className="icon-button"
              title={t.help}
              aria-label={t.help}
              onClick={() => setView("help")}
            >
              <HelpCircle size={18} />
            </button>
            <span className="avatar small-avatar">{me.data.name[0]}</span>
          </div>
        </header>
        {error && (
          <div className="alert error" role="alert">
            {error}
            <button aria-label="Dismiss error" onClick={() => setError("")}>
              <X size={16} />
            </button>
          </div>
        )}
        {notice && (
          <div className="alert success" role="status">
            {notice}
            <button aria-label="Dismiss notice" onClick={() => setNotice("")}>
              <X size={16} />
            </button>
          </div>
        )}
        {notificationOpen && (
          <section className="notification-panel">
            <div className="panel-heading">
              <h3>{t.notifications}</h3>
              <button
                onClick={() => run(() => api("/notifications/read", "POST"))}
              >
                Mark all read
              </button>
            </div>
            {notifications.data?.length ? (
              notifications.data.map((n) => (
                <button
                  className={`notification-row ${n.read ? "" : "unread"}`}
                  key={n.id}
                  onClick={() =>
                    run(async () => {
                      await api(`/notifications/${n.id}/read`, "POST");
                      setNotificationOpen(false);
                      if (n.resource.startsWith("document"))
                        setView("documents");
                      else if (n.resource.startsWith("conversation")) {
                        setView("chat");
                        setChatId(Number(n.resource.split(":")[1]));
                      } else setView("assistant");
                    })
                  }
                >
                  <span>{n.title}</span>
                  <small>{new Date(n.created_at + "Z").toLocaleString()}</small>
                </button>
              ))
            ) : (
              <Empty text="You're all caught up." />
            )}
          </section>
        )}
        {view === "chat" ? (
          <>
            <div className="workspace-toolbar">
              <div className="mode-switch">
                <button
                  className={mode === "chat" ? "active" : ""}
                  onClick={() => setMode("chat")}
                >
                  <MessageSquare size={15} />
                  {t.chat}
                </button>
                <button
                  className={mode === "work" ? "active" : ""}
                  onClick={() => setMode("work")}
                >
                  <LayoutGrid size={15} />
                  {t.work}
                </button>
              </div>
              <div className="conversation-actions">
                <span className="model-status">
                  <i />
                  {caps.data?.model || "Connect an AI model"}
                </span>
                {chatId && (
                  <>
                    <button
                      className="button ghost small"
                      onClick={() => {
                        const email = prompt(
                          "Share with an existing department account (email)",
                        );
                        if (email)
                          run(
                            () =>
                              api(`/conversations/${chatId}/share`, "POST", {
                                email,
                              }),
                            "Conversation shared. Sign-in and source permissions are required.",
                          );
                      }}
                    >
                      <Users size={16} />
                      Share
                    </button>
                    <div className="menu-wrap">
                      <button
                        aria-label="Conversation options"
                        className="icon-button"
                        onClick={() => setChatMenu(!chatMenu)}
                      >
                        <MoreHorizontal size={19} />
                      </button>
                      {chatMenu && (
                        <div className="dropdown">
                          {[
                            {
                              label: "Rename",
                              action: () => {
                                const title = prompt(
                                  "Conversation title",
                                  selected?.title,
                                );
                                if (title)
                                  run(() =>
                                    api(`/conversations/${chatId}`, "PATCH", {
                                      title,
                                    }),
                                  );
                              },
                            },
                            {
                              label: selected?.pinned ? "Unpin" : "Pin",
                              action: () =>
                                run(() =>
                                  api(`/conversations/${chatId}`, "PATCH", {
                                    pinned: !selected?.pinned,
                                  }),
                                ),
                            },
                            {
                              label: "Archive",
                              action: () =>
                                run(async () => {
                                  await api(
                                    `/conversations/${chatId}`,
                                    "PATCH",
                                    { archived: true },
                                  );
                                  setChatId(null);
                                }),
                            },
                            {
                              label: "Export conversation",
                              action: () =>
                                run(async () => {
                                  const rows = await api<Row[]>(
                                    `/conversations/${chatId}/messages`,
                                  );
                                  downloadText(
                                    "conversation.md",
                                    rows
                                      .map((x) => `## ${x.role}\n${x.content}`)
                                      .join("\n\n"),
                                  );
                                }),
                            },
                          ].map((item) => (
                            <button
                              key={item.label}
                              onClick={() => {
                                item.action();
                                setChatMenu(false);
                              }}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
            {mode === "chat" ? (
              <Chat
                {...shared}
                chatId={chatId}
                setChatId={setChatId}
                docs={docs.data || []}
                onDocuments={() => setView("documents")}
              />
            ) : (
              <Work {...shared} />
            )}
          </>
        ) : view === "documents" ? (
          <Documents {...shared} docs={docs.data || []} />
        ) : view === "projects" ? (
          <Projects {...shared} />
        ) : view === "assistant" ? (
          <Work {...shared} />
        ) : view === "outreach" ? (
          <Outreach {...shared} />
        ) : view === "customize" ? (
          <Customize
            {...shared}
            theme={theme}
            changePreference={changePreference}
          />
        ) : view === "profile" ? (
          <Profile
            {...shared}
            onLogout={() =>
              run(async () => {
                await api("/auth/logout", "POST");
                qc.clear();
                window.location.reload();
              })
            }
            onAudit={() => setView("audit")}
          />
        ) : view === "audit" ? (
          <Audit />
        ) : (
          <Help caps={caps.data || {}} />
        )}
        <footer className="app-footer">
          <span>
            Singularity <span className="footer-dot">·</span> BrahmaGPT D–36
          </span>
          <span>
            Fictional demonstration data. No Government of Assam endorsement.
          </span>
        </footer>
      </main>
    </div>
  );
}

function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("employee@demo.invalid"),
    [password, setPassword] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [token, setToken] = useState(""),
    [reset, setReset] = useState(false);
  async function submit(demo: boolean) {
    setBusy(true);
    setError("");
    try {
      await api(
        demo ? "/auth/demo" : "/auth/login",
        "POST",
        demo ? { email } : { email, password },
      );
      onLogin();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="login-page">
      <div className="login-story">
        <Brand />
        <div>
          <span className="eyebrow">A WORKSPACE FOR WHAT MATTERS</span>
          <h1>
            Clarity in every
            <br />
            conversation.
            <br />
            <em>Progress in every task.</em>
          </h1>
          <p>
            Your documents, projects, and administrative work.
            <br />
            Connected in one thoughtful workspace.
          </p>
        </div>
        <span>Developed by Singularity · Project D–36</span>
      </div>
      <div className="login-form">
        <span className="demo-pill">
          <i />
          Demonstration Environment
        </span>
        <h2>Welcome to BrahmaGPT</h2>
        <p>Use a fictional demo account to explore the workspace.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(false);
          }}
        >
          <label>
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <Button disabled={busy} type="submit">
            Sign in
          </Button>
          <Button
            disabled={busy}
            type="button"
            variant="outline"
            onClick={() => submit(true)}
          >
            Enter demonstration <ArrowUpRight size={16} />
          </Button>
        </form>
        <label>
          Demo role
          <select value={email} onChange={(e) => setEmail(e.target.value)}>
            {[
              "employee",
              "manager",
              "approver",
              "admin",
              "auditor",
              "other",
            ].map((role) => (
              <option key={role} value={`${role}@demo.invalid`}>
                {role}
              </option>
            ))}
          </select>
        </label>
        <button className="text-button" onClick={() => setReset(!reset)}>
          Reset password
        </button>
        {reset && (
          <div className="card">
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const result = await api("/auth/reset-request", "POST", {
                    email,
                  });
                  setError(result.message);
                  if (result.demo_reset_token)
                    setToken(result.demo_reset_token);
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              Request reset
            </Button>
            <input
              aria-label="Reset token"
              placeholder="Reset token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
            <Button
              onClick={async () => {
                try {
                  await api("/auth/reset", "POST", { token, password });
                  setError("Password reset. Sign in using your new password.");
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              Set password above (12+ characters)
            </Button>
          </div>
        )}
        {error && (
          <p role="alert" className="error-text">
            {error}
          </p>
        )}
        <small>
          Fictional employees and records. No official endorsement.
          <br />
          Live deployment requires authorised identity and security
          configuration.
        </small>
      </div>
    </div>
  );
}
type Shared = {
  run: (fn: () => Promise<unknown>, message?: string) => Promise<void>;
  busy: boolean;
  t: typeof translations.en;
  user: Row;
  users: Row[];
  caps: Row;
  language: Language;
};
function Empty({ text }: { text: string }) {
  return (
    <div className="empty-state">
      <FileText size={25} />
      <p>{text}</p>
    </div>
  );
}
function PageHead({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-head">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {children}
    </div>
  );
}

function Chat({
  chatId,
  setChatId,
  docs,
  onDocuments,
  ...props
}: Shared & {
  chatId: number | null;
  setChatId: (id: number) => void;
  docs: Row[];
  onDocuments: () => void;
}) {
  const { run, t, language, caps } = props;
  const qc = useQueryClient();
  const [input, setInput] = useState(""),
    [selectedDocs, setSelectedDocs] = useState<number[]>([]),
    [sending, setSending] = useState(false),
    [partial, setPartial] = useState(""),
    [sourcePanel, setSourcePanel] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const history = useQuery<Row[]>({
    queryKey: ["messages", chatId],
    queryFn: () => api(`/conversations/${chatId}/messages`),
    enabled: !!chatId,
  });
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [history.data, partial]);
  async function send(text = input) {
    if (!text.trim() || sending) return;
    setSending(true);
    setPartial("");
    controller.current = new AbortController();
    await run(async () => {
      let id = chatId;
      if (!id) {
        const chat = await api("/conversations", "POST");
        id = chat.id;
        setChatId(chat.id);
      }
      const response = await fetch(`/api/conversations/${id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Brahma-Client": "web",
        },
        body: JSON.stringify({
          content: text,
          document_ids: selectedDocs,
          language,
        }),
        signal: controller.current!.signal,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Generation failed");
      }
      setInput("");
      const reader = response.body!.getReader(),
        decoder = new TextDecoder();
      let pending = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        pending += decoder.decode(value, { stream: true });
        const lines = pending.split("\n");
        pending = lines.pop()!;
        for (const line of lines) {
          if (!line) continue;
          const event = JSON.parse(line);
          if (event.type === "delta") setPartial((p) => p + event.text);
        }
      }
      await qc.invalidateQueries({ queryKey: ["messages", id] });
    });
    setPartial("");
    setSending(false);
  }
  const hasMessages = !!history.data?.length;
  return (
    <div className={`chat-workspace ${hasMessages ? "has-messages" : ""}`}>
      <div className="chat-scroll">
        {hasMessages ? (
          <div className="message-list">
            {history.data?.map((message) => (
              <article key={message.id} className={`message ${message.role}`}>
                <div className="message-avatar">
                  {message.role === "assistant" ? (
                    <Sparkles size={18} />
                  ) : (
                    props.user.name[0]
                  )}
                </div>
                <div className="message-body">
                  <div className="message-label">
                    {message.role === "assistant" ? "Brahma" : props.user.name}
                    {message.role === "assistant" && (
                      <span>AI-generated draft</span>
                    )}
                  </div>
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                  {message.citations?.length > 0 && (
                    <div className="citations">
                      <small>
                        Retrieved source passages · verify against the draft
                      </small>
                      {message.citations.map((c: Row) => (
                        <details key={c.chunk_id}>
                          <summary>
                            <FileText size={13} /> {c.title} ·{" "}
                            {c.page ? `p. ${c.page}` : "page unavailable"}
                          </summary>
                          <p>{c.passage}</p>
                          <a
                            href={`/api/documents/${c.document_id}/download?version=${c.version_number || 1}`}
                          >
                            Download referenced version
                          </a>
                        </details>
                      ))}
                    </div>
                  )}
                  <div className="message-actions">
                    <button
                      title="Copy"
                      onClick={() =>
                        run(
                          () => navigator.clipboard.writeText(message.content),
                          "Copied response.",
                        )
                      }
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      title="Export"
                      onClick={() =>
                        downloadText("brahma-response.md", message.content)
                      }
                    >
                      <Download size={14} />
                    </button>
                    {message.role === "assistant" && (
                      <button
                        onClick={() =>
                          run(
                            () =>
                              api(
                                `/messages/${message.id}/feedback?value=helpful`,
                                "POST",
                              ),
                            "Feedback recorded.",
                          )
                        }
                        title="Helpful"
                      >
                        <Check size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
            {partial && (
              <article className="message assistant">
                <Sparkles size={18} />
                <div className="message-body">
                  <ReactMarkdown>{partial}</ReactMarkdown>
                </div>
              </article>
            )}
            <div ref={bottom} />
          </div>
        ) : (
          <div className="welcome">
            <div className="welcome-symbol">
              <Sparkles size={31} strokeWidth={1.3} />
            </div>
            <div className="welcome-kicker">
              MEET BRAHMA, YOUR WORK COMPANION
            </div>
            <h1>{t.greeting}</h1>
            <p>{t.subtitle}</p>
            <div className="suggestion-grid">
              <button
                onClick={() =>
                  setInput(
                    "Help me draft an office note using facts I will supply.",
                  )
                }
              >
                <span className="suggestion-icon violet">
                  <FileText size={20} />
                </span>
                <strong>Start with a draft</strong>
                <span>Letters, notes, and reports</span>
                <ArrowUpRight size={15} />
              </button>
              <button
                onClick={() => {
                  setSourcePanel(true);
                  setInput("Find information in my authorised documents.");
                }}
              >
                <span className="suggestion-icon blue">
                  <BookOpen size={20} />
                </span>
                <strong>Find what you need</strong>
                <span>Answers grounded in your files</span>
                <ArrowUpRight size={15} />
              </button>
              <button
                onClick={() =>
                  setInput(
                    "Help me plan the steps for a pension service review.",
                  )
                }
              >
                <span className="suggestion-icon green">
                  <ClipboardList size={20} />
                </span>
                <strong>Make a plan</strong>
                <span>Turn an idea into next steps</span>
                <ArrowUpRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="composer-area">
        {sourcePanel && (
          <div className="source-picker">
            <div className="panel-heading">
              <strong>Ground answers in your files</strong>
              <button
                onClick={() => setSourcePanel(false)}
                aria-label="Close sources"
              >
                <X size={16} />
              </button>
            </div>
            {docs.length ? (
              docs.map((doc) => (
                <label key={doc.id}>
                  <input
                    type="checkbox"
                    checked={selectedDocs.includes(doc.id)}
                    onChange={(e) =>
                      setSelectedDocs(
                        e.target.checked
                          ? [...selectedDocs, doc.id]
                          : selectedDocs.filter((id) => id !== doc.id),
                      )
                    }
                  />
                  {doc.title}
                </label>
              ))
            ) : (
              <p>No files yet. Upload a document to get started.</p>
            )}
            <Button variant="outline" onClick={onDocuments}>
              {t.upload}
            </Button>
          </div>
        )}
        <form
          className="composer"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <textarea
            aria-label="Message Brahma"
            placeholder={t.placeholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <div className="composer-bottom">
            <div>
              <label className="icon-button" title="Attach a document">
                <Paperclip size={18} />
                <input
                  className="sr-only"
                  type="file"
                  aria-label="Attach file"
                  accept=".txt,.csv,.pdf,.docx,.xlsx,.pptx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file)
                      run(async () => {
                        const form = new FormData();
                        form.append("file", file);
                        const doc = await api(
                          "/documents/upload",
                          "POST",
                          form,
                        );
                        setSelectedDocs((x) => [...x, doc.id]);
                        setSourcePanel(true);
                      }, "File ingested. It is now selected as a source.");
                  }}
                />
              </label>
              <button
                type="button"
                className={`tool-chip ${sourcePanel ? "selected" : ""}`}
                onClick={() => setSourcePanel(!sourcePanel)}
              >
                <BookOpen size={14} />
                Sources{selectedDocs.length ? ` (${selectedDocs.length})` : ""}
              </button>
              <span className="composer-model">
                {caps.model || "Model not configured"}
              </span>
            </div>
            {sending ? (
              <button
                type="button"
                className="send-button"
                aria-label="Stop generation"
                onClick={() => {
                  controller.current?.abort();
                  setSending(false);
                }}
              >
                <Square size={15} />
              </button>
            ) : (
              <button
                className="send-button"
                aria-label={t.send}
                disabled={!input.trim()}
              >
                <ArrowUp size={19} />
              </button>
            )}
          </div>
        </form>
        <p className="composer-note">
          {sending
            ? "Request in progress. The configured adapter buffers the model response before streaming."
            : caps.ai === "configured"
              ? "Brahma can make mistakes. Check sources and review all official drafts."
              : "AI configuration required. Connect a model in server settings to receive real answers."}
        </p>
        {hasMessages && (
          <button
            className="text-button regenerate"
            onClick={() =>
              send(
                [...history.data!].reverse().find((x) => x.role === "user")
                  ?.content,
              )
            }
          >
            Regenerate last response
          </button>
        )}
      </div>
    </div>
  );
}

function Documents({ docs, ...props }: Shared & { docs: Row[] }) {
  const { t, run, busy, users } = props;
  const [selected, setSelected] = useState<number | null>(null),
    [tab, setTab] = useState("all"),
    [query, setQuery] = useState(""),
    [results, setResults] = useState<Row[]>([]),
    [showGenerate, setShowGenerate] = useState(false),
    [editText, setEditText] = useState(""),
    [summary, setSummary] = useState(""),
    [editing, setEditing] = useState(false),
    [compare, setCompare] = useState(""),
    [left, setLeft] = useState(1),
    [right, setRight] = useState(2);
  const detail = useQuery<Row>({
    queryKey: ["document", selected],
    queryFn: () => api(`/documents/${selected}`),
    enabled: !!selected,
  });
  const [reviewer, setReviewer] = useState("");
  const filtered = docs.filter((doc) =>
    tab === "mine"
      ? doc.owner_id === props.user.id
      : tab === "department"
        ? doc.visibility === "department"
        : tab === "shared"
          ? doc.owner_id !== props.user.id
          : true,
  );
  return (
    <div className="module-content">
      <PageHead
        eyebrow="KNOWLEDGE & RECORDS"
        title={t.documents}
        description="A reliable home for your files. Every original preserved."
      >
        <div className="button-row">
          <label className="button outline">
            <Paperclip size={16} />
            {t.upload}
            <input
              className="sr-only"
              type="file"
              aria-label={t.upload}
              accept=".txt,.csv,.pdf,.docx,.xlsx,.pptx"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file)
                  run(async () => {
                    const form = new FormData();
                    form.append("file", file);
                    const doc = await api("/documents/upload", "POST", form);
                    setSelected(doc.id);
                  }, "Original uploaded and preserved.");
                e.target.value = "";
              }}
            />
          </label>
          <Button onClick={() => setShowGenerate(!showGenerate)}>
            <Plus size={16} />
            {t.generate}
          </Button>
        </div>
      </PageHead>
      {showGenerate && (
        <GenerateForm
          {...props}
          onCreated={(id) => {
            setSelected(id);
            setShowGenerate(false);
          }}
        />
      )}
      <div className="filter-row">
        <div className="tabs">
          {[
            ["all", "All files"],
            ["mine", "My files"],
            ["shared", "Shared files"],
            ["department", "Department files"],
          ].map(([key, label]) => (
            <button
              className={tab === key ? "active" : ""}
              key={key}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <form
          className="inline-search"
          onSubmit={(e) => {
            e.preventDefault();
            run(async () => {
              const result = await api(
                `/documents/search?q=${encodeURIComponent(query)}`,
              );
              setResults(result.results);
            }, "Search uses permission-filtered extracted text.");
          }}
        >
          <Search size={16} />
          <input
            placeholder="Search document text"
            aria-label="Search documents"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button size="sm" variant="ghost">
            {t.search}
          </Button>
        </form>
      </div>
      {results.length > 0 && (
        <section className="search-results">
          <div className="panel-heading">
            <strong>Matching passages</strong>
            <button onClick={() => setResults([])}>
              <X size={16} />
            </button>
          </div>
          {results.map((result) => (
            <button
              key={result.chunk_id}
              onClick={() => setSelected(result.document_id)}
            >
              <strong>
                {result.title} {result.page ? `· p. ${result.page}` : ""}
              </strong>
              <p>{result.passage}</p>
            </button>
          ))}
        </section>
      )}
      <div className={`document-layout ${selected ? "with-preview" : ""}`}>
        <section className="card file-list">
          <div className="table-head">
            <span>NAME</span>
            <span>STATUS</span>
            <span>VERSION</span>
          </div>
          {filtered.length ? (
            filtered.map((doc) => (
              <button
                className={`file-row ${selected === doc.id ? "selected" : ""}`}
                key={doc.id}
                onClick={() => {
                  setSelected(doc.id);
                  setEditing(false);
                  setCompare("");
                }}
              >
                <span>
                  <span className="file-icon">
                    <FileText size={21} />
                  </span>
                  <span>
                    <strong>{doc.title}</strong>
                    <small>
                      {doc.kind} · {doc.visibility}
                    </small>
                  </span>
                </span>
                <span
                  className={`status-badge ${doc.status === "Approved" ? "green" : ""}`}
                >
                  {doc.status}
                </span>
                <span className="muted">v{doc.latest_version?.number}</span>
              </button>
            ))
          ) : (
            <Empty text={t.noData} />
          )}
        </section>
        {selected && detail.data && (
          <aside className="card document-preview">
            <div className="panel-heading">
              <h3>{detail.data.title}</h3>
              <button
                aria-label="Close preview"
                onClick={() => setSelected(null)}
              >
                <X size={17} />
              </button>
            </div>
            <span className="status-badge">{detail.data.status}</span>
            <div className="button-row compact">
              <a
                className="button outline small"
                href={`/api/documents/${selected}/download`}
              >
                <Download size={14} />
                Download
              </a>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditing(!editing);
                  setEditText(detail.data!.versions[0].text);
                }}
              >
                New revision
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const email = prompt(
                    "Share with existing department account",
                  );
                  if (email)
                    run(
                      () =>
                        api(`/documents/${selected}/share`, "POST", { email }),
                      "Document shared.",
                    );
                }}
              >
                Share
              </Button>
            </div>
            <label>
              Visibility
              <select
                value={detail.data.visibility}
                onChange={(e) =>
                  run(() =>
                    api(`/documents/${selected}`, "PATCH", {
                      visibility: e.target.value,
                    }),
                  )
                }
              >
                <option value="private">Private / explicit shares</option>
                <option value="department">Department</option>
              </select>
            </label>
            <label>
              Tags
              <input
                defaultValue={(detail.data.tags || []).join(", ")}
                key={`tags-${selected}`}
                onBlur={(e) =>
                  run(() =>
                    api(`/documents/${selected}`, "PATCH", {
                      tags: e.target.value
                        .split(",")
                        .map((x) => x.trim())
                        .filter(Boolean),
                    }),
                  )
                }
              />
            </label>
            {editing ? (
              <div className="revision-editor">
                <label>
                  Revised content
                  <textarea
                    rows={12}
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                  />
                </label>
                <label>
                  Change summary
                  <input
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                  />
                </label>
                <Button
                  disabled={busy || !summary.trim()}
                  onClick={() =>
                    run(async () => {
                      await api(`/documents/${selected}/versions`, "POST", {
                        text: editText,
                        summary,
                      });
                      setEditing(false);
                    }, "New version created. The original is unchanged.")
                  }
                >
                  Save new version
                </Button>
              </div>
            ) : (
              <pre className="document-text">
                {detail.data.versions[0]?.text ||
                  "No extractable text. OCR is not configured."}
              </pre>
            )}
            <h4>Approval</h4>
            <label>
              Reviewing officer
              <select
                value={reviewer}
                onChange={(e) => setReviewer(e.target.value)}
              >
                <option value="">Select officer</option>
                {users
                  .filter(
                    (u) =>
                      ["approver", "department_admin", "super_admin"].includes(
                        u.role,
                      ) && u.id !== props.user.id,
                  )
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
              </select>
            </label>
            <Button
              variant="outline"
              disabled={!reviewer || busy}
              onClick={() =>
                run(
                  () =>
                    api(`/documents/${selected}/submit`, "POST", {
                      reviewer_id: Number(reviewer),
                    }),
                  "Submitted for human review.",
                )
              }
            >
              Submit for approval
            </Button>
            <h4>Version history</h4>
            {detail.data.versions.map((version: Row) => (
              <div className="version-row" key={version.id}>
                <strong>v{version.number}</strong>
                <span>
                  {version.change_summary}
                  <small>
                    {new Date(version.created_at + "Z").toLocaleString()} ·
                    Author #{version.author_id}
                  </small>
                </span>
                <a
                  aria-label={`Download version ${version.number}`}
                  href={`/api/documents/${selected}/download?version=${version.number}`}
                >
                  <Download size={15} />
                </a>
              </div>
            ))}
            {detail.data.versions.length > 1 && (
              <>
                <div className="button-row">
                  <select
                    aria-label="Left version"
                    value={left}
                    onChange={(e) => setLeft(Number(e.target.value))}
                  >
                    {detail.data.versions.map((v: Row) => (
                      <option key={v.id} value={v.number}>
                        v{v.number}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label="Right version"
                    value={right}
                    onChange={(e) => setRight(Number(e.target.value))}
                  >
                    {detail.data.versions.map((v: Row) => (
                      <option key={v.id} value={v.number}>
                        v{v.number}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      run(async () => {
                        const result = await api(
                          `/documents/${selected}/compare?left=${left}&right=${right}`,
                        );
                        setCompare(result.diff || "No text differences.");
                      })
                    }
                  >
                    Compare text
                  </Button>
                </div>
                <pre className="diff">{compare}</pre>
              </>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}

function GenerateForm(props: Shared & { onCreated: (id: number) => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ title: string }>({ resolver: zodResolver(titleSchema) });
  const [facts, setFacts] = useState(""),
    [kind, setKind] = useState("Office Note"),
    [format, setFormat] = useState("docx");
  return (
    <form
      className="card form-card"
      onSubmit={handleSubmit((data) =>
        props.run(async () => {
          const doc = await api("/documents/generate", "POST", {
            ...data,
            facts,
            kind,
            format,
          });
          props.onCreated(doc.id);
        }, "Draft generated from supplied facts. Review before official use."),
      )}
    >
      <h3>{props.t.generate}</h3>
      <div className="form-grid">
        <label>
          {props.t.title}
          <input {...register("title")} required />
          {errors.title && (
            <small className="error-text">{errors.title.message}</small>
          )}
        </label>
        <label>
          Document type
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            {[
              "Official Letter",
              "Office Note",
              "Memorandum",
              "Circular",
              "Notice",
              "Report",
              "Meeting Minutes",
              "RTI Response Draft",
            ].map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </label>
        <label>
          Format
          <select value={format} onChange={(e) => setFormat(e.target.value)}>
            {["docx", "pdf", "xlsx", "pptx", "txt", "csv"].map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </label>
      </div>
      <label>
        {props.t.facts}
        <textarea
          required
          rows={5}
          value={facts}
          onChange={(e) => setFacts(e.target.value)}
          placeholder="Supply names, dates, verified facts and relevant source passages. No facts or authorities will be invented."
        />
      </label>
      <p className="muted">
        Template generation uses your facts. It does not use an AI provider.
      </p>
      <Button disabled={props.busy}>{props.t.generate}</Button>
    </form>
  );
}

function Projects(props: Shared) {
  const { run, t, busy } = props;
  const [selected, setSelected] = useState<number | null>(null),
    [create, setCreate] = useState(false),
    [title, setTitle] = useState(""),
    [description, setDescription] = useState(""),
    [email, setEmail] = useState("");
  const rows = useQuery<Row[]>({
    queryKey: ["projects"],
    queryFn: () => api("/projects"),
  });
  const members = useQuery<Row[]>({
    queryKey: ["members", selected],
    queryFn: () => api(`/projects/${selected}/members`),
    enabled: !!selected,
  });
  const meetings = useQuery<Row[]>({
    queryKey: ["meetings", selected],
    queryFn: () => api(`/projects/${selected}/meetings`),
    enabled: !!selected,
  });
  const [meetingTitle, setMeetingTitle] = useState(""),
    [starts, setStarts] = useState(""),
    [link, setLink] = useState(""),
    [transcript, setTranscript] = useState(""),
    [consent, setConsent] = useState(false);
  const project = rows.data?.find((p) => p.id === selected);
  return (
    <div className="module-content">
      <PageHead
        eyebrow="BUILD PROGRESS TOGETHER"
        title={t.projects}
        description="Keep people, tasks, and decisions moving in the same direction."
      >
        <Button onClick={() => setCreate(!create)}>
          <Plus size={16} />
          New project
        </Button>
      </PageHead>
      {create && (
        <form
          className="card form-card"
          onSubmit={(e) => {
            e.preventDefault();
            run(async () => {
              const p = await api("/projects", "POST", { title, description });
              setSelected(p.id);
              setCreate(false);
              setTitle("");
            });
          }}
        >
          <label>
            Project title
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label>
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <Button disabled={busy}>Create project</Button>
        </form>
      )}
      <div className="project-grid">
        {rows.data?.map((p) => (
          <button
            key={p.id}
            className={`card project-card ${selected === p.id ? "selected" : ""}`}
            onClick={() => setSelected(p.id)}
          >
            <div>
              <span className="project-symbol">
                <FolderKanban size={22} />
              </span>
              <span className="status-badge">
                {p.archived ? "Archived" : "Active"}
              </span>
            </div>
            <h3>{p.title}</h3>
            <p>
              {p.description || "A shared space for your team’s next steps."}
            </p>
            <span className="project-foot">
              Open workspace <ArrowUpRight size={15} />
            </span>
          </button>
        ))}
      </div>
      {project && (
        <section className="card form-card">
          <div className="panel-heading">
            <h2>{project.title}</h2>
            <div className="button-row">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const title = prompt("Project title", project.title);
                  if (title)
                    run(() => api(`/projects/${selected}`, "PATCH", { title }));
                }}
              >
                Rename
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  run(() =>
                    api(`/projects/${selected}`, "PATCH", {
                      archived: !project.archived,
                    }),
                  )
                }
              >
                {project.archived ? "Restore" : "Archive"}
              </Button>
            </div>
          </div>
          <h4>Members</h4>
          <div className="member-list">
            {members.data?.map((m) => (
              <span className="member-chip" key={m.id}>
                <span className="avatar small-avatar">{m.user.name[0]}</span>
                {m.user.name}
                <small>{m.role}</small>
              </span>
            ))}
          </div>
          <form
            className="button-row"
            onSubmit={(e) => {
              e.preventDefault();
              run(
                () => api(`/projects/${selected}/members`, "POST", { email }),
                "Member added. Notification delivered in-app.",
              );
            }}
          >
            <input
              type="email"
              required
              aria-label="Member email"
              placeholder="Existing department account email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button variant="outline" disabled={busy}>
              Add member
            </Button>
          </form>
          <Tasks {...props} projectId={selected!} />
          <h3>Internal calendar & meeting notes</h3>
          <p className="muted">
            Internal scheduling with a manual link. No external meeting is
            created.
          </p>
          {meetings.data?.map((m) => (
            <div className="meeting-row" key={m.id}>
              <strong>{m.title}</strong>
              <span>{new Date(m.starts_at + "Z").toLocaleString()}</span>
              {m.link && (
                <a target="_blank" rel="noreferrer" href={m.link}>
                  Meeting link <ArrowUpRight size={13} />
                </a>
              )}
              {m.transcript && (
                <details>
                  <summary>Manual transcript</summary>
                  <p>{m.transcript}</p>
                </details>
              )}
            </div>
          ))}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              run(async () => {
                await api(`/projects/${selected}/meetings`, "POST", {
                  title: meetingTitle,
                  starts_at: new Date(starts).toISOString(),
                  link,
                  transcript,
                  consent,
                });
                setMeetingTitle("");
                setTranscript("");
              }, "Internal meeting saved.");
            }}
          >
            <div className="form-grid">
              <label>
                Meeting title
                <input
                  required
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                />
              </label>
              <label>
                Date and time
                <input
                  type="datetime-local"
                  required
                  value={starts}
                  onChange={(e) => setStarts(e.target.value)}
                />
              </label>
              <label>
                Manual HTTPS meeting link
                <input
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                />
              </label>
            </div>
            <label>
              Manual transcript / notes
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
              />
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              Participants consented to storing this transcript.
            </label>
            <Button disabled={busy}>Save internal meeting</Button>
          </form>
        </section>
      )}
      {!rows.data?.length && <Empty text={t.noData} />}
    </div>
  );
}

function Tasks(props: Shared & { projectId?: number }) {
  const { run, t, busy } = props;
  const rows = useQuery<Row[]>({
    queryKey: ["tasks"],
    queryFn: () => api("/tasks"),
  });
  const projects = useQuery<Row[]>({
    queryKey: ["projects"],
    queryFn: () => api("/projects"),
  });
  const [create, setCreate] = useState(false),
    [title, setTitle] = useState(""),
    [priority, setPriority] = useState("Medium"),
    [owner, setOwner] = useState(String(props.user.id)),
    [project, setProject] = useState(String(props.projectId || "")),
    [due, setDue] = useState(""),
    [reminder, setReminder] = useState(""),
    [filter, setFilter] = useState("All"),
    [history, setHistory] = useState<Row[]>([]);
  const filtered = rows.data?.filter(
    (task) =>
      (!props.projectId || task.project_id === props.projectId) &&
      (filter === "All" || task.status === filter || task.priority === filter),
  );
  return (
    <section className="tasks-section">
      <div className="panel-heading">
        <h3>{t.tasks}</h3>
        <Button size="sm" variant="outline" onClick={() => setCreate(!create)}>
          <Plus size={15} />
          Create task
        </Button>
      </div>
      <div className="tabs task-tabs">
        {[
          "All",
          "High",
          "Medium",
          "Low",
          "Completed",
          "Paused",
          "Cancelled",
        ].map((f) => (
          <button
            className={f === filter ? "active" : ""}
            key={f}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>
      {create && (
        <form
          className="task-form"
          onSubmit={(e) => {
            e.preventDefault();
            run(async () => {
              await api("/tasks", "POST", {
                title,
                priority,
                owner_id: Number(owner),
                project_id: props.projectId || Number(project) || null,
                due_date: due || null,
                reminder_at: reminder ? new Date(reminder).toISOString() : null,
              });
              setTitle("");
              setCreate(false);
            }, "Task created.");
          }}
        >
          <label>
            Task title
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <div className="form-grid">
            <label>
              {t.priority}
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                {["High", "Medium", "Low"].map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </label>
            <label>
              Owner
              <select value={owner} onChange={(e) => setOwner(e.target.value)}>
                {props.users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </label>
            {!props.projectId && (
              <label>
                Project
                <select
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                >
                  <option value="">Personal task</option>
                  {projects.data?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label>
              Due date
              <input
                type="date"
                value={due}
                onChange={(e) => setDue(e.target.value)}
              />
            </label>
            <label>
              Reminder
              <input
                type="datetime-local"
                value={reminder}
                onChange={(e) => setReminder(e.target.value)}
              />
            </label>
          </div>
          <Button disabled={busy}>Create task</Button>
        </form>
      )}
      <div className="task-list">
        {filtered?.length ? (
          filtered.map((task) => (
            <div className="task-row" key={task.id}>
              <button
                className={`task-check ${task.status === "Completed" ? "checked" : ""}`}
                title="Mark completed"
                aria-label={`Complete ${task.title}`}
                onClick={() =>
                  run(() =>
                    api(`/tasks/${task.id}`, "PATCH", {
                      status:
                        task.status === "Completed" ? "To Do" : "Completed",
                    }),
                  )
                }
              >
                {task.status === "Completed" && <Check size={13} />}
              </button>
              <div className="task-name">
                <strong>{task.title}</strong>
                <small>
                  {props.users.find((u) => u.id === task.owner_id)?.name}
                  {task.due_date ? ` · Due ${task.due_date}` : ""}
                </small>
              </div>
              <select
                aria-label={`Priority for ${task.title}`}
                className={`priority ${task.priority.toLowerCase()}`}
                value={task.priority}
                onChange={(e) =>
                  run(() =>
                    api(`/tasks/${task.id}`, "PATCH", {
                      priority: e.target.value,
                    }),
                  )
                }
              >
                {["High", "Medium", "Low"].map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
              <select
                aria-label={`Status for ${task.title}`}
                value={task.status}
                onChange={(e) =>
                  run(() =>
                    api(`/tasks/${task.id}`, "PATCH", {
                      status: e.target.value,
                    }),
                  )
                }
              >
                {[
                  "To Do",
                  "In Progress",
                  "Completed",
                  "Paused",
                  "Cancelled",
                ].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <button
                className="icon-button"
                title="Task history"
                aria-label={`History for ${task.title}`}
                onClick={() =>
                  run(async () =>
                    setHistory(await api(`/tasks/${task.id}/history`)),
                  )
                }
              >
                <MoreHorizontal size={17} />
              </button>
              <button
                className="text-button"
                onClick={() => {
                  const title = prompt("Task title", task.title);
                  if (title)
                    run(() => api(`/tasks/${task.id}`, "PATCH", { title }));
                }}
              >
                Edit
              </button>
            </div>
          ))
        ) : (
          <Empty text="No tasks in this view." />
        )}
      </div>
      {history.length > 0 && (
        <details open className="card">
          <summary>
            Task history <button onClick={() => setHistory([])}>Close</button>
          </summary>
          {history.map((h) => (
            <p key={h.id}>
              {h.action} · {JSON.stringify(h.detail)} ·{" "}
              {new Date(h.created_at + "Z").toLocaleString()}
            </p>
          ))}
        </details>
      )}
    </section>
  );
}

function Work(props: Shared) {
  const stats = useQuery<Row>({
    queryKey: ["analytics"],
    queryFn: () => api("/analytics"),
  });
  const approvals = useQuery<Row[]>({
    queryKey: ["approvals"],
    queryFn: () => api("/approvals"),
  });
  const [commandResult, setCommandResult] = useState("");
  return (
    <div className="module-content">
      <PageHead
        eyebrow="BRAHMA PERSONAL ASSISTANT"
        title={props.t.today}
        description="A little more focus. A clear next step. Progress you can see."
      />
      <div className="stats-grid">
        {[
          ["Active projects", stats.data?.active_projects, FolderKanban],
          ["Pending tasks", stats.data?.pending_tasks, ClipboardList],
          ["Documents", stats.data?.documents, FileText],
          ["Awaiting your review", stats.data?.approvals, ShieldCheck],
        ].map(([label, value, Icon]: any) => (
          <div className="card stat-card" key={label}>
            <span>
              {label}
              <Icon size={18} />
            </span>
            <strong>{value ?? "—"}</strong>
            <small>From your authorised records</small>
          </div>
        ))}
      </div>
      <div className="dashboard-grid">
        <section className="card chart-card">
          <div className="panel-heading">
            <h3>Task progress</h3>
            <span className="status-badge">Live database</span>
          </div>
          <div className="chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.data?.task_statuses || []}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip />
                <Bar dataKey="value" fill="#607c69" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="card focus-card">
          <span className="eyebrow">HUMAN IN CONTROL</span>
          <Sparkles size={25} />
          <h3>
            Make space for
            <br />
            the work that matters.
          </h3>
          <p>
            Use structured assistant commands to inspect tasks. Changes require
            your confirmation.
          </p>
          <div className="button-row">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                props.run(async () =>
                  setCommandResult(
                    JSON.stringify(
                      await api("/assistant/commands", "POST", {
                        action: "list_pending",
                      }),
                      null,
                      2,
                    ),
                  ),
                )
              }
            >
              Show pending tasks
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                props.run(async () =>
                  setCommandResult(
                    JSON.stringify(
                      await api("/assistant/commands", "POST", {
                        action: "daily_summary",
                      }),
                      null,
                      2,
                    ),
                  ),
                )
              }
            >
              Today’s summary
            </Button>
          </div>
        </section>
      </div>
      {commandResult && (
        <pre className="card command-output">{commandResult}</pre>
      )}
      <div className="card form-card">
        <Tasks {...props} />
      </div>
      <section className="card form-card">
        <h3>{props.t.approvals}</h3>
        {approvals.data?.length ? (
          approvals.data.map((a) => (
            <div className="approval-row" key={a.id}>
              <span>
                <strong>Document #{a.document_id}</strong>
                <small>Version record #{a.version_id}</small>
              </span>
              <span className="status-badge">{a.status}</span>
              {a.reviewer_id === props.user.id &&
                ["Submitted", "Under Review"].includes(a.status) && (
                  <div className="button-row">
                    {[
                      "Under Review",
                      "Changes Requested",
                      "Approved",
                      "Rejected",
                    ].map((status) => (
                      <Button
                        key={status}
                        size="sm"
                        variant={status === "Approved" ? "default" : "outline"}
                        onClick={() => {
                          const comment = prompt(
                            `Review decision: ${status}. Add a comment.`,
                          );
                          if (comment !== null)
                            props.run(
                              () =>
                                api(`/approvals/${a.id}/decision`, "POST", {
                                  status,
                                  comment,
                                }),
                              `Decision recorded: ${status}`,
                            );
                        }}
                      >
                        {status}
                      </Button>
                    ))}
                  </div>
                )}
            </div>
          ))
        ) : (
          <Empty text="No approval requests yet." />
        )}
      </section>
    </div>
  );
}

function Outreach(props: Shared) {
  const rows = useQuery<Row[]>({
    queryKey: ["outreach"],
    queryFn: () => api("/outreach"),
  });
  const [title, setTitle] = useState("");
  return (
    <div className="module-content">
      <PageHead
        eyebrow="CITIZEN OUTREACH"
        title={props.t.outreach}
        description="Plan, record, and review outreach with appropriate human oversight."
      />
      <div className="simulation-banner">
        <AudioLines size={22} />
        <div>
          <strong>Local simulation only</strong>
          <p>
            No calls or messages are sent. All contacts and feedback are
            synthetic. Sentiment analysis is not configured.
          </p>
        </div>
      </div>
      <form
        className="card form-card"
        onSubmit={(e) => {
          e.preventDefault();
          props.run(async () => {
            await api("/outreach", "POST", { title, language: props.language });
            setTitle("");
          }, "Simulation campaign created with three synthetic contacts.");
        }}
      >
        <h3>Create a demonstration campaign</h3>
        <div className="button-row">
          <input
            required
            aria-label="Campaign title"
            placeholder="Campaign title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Button disabled={props.busy}>
            <Plus size={15} />
            Create campaign
          </Button>
        </div>
      </form>
      <div className="project-grid">
        {rows.data?.map((c) => (
          <div className="card form-card" key={c.id}>
            <span className="status-badge">{c.status}</span>
            <h3>{c.title}</h3>
            <p>
              {c.events.length} simulated events · {c.language}
            </p>
            <div className="button-row">
              <Button
                disabled={props.busy}
                onClick={() =>
                  props.run(
                    () => api(`/outreach/${c.id}/simulate`, "POST"),
                    "Simulation recorded. No real citizens contacted.",
                  )
                }
              >
                Run simulation
              </Button>
              <a
                className="button outline"
                href={`/api/outreach/${c.id}/export`}
              >
                Export CSV
              </a>
            </div>
            {c.events.slice(-3).map((e: Row) => (
              <p className="event-note" key={e.id}>
                {e.feedback}
              </p>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function Customize(
  props: Shared & {
    theme: string;
    changePreference: (language: Language, theme?: string) => Promise<void>;
  },
) {
  const [search, setSearch] = useState(""),
    [category, setCategory] = useState("All Tools");
  const tools = [
    {
      id: "documents",
      name: "Document workspace",
      category: "Recommended",
      description:
        "Preserve originals, generate drafts, and compare revisions.",
    },
    {
      id: "eoffice",
      name: "eOffice",
      category: "Legacy Systems",
      description:
        "Local sample connector. No authorised government API connection.",
    },
    {
      id: "legacy_systems",
      name: "Departmental records",
      category: "Legacy Systems",
      description: "Inspect synthetic records through a local connector.",
    },
    {
      id: "google_calendar",
      name: "Calendar",
      category: "Recommended",
      description: "Internal scheduling and manual meeting links.",
    },
    {
      id: "whatsapp",
      name: "WhatsApp Business",
      category: "All Tools",
      description:
        "Simulation only. Official API credentials required for live operation.",
    },
    {
      id: "speech_recognition",
      name: "Voice & transcription",
      category: "All Tools",
      description:
        "Speech provider not configured. Manual transcripts available.",
    },
  ];
  const pinned: string[] = props.user.preferences?.pinned_tools || [];
  return (
    <div className="module-content">
      <PageHead
        eyebrow="YOUR TOOLS, YOUR WAY"
        title={props.t.customize}
        description="Keep useful tools close, and understand exactly what is connected."
      />
      <div className="filter-row">
        <div className="tabs">
          {["Recommended", "Most Used", "Legacy Systems", "All Tools"].map(
            (c) => (
              <button
                key={c}
                className={category === c ? "active" : ""}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ),
          )}
        </div>
        <input
          aria-label="Search tools"
          placeholder="Search tools"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {category === "Most Used" && (
        <p className="muted">
          Pinned shortcuts are shown here. Usage ranking is not yet implemented.
        </p>
      )}
      <div className="project-grid">
        {tools
          .filter(
            (tool) =>
              tool.name.toLowerCase().includes(search.toLowerCase()) &&
              (category === "All Tools" ||
                (category === "Most Used" && pinned.includes(tool.id)) ||
                tool.category === category),
          )
          .map((tool) => (
            <div className="card tool-card" key={tool.id}>
              <span className="project-symbol">
                <LayoutGrid size={20} />
              </span>
              <h3>{tool.name}</h3>
              <p>{tool.description}</p>
              <span className="status-badge">
                {props.caps[tool.id] || "Available locally"}
              </span>
              <div className="button-row">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    props.run(() =>
                      api("/me/preferences", "PUT", {
                        language: props.language,
                        theme: props.theme,
                        notifications:
                          props.user.preferences?.notifications !== false,
                        pinned_tools: pinned.includes(tool.id)
                          ? pinned.filter((id) => id !== tool.id)
                          : [...pinned, tool.id],
                      }),
                    )
                  }
                >
                  {pinned.includes(tool.id) ? "Unpin" : "Pin shortcut"}
                </Button>
                {["eoffice", "legacy_systems"].includes(tool.id) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      props.run(async () => {
                        const result = await api(
                          `/integrations/${tool.id}/test`,
                          "POST",
                        );
                        alert(JSON.stringify(result, null, 2));
                      })
                    }
                  >
                    Test local connector
                  </Button>
                )}
              </div>
            </div>
          ))}
      </div>
      <section className="card form-card">
        <h3>Workspace preferences</h3>
        <div className="form-grid">
          <label>
            Interface language
            <select
              value={props.language}
              onChange={(e) =>
                props.changePreference(e.target.value as Language)
              }
            >
              <option value="en">English</option>
              <option value="as">অসমীয়া</option>
              <option value="hi">हिन्दी</option>
            </select>
          </label>
          <label>
            Appearance
            <select
              value={props.theme}
              onChange={(e) =>
                props.changePreference(props.language, e.target.value)
              }
            >
              {["light", "dark", "system"].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={props.user.preferences?.notifications !== false}
            onChange={(e) =>
              props.run(() =>
                api("/me/preferences", "PUT", {
                  language: props.language,
                  theme: props.theme,
                  pinned_tools: pinned,
                  notifications: e.target.checked,
                }),
              )
            }
          />
          In-app notifications
        </label>
      </section>
    </div>
  );
}

function Profile(
  props: Shared & { onLogout: () => void; onAudit: () => void },
) {
  const [name, setName] = useState(props.user.name),
    [phone, setPhone] = useState(props.user.phone),
    [designation, setDesignation] = useState(props.user.designation);
  const sessions = useQuery<Row[]>({
    queryKey: ["sessions"],
    queryFn: () => api("/me/sessions"),
  });
  const stats = useQuery<Row>({
    queryKey: ["analytics"],
    queryFn: () => api("/analytics"),
  });
  return (
    <div className="module-content">
      <PageHead
        eyebrow="YOUR ACCOUNT"
        title={props.t.profile}
        description="Manage your details, preferences, and active sessions."
      >
        <Button variant="outline" onClick={props.onLogout}>
          <LogOut size={15} />
          {props.t.logout}
        </Button>
      </PageHead>
      <form
        className="card form-card"
        onSubmit={(e) => {
          e.preventDefault();
          props.run(
            () => api("/me", "PATCH", { name, phone, designation }),
            "Profile saved.",
          );
        }}
      >
        <div className="form-grid">
          <label>
            Name
            <input
              value={name}
              required
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label>
            Phone
            <input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
          <label>
            Designation
            <input
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
            />
          </label>
        </div>
        <p>
          {props.user.email} · Role: {props.user.role} · Department #
          {props.user.department_id}
        </p>
        <Button disabled={props.busy}>{props.t.save}</Button>
      </form>
      <section className="card form-card">
        <h3>Account security</h3>
        <p>
          Password reset is available on the sign-in screen. Passkeys are not
          configured.
        </p>
        <h4>Active sessions</h4>
        {sessions.data?.map((s) => (
          <div className="version-row" key={s.reference}>
            <span>
              Session {s.reference}
              <small>
                Expires {new Date(s.expires_at + "Z").toLocaleString()}
              </small>
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                props.run(() => api(`/me/sessions/${s.reference}`, "DELETE"))
              }
            >
              Revoke
            </Button>
          </div>
        ))}
        <h4>AI usage</h4>
        <p>
          {stats.data?.ai_requests || 0} model requests ·{" "}
          {stats.data?.tokens || 0} provider-reported tokens
        </p>
        {["department_admin", "super_admin", "auditor"].includes(
          props.user.role,
        ) && (
          <Button variant="outline" onClick={props.onAudit}>
            View department audit log
          </Button>
        )}
      </section>
    </div>
  );
}
function Audit() {
  const rows = useQuery<Row[]>({
    queryKey: ["audit"],
    queryFn: () => api("/audit"),
  });
  return (
    <div className="module-content">
      <PageHead
        eyebrow="ACCOUNTABILITY"
        title="Department audit log"
        description="Application-recorded activity within your department. Production requires tamper-resistant log storage."
      />
      <div className="card form-card">
        {rows.error && <p role="alert">{rows.error.message}</p>}
        {rows.data?.map((row) => (
          <div className="audit-row" key={row.id}>
            <strong>{row.action}</strong>
            <span>{row.resource}</span>
            <small>
              Actor #{row.actor_id} ·{" "}
              {new Date(row.created_at + "Z").toLocaleString()}
            </small>
            <code>{JSON.stringify(row.detail)}</code>
          </div>
        ))}
      </div>
    </div>
  );
}
function Help({ caps }: { caps: Row }) {
  return (
    <div className="module-content">
      <PageHead
        eyebrow="A LITTLE GUIDANCE"
        title="Welcome to your workspace"
        description="BrahmaGPT is developed by Singularity. This demonstration has no Government of Assam endorsement."
      />
      <section className="card form-card">
        <h3>Start with your work</h3>
        <p>
          Upload a document, create a project, or open Work to manage tasks and
          human approvals. Sign in as the demo approver to review submitted
          drafts.
        </p>
        <p>
          Chat requires a real OpenAI-compatible model configured on the server.
          Generated administrative documents remain drafts until reviewed.
        </p>
        <p>
          Original files are preserved. Revisions create new versions. Records
          have retention holds; automatic deletion is unavailable.
        </p>
        <h3>Capability status</h3>
        <div className="capability-list">
          {Object.entries(caps)
            .filter(([key]) => key !== "demo")
            .map(([key, value]) => (
              <div key={key}>
                <strong>{key.replaceAll("_", " ")}</strong>
                <span>{String(value)}</span>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}
