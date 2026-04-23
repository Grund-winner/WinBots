'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import Image from 'next/image';
import { useAuth } from '@/components/auth-provider';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SupportWidgetProps {
  whatsappLink: string;
  telegramLink: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  image: string | null;
  createdAt: string;
  read: boolean;
}

// ─── Icons ───────────────────────────────────────────────────────────────────

function ChatBubbleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function ImageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}

// ─── Typing Indicator ────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex items-center gap-1">
          <motion.span className="w-2 h-2 bg-slate-400 rounded-full inline-block" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
          <motion.span className="w-2 h-2 bg-slate-400 rounded-full inline-block" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }} />
          <motion.span className="w-2 h-2 bg-slate-400 rounded-full inline-block" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }} />
        </div>
      </div>
    </div>
  );
}

// ─── Position persistence ───────────────────────────────────────────────────

const STORAGE_KEY = 'winbots_support_pos';
const READ_NOTIFS_KEY = 'winbots_read_notifications';

function getInitialPosition(): { x: number; y: number } {
  if (typeof window === 'undefined') return { x: 0, y: 0 };
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (typeof parsed.x === 'number' && typeof parsed.y === 'number') return parsed;
    }
  } catch {}
  return { x: window.innerWidth - 72, y: window.innerHeight - 120 };
}

function savePosition(pos: { x: number; y: number }) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(pos)); } catch {}
}

function getLocalReadIds(): string[] {
  try {
    const saved = localStorage.getItem(READ_NOTIFS_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
}

function saveLocalReadIds(ids: string[]) {
  try { localStorage.setItem(READ_NOTIFS_KEY, JSON.stringify(ids)); } catch {}
}

function addLocalReadId(id: string) {
  const ids = getLocalReadIds();
  if (!ids.includes(id)) {
    ids.push(id);
    saveLocalReadIds(ids);
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function SupportWidget({ whatsappLink, telegramLink }: SupportWidgetProps) {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Notifications
  const [notifPanelOpen, setNotifPanelOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  // Suggestions
  const [suggestPanelOpen, setSuggestPanelOpen] = useState(false);
  const [suggestMessage, setSuggestMessage] = useState('');
  const [suggestScreenshot, setSuggestScreenshot] = useState<string | null>(null);
  const [submittingSuggestion, setSubmittingSuggestion] = useState(false);

  // Draggable state
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, pos_x: 0, pos_y: 0 });
  const hasDragged = useRef(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Initialize position ─────────────────────────────────────────────

  useEffect(() => {
    setPosition(getInitialPosition());
  }, []);

  // ─── Save position after drag ─────────────────────────────────────────

  const savePositionRef = useRef(false);
  useEffect(() => {
    if (position && savePositionRef.current) {
      savePosition(position);
      savePositionRef.current = false;
    }
  }, [position]);

  // ─── Compute unread count using localStorage as cache ─────────────────

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const fetchCount = async () => {
      try {
        const res = await fetch('/api/notifications?count=true');
        if (res.ok) {
          const data = await res.json();
          const serverUnread = data.unreadCount || 0;

          // Merge server read IDs into localStorage
          if (data.readIds && Array.isArray(data.readIds)) {
            const localIds = getLocalReadIds();
            const merged = [...new Set([...localIds, ...data.readIds])];
            saveLocalReadIds(merged);
          }

          // Calculate unread based on local storage
          const localReadIds = new Set(getLocalReadIds());
          const allServerIds = data.allIds || [];
          const computedUnread = allServerIds.filter((id: string) => !localReadIds.has(id)).length;

          setUnreadCount(computedUnread);
        }
      } catch {}
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // ─── Chat scroll + focus ──────────────────────────────────────────────

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (chatOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [chatOpen]);

  // ─── Drag handling ─────────────────────────────────────────────────────

  const handleDragStart = useCallback((clientX: number, clientY: number) => {
    if (!position) return;
    setIsDragging(true);
    hasDragged.current = false;
    dragStart.current = { x: clientX, y: clientY, pos_x: position.x, pos_y: position.y };
  }, [position]);

  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging || !position) return;
    const dx = clientX - dragStart.current.x;
    const dy = clientY - dragStart.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasDragged.current = true;
    const btnSize = 60;
    const padding = 8;
    setPosition({
      x: Math.max(padding, Math.min(window.innerWidth - btnSize - padding, dragStart.current.pos_x + dx)),
      y: Math.max(padding, Math.min(window.innerHeight - btnSize - padding, dragStart.current.pos_y + dy)),
    });
  }, [isDragging, position]);

  const handleDragEnd = useCallback(() => {
    if (!isDragging || !position) return;
    setIsDragging(false);
    savePositionRef.current = true;
    savePosition(position);
  }, [isDragging, position]);

  // ─── Mouse / Touch events ─────────────────────────────────────────────

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientX, e.clientY);
    const onMove = (ev: MouseEvent) => handleDragMove(ev.clientX, ev.clientY);
    const onUp = () => { handleDragEnd(); window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [handleDragStart, handleDragMove, handleDragEnd]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
    const onMove = (ev: TouchEvent) => { ev.preventDefault(); handleDragMove(ev.touches[0].clientX, ev.touches[0].clientY); };
    const onUp = () => { handleDragEnd(); window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', onUp); };
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
  }, [handleDragStart, handleDragMove, handleDragEnd]);

  // ─── Toggle menu ──────────────────────────────────────────────────────

  const handleMainButtonClick = useCallback(() => {
    if (hasDragged.current) { hasDragged.current = false; return; }
    setExpanded((prev) => !prev);
  }, []);

  // ─── Open chat ────────────────────────────────────────────────────────

  const openChat = useCallback(() => {
    setExpanded(false);
    setChatOpen(true);
  }, []);

  // ─── Notifications ────────────────────────────────────────────────────

  const openNotifications = useCallback(async () => {
    setExpanded(false);
    setNotifPanelOpen(true);
    setLoadingNotifs(true);
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        const notifs = data.notifications || [];
        setNotifications(notifs);

        // Mark all as read locally and on server
        const unreadNotifs = notifs.filter((n: Notification) => !n.read);
        const unreadIds = unreadNotifs.map((n: Notification) => n.id);

        // Save to localStorage immediately for persistence
        unreadIds.forEach(id => addLocalReadId(id));
        setUnreadCount(0);

        // Also mark on server (fire and forget)
        if (unreadIds.length > 0) {
          fetch('/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notificationIds: unreadIds }),
          }).catch(() => {});
        }
      }
    } catch {}
    setLoadingNotifs(false);
  }, []);

  // ─── Delete a notification from user's view ──────────────────────────

  const deleteNotification = useCallback((notifId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notifId));
    addLocalReadId(notifId);
    // Recalculate unread
    const localReadIds = new Set(getLocalReadIds());
    const remaining = notifications.filter((n) => n.id !== notifId);
    const stillUnread = remaining.filter((n) => !n.read && !localReadIds.has(n.id));
    setUnreadCount(stillUnread.length);
  }, [notifications]);

  // ─── Suggestions ──────────────────────────────────────────────────────

  const openSuggestions = useCallback(() => {
    setExpanded(false);
    setSuggestPanelOpen(true);
  }, []);

  const handleScreenshotUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("L'image ne doit pas depasser 2 Mo"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setSuggestScreenshot(ev.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const submitSuggestion = useCallback(async () => {
    if (!suggestMessage.trim() || submittingSuggestion) return;
    setSubmittingSuggestion(true);
    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: suggestMessage.trim(), screenshot: suggestScreenshot }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Suggestion envoyee avec succes !');
        setSuggestMessage('');
        setSuggestScreenshot(null);
        setSuggestPanelOpen(false);
      } else { toast.error(data.error || 'Erreur'); }
    } catch { toast.error('Erreur de connexion'); }
    setSubmittingSuggestion(false);
  }, [suggestMessage, suggestScreenshot, submittingSuggestion]);

  // ─── Chat send message ────────────────────────────────────────────────

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    const userMessage: ChatMessage = { role: 'user', content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/support/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: newMessages }) });
      const data = await res.json();
      if (data.error) { toast.error(data.error); setIsLoading(false); return; }
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch { toast.error('Erreur de connexion.'); }
    finally { setIsLoading(false); }
  }, [input, messages, isLoading]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }, [sendMessage]);

  // ─── Format date ──────────────────────────────────────────────────────

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "A l'instant";
    if (diffMin < 60) return `Il y a ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `Il y a ${diffH}h`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `Il y a ${diffD}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  // ─── Action buttons (5 buttons in full circle) ────────────────────────

  const actionButtons = [
    {
      label: 'Support IA',
      icon: <ChatBubbleIcon className="w-6 h-6 text-white" />,
      color: 'bg-blue-600 hover:bg-blue-700',
      onClick: openChat,
    },
    {
      label: 'Notifications',
      icon: <BellIcon className="w-6 h-6 text-white" />,
      color: 'bg-amber-500 hover:bg-amber-600',
      onClick: openNotifications,
      badge: unreadCount,
    },
    {
      label: 'WhatsApp',
      icon: <WhatsAppIcon className="w-7 h-7 text-white" />,
      color: 'bg-green-500 hover:bg-green-600',
      onClick: () => window.open(whatsappLink, '_blank', 'noopener'),
    },
    {
      label: 'Telegram',
      icon: <TelegramIcon className="w-6 h-6 text-white" />,
      color: 'bg-sky-500 hover:bg-sky-600',
      onClick: () => window.open(telegramLink, '_blank', 'noopener'),
    },
    {
      label: 'Suggestion',
      icon: <MailIcon className="w-6 h-6 text-white" />,
      color: 'bg-purple-500 hover:bg-purple-600',
      onClick: openSuggestions,
    },
  ];

  // Full circle: 5 buttons evenly from -90deg (top) going clockwise
  const radius = 95;
  const mainBtnSize = 60;
  const subBtnSize = 46;

  if (!position) return null;

  return (
    <>
      {/* ── Floating button + action buttons ── */}
      <div className="fixed z-50 pointer-events-none" style={{ left: position.x, top: position.y }}>
        <AnimatePresence>
          {expanded && (
            <>
              {actionButtons.map((btn, i) => {
                const total = actionButtons.length;
                // Start from top (-PI/2) and go clockwise (360 degrees)
                const startAngle = -Math.PI / 2;
                const step = (2 * Math.PI) / total;
                const angle = startAngle + step * i;

                // Center of sub-button relative to center of main button
                const centerX = Math.cos(angle) * radius;
                const centerY = Math.sin(angle) * radius;
                // Top-left of sub-button (so center lands at the right spot)
                const offsetX = centerX - subBtnSize / 2 + mainBtnSize / 2;
                const offsetY = centerY - subBtnSize / 2 + mainBtnSize / 2;

                return (
                  <motion.button
                    key={btn.label}
                    className={`group pointer-events-auto absolute flex items-center justify-center rounded-full shadow-lg transition-colors duration-200 ${btn.color}`}
                    style={{ width: subBtnSize, height: subBtnSize, left: offsetX, top: offsetY }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25, delay: i * 0.04 }}
                    onClick={btn.onClick}
                    title={btn.label}
                    aria-label={btn.label}
                  >
                    {btn.icon}
                    {btn.badge !== undefined && btn.badge > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full ring-2 ring-white">
                        {btn.badge > 9 ? '9+' : btn.badge}
                      </span>
                    )}
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium text-slate-700 bg-white px-2 py-1 rounded-lg shadow hidden group-hover:block">
                      {btn.label}
                    </span>
                  </motion.button>
                );
              })}
            </>
          )}
        </AnimatePresence>

        {/* Main FAB */}
        <div className="relative" style={{ width: mainBtnSize, height: mainBtnSize }}>
          <motion.button
            className={`pointer-events-auto flex items-center justify-center rounded-full shadow-xl transition-colors duration-200 select-none overflow-hidden w-full h-full ${expanded ? 'bg-slate-800' : 'bg-gradient-to-br from-blue-600 to-blue-700'}`}
            whileTap={{ scale: 0.92 }}
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
            onClick={handleMainButtonClick}
            aria-label={expanded ? 'Fermer le menu' : 'Ouvrir le support'}
          >
            <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
              {expanded ? (
                <CloseIcon className="w-6 h-6 text-white" />
              ) : (
                <Image src="/logo.png" alt="WinBots Support" width={36} height={36} className="rounded-full object-cover" draggable={false} />
              )}
            </motion.div>
          </motion.button>
          {/* Unread badge - positioned ABOVE the button, outside overflow-hidden */}
          {!expanded && unreadCount > 0 && (
            <span className="absolute -top-2.5 -right-1 w-6 h-6 flex items-center justify-center bg-red-500 text-white text-[11px] font-bold rounded-full ring-[2.5px] ring-white z-20 shadow-md pointer-events-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
      </div>

      {/* ── Notifications Panel ── */}
      <AnimatePresence>
        {notifPanelOpen && (
          <>
            <motion.div className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setNotifPanelOpen(false)} />
            <motion.div
              className="fixed inset-x-0 bottom-0 z-[70] mx-auto flex flex-col bg-white rounded-t-3xl shadow-2xl max-w-lg"
              style={{ maxHeight: '80vh' }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-full bg-amber-500">
                    <BellIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
                    <p className="text-xs text-slate-500">Messages de l&apos;equipe WinBots</p>
                  </div>
                </div>
                <button onClick={() => setNotifPanelOpen(false)} className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-slate-100 transition-colors" aria-label="Fermer">
                  <CloseIcon className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {loadingNotifs ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-6">
                    <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                      <BellIcon className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-sm text-slate-400">Aucune notification</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {notifications.map((notif) => {
                      const localReadIds = new Set(getLocalReadIds());
                      const isRead = notif.read || localReadIds.has(notif.id);
                      return (
                        <div key={notif.id} className={`px-5 py-4 group relative ${!isRead ? 'bg-blue-50/50' : ''}`}>
                          <button
                            onClick={() => { addLocalReadId(notif.id); }}
                            className="w-full text-left"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  {!isRead && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
                                  <h4 className="text-sm font-semibold text-slate-900 truncate">{notif.title}</h4>
                                </div>
                                <p className="text-sm text-slate-600 leading-relaxed">{notif.message}</p>
                                {notif.image && (
                                  <img src={notif.image} alt="" className="mt-2 max-w-full max-h-40 rounded-xl object-contain border border-slate-200" />
                                )}
                                <p className="text-xs text-slate-400 mt-2">{formatDate(notif.createdAt)}</p>
                              </div>
                            </div>
                          </button>
                          {/* Delete button */}
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                            className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            aria-label="Supprimer"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Suggestion Panel ── */}
      <AnimatePresence>
        {suggestPanelOpen && (
          <>
            <motion.div className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSuggestPanelOpen(false)} />
            <motion.div
              className="fixed inset-x-0 bottom-0 z-[70] mx-auto flex flex-col bg-white rounded-t-3xl shadow-2xl max-w-lg"
              style={{ maxHeight: '85vh' }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-full bg-purple-500">
                    <MailIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Suggestion</h3>
                    <p className="text-xs text-slate-500">Partagez vos idees avec nous</p>
                  </div>
                </div>
                <button onClick={() => setSuggestPanelOpen(false)} className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-slate-100 transition-colors" aria-label="Fermer">
                  <CloseIcon className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                <div className="space-y-2">
                  <p className="text-xs text-slate-500">Votre message</p>
                  <textarea
                    value={suggestMessage}
                    onChange={(e) => setSuggestMessage(e.target.value)}
                    placeholder="Decrivez votre suggestion..."
                    className="w-full p-3 rounded-xl border border-slate-200 text-sm resize-none h-32 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all"
                    maxLength={3000}
                  />
                  <p className="text-right text-xs text-slate-400">{suggestMessage.length}/3000</p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-slate-500">Capture d&apos;ecran (optionnel)</p>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleScreenshotUpload} className="hidden" />
                  {suggestScreenshot ? (
                    <div className="relative inline-block">
                      <img src={suggestScreenshot} alt="Capture" className="max-w-full max-h-48 rounded-xl object-cover border border-slate-200" />
                      <button
                        onClick={() => setSuggestScreenshot(null)}
                        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                        aria-label="Supprimer"
                      >
                        <CloseIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-slate-300 text-sm text-slate-500 hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50/50 transition-all"
                    >
                      <ImageIcon className="w-4 h-4" />
                      Ajouter une image
                    </button>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-100 px-5 py-3 flex items-center gap-2 bg-white">
                <div className="flex-1" />
                <button onClick={() => setSuggestPanelOpen(false)} className="px-4 py-2.5 rounded-xl text-sm text-slate-500 hover:bg-slate-50 transition-colors">Annuler</button>
                <button
                  onClick={submitSuggestion}
                  disabled={!suggestMessage.trim() || submittingSuggestion}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-40 disabled:hover:bg-purple-600 transition-colors"
                >
                  {submittingSuggestion ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <SendIcon className="w-4 h-4" />}
                  Envoyer
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Chat Panel ── */}
      <AnimatePresence>
        {chatOpen && (
          <>
            <motion.div className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setChatOpen(false)} />
            <motion.div
              className="fixed inset-x-0 bottom-0 z-[70] mx-auto flex flex-col bg-white rounded-t-3xl shadow-2xl max-w-lg"
              style={{ maxHeight: '85vh', minHeight: '50vh' }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-blue-600 to-blue-700">
                    <Image src="/logo.png" alt="WinBots" width={28} height={28} className="rounded-full object-cover" draggable={false} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Support WinBots</h3>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      <p className="text-xs text-slate-500">En ligne</p>
                    </div>
                  </div>
                </div>
                <button onClick={() => setChatOpen(false)} className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-slate-100 transition-colors" aria-label="Fermer">
                  <CloseIcon className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {messages.length === 0 && (
                  <div className="flex justify-center py-8">
                    <div className="text-center max-w-[260px]">
                      <div className="flex items-center justify-center w-14 h-14 rounded-full overflow-hidden bg-blue-50 mx-auto mb-3">
                        <Image src="/logo.png" alt="WinBots" width={36} height={36} className="rounded-full object-cover" draggable={false} />
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">Bonjour ! Comment puis-je vous aider aujourd&apos;hui ?</p>
                    </div>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-slate-100 text-slate-800 rounded-bl-sm'}`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isLoading && <TypingIndicator />}
                <div ref={chatEndRef} />
              </div>

              <div className="border-t border-slate-100 px-4 py-3 flex items-center gap-2 bg-white">
                <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Votre message..." disabled={isLoading} className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all disabled:opacity-50" />
                <button onClick={sendMessage} disabled={isLoading || !input.trim()} className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 transition-colors shrink-0" aria-label="Envoyer">
                  <SendIcon className="w-4 h-4 text-white" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
