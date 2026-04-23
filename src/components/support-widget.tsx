'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import Image from 'next/image';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SupportWidgetProps {
  whatsappLink: string;
  telegramLink: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ─── Icons (inline SVGs) ─────────────────────────────────────────────────────

function ChatBubbleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
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
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ─── Typing Indicator ────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex items-center gap-1">
          <motion.span
            className="w-2 h-2 bg-slate-400 rounded-full inline-block"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
          />
          <motion.span
            className="w-2 h-2 bg-slate-400 rounded-full inline-block"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
          />
          <motion.span
            className="w-2 h-2 bg-slate-400 rounded-full inline-block"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Position persistence ───────────────────────────────────────────────────

const STORAGE_KEY = 'winbots_support_pos';

function getInitialPosition(): { x: number; y: number } {
  if (typeof window === 'undefined') return { x: 0, y: 0 };
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
        return parsed;
      }
    }
  } catch {}
  // Default: bottom-right corner
  return {
    x: window.innerWidth - 72,
    y: window.innerHeight - 120,
  };
}

function savePosition(pos: { x: number; y: number }) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pos));
  } catch {}
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function SupportWidget({
  whatsappLink,
  telegramLink,
}: SupportWidgetProps) {
  const [expanded, setExpanded] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Draggable state - initialize from localStorage
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, pos_x: 0, pos_y: 0 });
  const hasDragged = useRef(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ─── Initialize position on mount ──────────────────────────────────────

  useEffect(() => {
    setPosition(getInitialPosition());
  }, []);

  // ─── Save position to localStorage when it changes (after drag end) ──

  const savePositionRef = useRef(false);
  useEffect(() => {
    if (position && savePositionRef.current) {
      savePosition(position);
      savePositionRef.current = false;
    }
  }, [position]);

  // ─── Scroll to bottom on new message ────────────────────────────────────

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // ─── Focus input when chat opens ────────────────────────────────────────

  useEffect(() => {
    if (chatOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [chatOpen]);

  // ─── Drag handling ──────────────────────────────────────────────────────

  const handleDragStart = useCallback(
    (clientX: number, clientY: number) => {
      if (!position) return;
      setIsDragging(true);
      hasDragged.current = false;
      dragStart.current = {
        x: clientX,
        y: clientY,
        pos_x: position.x,
        pos_y: position.y,
      };
    },
    [position]
  );

  const handleDragMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDragging || !position) return;
      const dx = clientX - dragStart.current.x;
      const dy = clientY - dragStart.current.y;

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        hasDragged.current = true;
      }

      const btnSize = 60;
      const padding = 8;
      const newX = Math.max(
        padding,
        Math.min(window.innerWidth - btnSize - padding, dragStart.current.pos_x + dx)
      );
      const newY = Math.max(
        padding,
        Math.min(window.innerHeight - btnSize - padding, dragStart.current.pos_y + dy)
      );

      setPosition({ x: newX, y: newY });
    },
    [isDragging, position]
  );

  const handleDragEnd = useCallback(() => {
    if (!isDragging || !position) return;
    setIsDragging(false);

    // Stay where dropped - just save the position
    savePositionRef.current = true;
    savePosition(position);
  }, [isDragging, position]);

  // ─── Mouse events ───────────────────────────────────────────────────────

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      handleDragStart(e.clientX, e.clientY);

      const onMouseMove = (ev: MouseEvent) => handleDragMove(ev.clientX, ev.clientY);
      const onMouseUp = () => {
        handleDragEnd();
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    [handleDragStart, handleDragMove, handleDragEnd]
  );

  // ─── Touch events ───────────────────────────────────────────────────────

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      handleDragStart(e.touches[0].clientX, e.touches[0].clientY);

      const onTouchMove = (ev: TouchEvent) => {
        ev.preventDefault();
        handleDragMove(ev.touches[0].clientX, ev.touches[0].clientY);
      };
      const onTouchEnd = () => {
        handleDragEnd();
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('touchend', onTouchEnd);
      };

      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('touchend', onTouchEnd);
    },
    [handleDragStart, handleDragMove, handleDragEnd]
  );

  // ─── Toggle expanded buttons ────────────────────────────────────────────

  const handleMainButtonClick = useCallback(() => {
    if (hasDragged.current) {
      hasDragged.current = false;
      return;
    }
    setExpanded((prev) => !prev);
  }, []);

  // ─── Open chat ──────────────────────────────────────────────────────────

  const openChat = useCallback(() => {
    setExpanded(false);
    setChatOpen(true);
  }, []);

  // ─── Send message ───────────────────────────────────────────────────────

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await res.json();

      if (data.error) {
        toast.error(data.error);
        setIsLoading(false);
        return;
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.reply,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      toast.error('Erreur de connexion. Veuillez reessayer.');
    } finally {
      setIsLoading(false);
    }
  }, [input, messages, isLoading]);

  // ─── Handle keyboard ────────────────────────────────────────────────────

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  // ─── Circular arrangement config ────────────────────────────────────────

  const actionButtons = [
    {
      label: 'Support IA',
      icon: <ChatBubbleIcon className="w-7 h-7 text-white" />,
      color: 'bg-blue-600 hover:bg-blue-700',
      onClick: openChat,
    },
    {
      label: 'WhatsApp',
      icon: <WhatsAppIcon className="w-8 h-8 text-white" />,
      color: 'bg-green-500 hover:bg-green-600',
      onClick: () => window.open(whatsappLink, '_blank', 'noopener'),
    },
    {
      label: 'Telegram',
      icon: <TelegramIcon className="w-7 h-7 text-white" />,
      color: 'bg-sky-500 hover:bg-sky-600',
      onClick: () => window.open(telegramLink, '_blank', 'noopener'),
    },
  ];

  // Circular positions: 3 buttons spread around the top of the main button
  const radius = 72; // distance from center of main button
  const mainBtnSize = 60;
  const subBtnSize = 50;
  const angles = [
    -Math.PI / 2,           // top center (Support IA)
    -Math.PI / 2 - Math.PI / 3, // top-left (WhatsApp)
    -Math.PI / 2 + Math.PI / 3, // top-right (Telegram)
  ];

  // Don't render until position is initialized
  if (!position) return null;

  return (
    <>
      {/* ── Floating button + action buttons ── */}
      <div className="fixed z-50 pointer-events-none" style={{ left: position.x, top: position.y }}>
        {/* Action buttons - circular arrangement */}
        <AnimatePresence>
          {expanded && (
            <>
              {actionButtons.map((btn, i) => {
                const angle = angles[i];
                // Position relative to the center of the main button
                const offsetX = Math.cos(angle) * radius - subBtnSize / 2 + mainBtnSize / 2;
                const offsetY = Math.sin(angle) * radius - subBtnSize / 2 + mainBtnSize / 2;
                return (
                  <motion.button
                    key={btn.label}
                    className={`
                      group pointer-events-auto absolute flex items-center justify-center
                      rounded-full shadow-lg transition-colors duration-200
                      ${btn.color}
                    `}
                    style={{
                      width: subBtnSize,
                      height: subBtnSize,
                      left: offsetX,
                      top: offsetY,
                    }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 25,
                      delay: i * 0.05,
                    }}
                    onClick={btn.onClick}
                    title={btn.label}
                    aria-label={btn.label}
                  >
                    {btn.icon}
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
        <motion.button
          className={`
            pointer-events-auto flex items-center justify-center rounded-full shadow-xl
            transition-colors duration-200 select-none overflow-hidden
            ${expanded ? 'bg-slate-800' : 'bg-gradient-to-br from-blue-600 to-blue-700'}
          `}
          style={{ width: mainBtnSize, height: mainBtnSize }}
          whileTap={{ scale: 0.92 }}
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          onClick={handleMainButtonClick}
          aria-label={expanded ? 'Fermer le menu' : 'Ouvrir le support'}
        >
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {expanded ? (
              <CloseIcon className="w-6 h-6 text-white" />
            ) : (
              <Image
                src="/logo.png"
                alt="WinBots Support"
                width={36}
                height={36}
                className="rounded-full object-cover"
                draggable={false}
              />
            )}
          </motion.div>
        </motion.button>
      </div>

      {/* ── Chat Panel ── */}
      <AnimatePresence>
        {chatOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setChatOpen(false)}
            />

            {/* Chat panel */}
            <motion.div
              className="fixed inset-x-0 bottom-0 z-[70] mx-auto flex flex-col bg-white rounded-t-3xl shadow-2xl max-w-lg"
              style={{ maxHeight: '85vh', minHeight: '50vh' }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-blue-600 to-blue-700">
                    <Image
                      src="/logo.png"
                      alt="WinBots"
                      width={28}
                      height={28}
                      className="rounded-full object-cover"
                      draggable={false}
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Support WinBots
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      <p className="text-xs text-slate-500">En ligne</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setChatOpen(false)}
                  className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-slate-100 transition-colors"
                  aria-label="Fermer"
                >
                  <CloseIcon className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              {/* Messages area */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {/* Welcome message */}
                {messages.length === 0 && (
                  <div className="flex justify-center py-8">
                    <div className="text-center max-w-[260px]">
                      <div className="flex items-center justify-center w-14 h-14 rounded-full overflow-hidden bg-blue-50 mx-auto mb-3">
                        <Image
                          src="/logo.png"
                          alt="WinBots"
                          width={36}
                          height={36}
                          className="rounded-full object-cover"
                          draggable={false}
                        />
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        Bonjour ! Comment puis-je vous aider aujourd&apos;hui ?
                      </p>
                    </div>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`
                        max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                        ${
                          msg.role === 'user'
                            ? 'bg-blue-600 text-white rounded-br-sm'
                            : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                        }
                      `}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}

                {isLoading && <TypingIndicator />}

                <div ref={chatEndRef} />
              </div>

              {/* Input area */}
              <div className="border-t border-slate-100 px-4 py-3 flex items-center gap-2 bg-white">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Votre message..."
                  disabled={isLoading}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all disabled:opacity-50"
                />
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !input.trim()}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 transition-colors shrink-0"
                  aria-label="Envoyer"
                >
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
