import React, { useEffect, useState } from 'react';

type Announcement = { message: string; priority: 'polite' | 'assertive'; sequence: number };
let announcementSequence = 0;
/** Announces important state changes to assistive technology without stealing focus. */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  if (typeof window === 'undefined' || !message.trim()) return;
  window.dispatchEvent(new CustomEvent('akhavan:a11y-announce', { detail: { message, priority, sequence: ++announcementSequence } }));
}
export function LiveAnnouncer() {
  const [announcement, setAnnouncement] = useState<Announcement>({ message: '', priority: 'polite', sequence: 0 });
  useEffect(() => {
    let clearHandle: ReturnType<typeof setTimeout> | undefined;
    const handle = (event: Event) => {
      const detail = (event as CustomEvent<Partial<Announcement>>).detail;
      if (!detail?.message) return;
      if (clearHandle) clearTimeout(clearHandle);
      setAnnouncement({ message: String(detail.message), priority: detail.priority === 'assertive' ? 'assertive' : 'polite', sequence: Number(detail.sequence) || Date.now() });
      clearHandle = setTimeout(() => setAnnouncement(current => ({ ...current, message: '' })), 5000);
    };
    window.addEventListener('akhavan:a11y-announce', handle);
    return () => { window.removeEventListener('akhavan:a11y-announce', handle); if (clearHandle) clearTimeout(clearHandle); };
  }, []);
  return <div className="sr-only" role="status" aria-live={announcement.priority} aria-atomic="true" key={announcement.sequence}>{announcement.message}</div>;
}
