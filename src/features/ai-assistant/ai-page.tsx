'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, User } from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    'سلام! من دستیار هوشمند لایف‌او‌اس هستم. می‌توانم به شما در برنامه‌ریزی روزانه کمک کنم. بپرسید یا دستوری بدهید!',
};

const QUICK_ACTIONS = [
  { label: 'برنامه‌ریزی امروز', query: 'برنامه‌ریزی امروز' },
  { label: 'تحلیل عملکرد', query: 'تحلیل عملکرد' },
  { label: 'پیشنهاد اولویت', query: 'پیشنهاد اولویت' },
];

function generateResponse(input: string): string {
  const lower = input.toLowerCase();

  if (
    lower.includes('برنامه') ||
    lower.includes('planning') ||
    lower.includes('today') ||
    lower.includes('امروز')
  ) {
    return `برنامه پیشنهادی امروز شما:

۱. جلسه تیمی ساعت ۱۰:۰۰ (اولویت: فوری)
۲. تکمیل طراحی صفحه اصلی (اولویت: زیاد)
۳. مرور کدهای امروز (اولویت: متوسط)
۴. ورزش ۳۰ دقیقه (اولویت: کم)

پیشنهاد: با جلسه تیمی شروع کنید چون زمان‌بندی مشخصی دارد.`;
  }

  if (lower.includes('عملکرد') || lower.includes('performance')) {
    return `تحلیل عملکرد شما در این هفته:

✅ ۱۲ وظیفه انجام شده از ۱۸ وظیفه (۶۷٪)
⏱️ ۵ ساعت و ۳۰ دقیقه تمرکز
🔥 عادت مطالعه: ۵ روز متوالی
📊 پروژه طراحی وبسایت: ۷۵٪ پیشرفت

نکته: عملکرد شما نسبت به هفته قبل ۱۵٪ بهبود داشته!`;
  }

  if (lower.includes('اولویت') || lower.includes('priority')) {
    return `بر اساس تحلیل وظایف شما، این اولویت‌بندی پیشنهاد می‌شود:

🔴 فوری: گزارش پروژه (مهلت امروز)
🟡 زیاد: طراحی رابط کاربری
🔵 متوسط: به‌روزرسانی مستندات
⚪ کم: مرور مقالات`;
  }

  return `متوجه شدم! برای بهتر کمک کردن، می‌توانید از این دستورات استفاده کنید:

• «برنامه‌ریزی امروز» — برنامه پیشنهادی روز
• «تحلیل عملکرد» — بررسی عملکرد هفتگی
• «پیشنهاد اولویت» — اولویت‌بندی وظایف

همچنین می‌توانید سوال خاصی بپرسید!`;
}

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */

const messageVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: 'easeOut' as const } },
  exit: { opacity: 0, y: -10, scale: 0.98, transition: { duration: 0.2 } },
};

/* ------------------------------------------------------------------ */
/*  Typing Indicator                                                   */
/* ------------------------------------------------------------------ */

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 px-4" dir="rtl">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
          <Sparkles className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <div className="flex items-center gap-1 rounded-2xl rounded-tr-sm bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 px-4 py-3">
        <motion.span
          className="inline-block h-2 w-2 rounded-full bg-foreground/30"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
        />
        <motion.span
          className="inline-block h-2 w-2 rounded-full bg-foreground/30"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
        />
        <motion.span
          className="inline-block h-2 w-2 rounded-full bg-foreground/30"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AIPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* auto-scroll to bottom */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text.trim(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInputText('');
      setIsLoading(true);

      /* Simulate AI delay */
      const delay = 1000 + Math.random() * 1000;
      setTimeout(() => {
        const response = generateResponse(text);
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response,
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setIsLoading(false);
      }, delay);
    },
    [isLoading]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputText);
  };

  const handleQuickAction = (query: string) => {
    sendMessage(query);
  };

  return (
    <div className="flex h-full flex-col" dir="rtl">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b px-6 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-md shadow-violet-500/20">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold">دستیار هوشمند</h1>
          <p className="text-xs text-muted-foreground">برنامه‌ریزی و تحلیل هوشمند</p>
        </div>
      </div>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-4 px-4 py-6">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                variants={messageVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className={cn(
                  'flex items-start gap-3',
                  msg.role === 'user' ? 'flex-row-reverse' : ''
                )}
              >
                {/* Avatar */}
                {msg.role === 'assistant' ? (
                  <Avatar className="h-8 w-8 shrink-0 mt-0.5">
                    <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-xs">
                      <Sparkles className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <Avatar className="h-8 w-8 shrink-0 mt-0.5">
                    <AvatarFallback className="bg-muted text-xs">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}

                {/* Bubble */}
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-7 whitespace-pre-line',
                    msg.role === 'user'
                      ? 'rounded-tl-sm bg-primary text-primary-foreground'
                      : 'rounded-tr-sm bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10'
                  )}
                >
                  {msg.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <TypingIndicator />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Input Area */}
      <div className="shrink-0 border-t bg-background/80 backdrop-blur-sm px-4 pt-3 pb-4">
        <div className="mx-auto max-w-3xl">
          {/* Quick Actions */}
          {messages.length <= 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-3 flex flex-wrap gap-2"
            >
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  onClick={() => handleQuickAction(action.query)}
                  className="flex items-center gap-1.5 rounded-full border bg-background px-4 py-2 text-xs font-medium text-foreground shadow-sm transition-all hover:bg-accent hover:shadow-md active:scale-95"
                >
                  <Sparkles className="h-3 w-3 text-violet-500" />
                  {action.label}
                </button>
              ))}
            </motion.div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="پیام خود را بنویسید..."
                disabled={isLoading}
                className="h-12 rounded-xl pr-4 pl-12 text-sm border-border/50 focus-visible:ring-primary/20"
                dir="auto"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!inputText.trim() || isLoading}
                className="absolute left-1.5 top-1/2 h-9 w-9 -translate-y-1/2 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-sm hover:shadow-md disabled:opacity-40 transition-all"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>

          <p className="mt-2 text-center text-[10px] text-muted-foreground/50">
            این دستیار شبیه‌سازی شده و داده‌های واقعی را تحلیل نمی‌کند
          </p>
        </div>
      </div>
    </div>
  );
}