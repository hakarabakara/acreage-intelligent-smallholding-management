import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuickEntry } from '@/hooks/use-quick-entry';
export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const { openTask, openNote } = useQuickEntry();
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }
      // Ignore if modifiers are pressed (except maybe Shift for some, but usually clean keys)
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      switch (e.key.toLowerCase()) {
        case 'c':
          e.preventDefault();
          openTask();
          break;
        case 'n':
          e.preventDefault();
          openNote();
          break;
        case 'h':
          e.preventDefault();
          navigate('/');
          break;
        case '/':
          e.preventDefault();
          // Dispatch a synthetic keydown event for Cmd+K to trigger CommandMenu
          // This is a workaround since CommandMenu listens for Cmd+K on document
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, openTask, openNote]);
}