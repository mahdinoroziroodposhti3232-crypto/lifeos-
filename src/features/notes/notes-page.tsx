'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Pin,
  PinOff,
  Trash2,
  FileText,
  Palette,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import type { Note } from '@/types';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const NOTE_COLORS = [
  { value: undefined, label: 'پیش‌فرض', hex: 'transparent' },
  { value: '#fef3c7', label: 'زرد', hex: '#fef3c7' },
  { value: '#d1fae5', label: 'سبز', hex: '#d1fae5' },
  { value: '#dbeafe', label: 'آبی', hex: '#dbeafe' },
  { value: '#ede9fe', label: 'بنفش', hex: '#ede9fe' },
  { value: '#fce7f3', label: 'صورتی', hex: '#fce7f3' },
  { value: '#ffedd5', label: 'نارنجی', hex: '#ffedd5' },
];

function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/~~(.+?)~~/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/[-*+]\s/g, '')
    .replace(/\n/g, ' ')
    .trim();
}

function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  const toPersian = (n: number) =>
    String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);

  if (diffMin < 1) return 'همین الان';
  if (diffMin < 60) return `${toPersian(diffMin)} دقیقه پیش`;
  if (diffHour < 24) return `${toPersian(diffHour)} ساعت پیش`;
  if (diffDay < 7) return `${toPersian(diffDay)} روز پیش`;
  return new Date(dateStr).toLocaleDateString('fa-IR');
}

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */

const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
} as const;

const listItemVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
};

const editorVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function NotesPage() {
  const { notes, setNotes } = useAppStore();
  const queryClient = useQueryClient();

  /* ---- local state ---- */
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingContent, setEditingContent] = useState('');
  const [editingColor, setEditingColor] = useState<string | undefined>(undefined);
  const [editingIsPinned, setEditingIsPinned] = useState(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ---- derived state ---- */
  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes;
    const q = searchQuery.trim().toLowerCase();
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
    );
  }, [notes, searchQuery]);

  const pinnedNotes = useMemo(
    () => filteredNotes.filter((n) => n.isPinned),
    [filteredNotes]
  );

  const unpinnedNotes = useMemo(
    () => filteredNotes.filter((n) => !n.isPinned),
    [filteredNotes]
  );

  const selectedNote = useMemo(
    () => notes.find((n) => n.id === selectedNoteId) ?? null,
    [notes, selectedNoteId]
  );

  /* ---- when selected note changes, update editing state ---- */
  useEffect(() => {
    if (selectedNote) {
      setEditingTitle(selectedNote.title);
      setEditingContent(selectedNote.content);
      setEditingColor(selectedNote.color);
      setEditingIsPinned(selectedNote.isPinned);
    }
  }, [selectedNote]);

  /* ---- mutations ---- */
  const createNoteMutation = useMutation({
    mutationFn: async (payload: { title: string; content: string; color?: string; isPinned: boolean }) => {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, userId: 'default' }),
      });
      if (!res.ok) throw new Error('خطا در ایجاد یادداشت');
      return res.json() as Promise<Note>;
    },
    onSuccess: (data) => {
      setNotes([data, ...notes]);
      setSelectedNoteId(data.id);
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
    onError: () => {
      // silent
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: async (payload: {
      id: string;
      title: string;
      content: string;
      color?: string;
      isPinned: boolean;
    }) => {
      const res = await fetch('/api/notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('خطا در بروزرسانی');
      return res.json() as Promise<Note>;
    },
    onSuccess: (data) => {
      setNotes(notes.map((n) => (n.id === data.id ? data : n)));
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
    onError: () => {
      // silent
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/notes?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('خطا در حذف');
    },
    onSuccess: (_, id) => {
      setNotes(notes.filter((n) => n.id !== id));
      if (selectedNoteId === id) {
        setSelectedNoteId(null);
      }
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
    onError: () => {
      // silent
    },
  });

  /* ---- debounced auto-save ---- */
  const debouncedSave = useCallback(
    (title: string, content: string, color: string | undefined, isPinned: boolean) => {
      if (!selectedNoteId) return;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        updateNoteMutation.mutate({
          id: selectedNoteId,
          title,
          content,
          color,
          isPinned,
        });
      }, 1000);
    },
    [selectedNoteId, updateNoteMutation]
  );

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  /* ---- handlers ---- */
  const handleAddNote = () => {
    createNoteMutation.mutate({
      title: 'یادداشت جدید',
      content: '',
      isPinned: false,
    });
  };

  const handleTitleChange = (val: string) => {
    setEditingTitle(val);
    debouncedSave(val, editingContent, editingColor, editingIsPinned);
  };

  const handleContentChange = (val: string) => {
    setEditingContent(val);
    debouncedSave(editingTitle, val, editingColor, editingIsPinned);
  };

  const handleColorChange = (color: string | undefined) => {
    setEditingColor(color);
    // Immediately update in local state and save
    if (selectedNoteId) {
      setNotes(notes.map((n) => (n.id === selectedNoteId ? { ...n, color } : n)));
      updateNoteMutation.mutate({
        id: selectedNoteId,
        title: editingTitle,
        content: editingContent,
        color,
        isPinned: editingIsPinned,
      });
    }
  };

  const handleTogglePin = () => {
    if (!selectedNoteId) return;
    const note = notes.find((n) => n.id === selectedNoteId);
    if (!note) return;
    const newVal = !note.isPinned;
    setEditingIsPinned(newVal);
    setNotes(
      notes.map((n) => (n.id === selectedNoteId ? { ...n, isPinned: newVal } : n))
    );
    updateNoteMutation.mutate({
      id: selectedNoteId,
      title: editingTitle,
      content: editingContent,
      color: editingColor,
      isPinned: newVal,
    });
  };

  const handleTogglePinForNote = (noteId: string) => {
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;
    const newVal = !note.isPinned;
    setNotes(
      notes.map((n) => (n.id === noteId ? { ...n, isPinned: newVal } : n))
    );
    updateNoteMutation.mutate({
      id: noteId,
      title: note.title,
      content: note.content,
      color: note.color,
      isPinned: newVal,
    });
  };

  const handleDelete = (id: string) => {
    deleteNoteMutation.mutate(id);
  };

  /* ---- render note item ---- */
  const renderNoteItem = (note: Note) => {
    const isSelected = note.id === selectedNoteId;
    const preview = stripMarkdown(note.content).slice(0, 100);

    return (
      <motion.button
        key={note.id}
        variants={listItemVariants}
        onClick={() => setSelectedNoteId(note.id)}
        className={cn(
          'group relative w-full rounded-xl border p-3 text-right transition-all duration-200 hover:shadow-md',
          isSelected
            ? 'border-primary/50 bg-accent shadow-sm'
            : 'border-border/50 hover:border-border',
          note.color && 'border-l-4'
        )}
        style={{
          borderLeftColor: note.color || undefined,
        }}
      >
        {/* Pin indicator */}
        {note.isPinned && (
          <Pin className="absolute left-2.5 top-2.5 h-3 w-3 text-amber-500" />
        )}

        <div className="mb-1 font-semibold leading-snug line-clamp-1">
          {note.title || 'بدون عنوان'}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {preview || 'بدون محتوا...'}
        </p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground/70">
            {getRelativeTime(note.updatedAt)}
          </span>
          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleTogglePinForNote(note.id);
              }}
              className="rounded p-1 hover:bg-muted"
            >
              {note.isPinned ? (
                <PinOff className="h-3 w-3 text-muted-foreground" />
              ) : (
                <Pin className="h-3 w-3 text-muted-foreground" />
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(note.id);
              }}
              className="rounded p-1 hover:bg-destructive/10"
            >
              <Trash2 className="h-3 w-3 text-destructive/70" />
            </button>
          </div>
        </div>
      </motion.button>
    );
  };

  /* ---- main render ---- */
  return (
    <div className="flex h-full" dir="rtl">
      {/* Notes List Panel (right side in RTL) */}
      <div className="flex w-full flex-col border-l border-border/50 md:w-[380px] lg:w-[420px]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-3">
          <div>
            <h1 className="text-lg font-bold">یادداشت‌ها</h1>
            <p className="text-xs text-muted-foreground">
              {notes.length > 0
                ? `${notes.length} یادداشت`
                : 'هنوز یادداشتی ندارید'}
            </p>
          </div>
          <Button size="sm" onClick={handleAddNote} className="gap-1.5">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">یادداشت جدید</span>
          </Button>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="جستجو..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-9"
            />
          </div>
        </div>

        <Separator />

        {/* Notes List */}
        <ScrollArea className="flex-1 px-4 py-3">
          {filteredNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="mb-3 h-12 w-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">هنوز یادداشتی ندارید</p>
              <p className="mt-1 text-xs text-muted-foreground/60">
                با کلیک روی دکمه بالا یادداشت جدید بسازید
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Pinned */}
              {pinnedNotes.length > 0 && (
                <>
                  {pinnedNotes.length > 0 && (
                    <div className="mb-1 flex items-center gap-2 px-1">
                      <Pin className="h-3 w-3 text-amber-500" />
                      <span className="text-xs font-medium text-muted-foreground">
                        پین شده
                      </span>
                    </div>
                  )}
                  <motion.div
                    variants={listVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-2"
                  >
                    {pinnedNotes.map(renderNoteItem)}
                  </motion.div>

                  {unpinnedNotes.length > 0 && (
                    <Separator className="my-3" />
                  )}
                </>
              )}

              {/* Unpinned */}
              {unpinnedNotes.length > 0 && (
                <motion.div
                  variants={listVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-2"
                >
                  {unpinnedNotes.map(renderNoteItem)}
                </motion.div>
              )}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Editor Panel (left side in RTL) */}
      <div className="hidden flex-1 flex-col md:flex">
        <AnimatePresence mode="wait">
          {!selectedNote ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-1 flex-col items-center justify-center text-center"
            >
              <FileText className="mb-4 h-16 w-16 text-muted-foreground/15" />
              <p className="text-lg font-medium text-muted-foreground/60">
                یک یادداشت را انتخاب کنید
              </p>
              <p className="mt-1 text-sm text-muted-foreground/40">
                یا یک یادداشت جدید بسازید
              </p>
            </motion.div>
          ) : (
            <motion.div
              key={selectedNote.id}
              variants={editorVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="flex flex-1 flex-col overflow-hidden"
            >
              {/* Editor Header */}
              <div className="flex items-center justify-between border-b px-6 py-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleTogglePin}
                    className={cn(
                      'rounded-lg p-2 transition-colors',
                      editingIsPinned
                        ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <Pin className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(selectedNote.id)}
                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <span className="text-xs text-muted-foreground">
                  آخرین ویرایش: {getRelativeTime(selectedNote.updatedAt)}
                </span>
              </div>

              {/* Color picker */}
              <div className="flex items-center gap-2 border-b px-6 py-2.5">
                <Palette className="h-3.5 w-3.5 text-muted-foreground" />
                <div className="flex items-center gap-1.5">
                  {NOTE_COLORS.map((c) => (
                    <button
                      key={c.value ?? 'default'}
                      onClick={() => handleColorChange(c.value)}
                      className={cn(
                        'h-5 w-5 rounded-full border-2 transition-all',
                        editingColor === c.value
                          ? 'border-foreground scale-110'
                          : 'border-transparent hover:scale-110'
                      )}
                      style={{
                        backgroundColor:
                          c.hex === 'transparent'
                            ? 'var(--muted)'
                            : c.hex,
                      }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              {/* Title Input */}
              <div className="border-b px-6 pt-5">
                <input
                  type="text"
                  value={editingTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full resize-none border-0 bg-transparent text-xl font-bold outline-none placeholder:text-muted-foreground/40"
                  placeholder="عنوان یادداشت..."
                />
              </div>

              {/* Content Textarea */}
              <div className="flex-1 overflow-hidden px-6 py-4">
                <textarea
                  value={editingContent}
                  onChange={(e) => handleContentChange(e.target.value)}
                  className="h-full w-full resize-none border-0 bg-transparent font-mono text-sm leading-7 outline-none placeholder:text-muted-foreground/30"
                  placeholder="محتوای یادداشت خود را بنویسید... (پشتیبانی از مارک‌داون)"
                  dir="auto"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile: show inline when a note is selected on small screens */}
      {selectedNote && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background md:hidden" dir="rtl">
          {/* Mobile editor header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedNoteId(null)}
            >
              → بازگشت
            </Button>
            <div className="flex items-center gap-1">
              <button onClick={handleTogglePin} className="rounded p-2 hover:bg-muted">
                <Pin className={cn('h-4 w-4', editingIsPinned && 'text-amber-500')} />
              </button>
              <button
                onClick={() => handleDelete(selectedNote.id)}
                className="rounded p-2 hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4 text-destructive/70" />
              </button>
            </div>
          </div>

          {/* Mobile color bar */}
          <div className="flex items-center gap-2 border-b px-4 py-2">
            <Palette className="h-3.5 w-3.5 text-muted-foreground" />
            <div className="flex items-center gap-1.5">
              {NOTE_COLORS.map((c) => (
                <button
                  key={c.value ?? 'default'}
                  onClick={() => handleColorChange(c.value)}
                  className={cn(
                    'h-5 w-5 rounded-full border-2 transition-all',
                    editingColor === c.value
                      ? 'border-foreground scale-110'
                      : 'border-transparent hover:scale-110'
                  )}
                  style={{
                    backgroundColor: c.hex === 'transparent' ? 'var(--muted)' : c.hex,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Mobile title */}
          <div className="border-b px-4 pt-4">
            <input
              type="text"
              value={editingTitle}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full resize-none border-0 bg-transparent text-lg font-bold outline-none placeholder:text-muted-foreground/40"
              placeholder="عنوان..."
            />
          </div>

          {/* Mobile content */}
          <div className="flex-1 overflow-hidden px-4 py-3">
            <textarea
              value={editingContent}
              onChange={(e) => handleContentChange(e.target.value)}
              className="h-full w-full resize-none border-0 bg-transparent font-mono text-sm leading-7 outline-none placeholder:text-muted-foreground/30"
              placeholder="محتوای یادداشت..."
              dir="auto"
            />
          </div>
        </div>
      )}
    </div>
  );
}