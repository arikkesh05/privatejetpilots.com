import { useEffect } from 'react';

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT' ||
    target.isContentEditable
  );
}

interface DeckHotkeys {
  onToggleCockpit: () => void;
  onToggleAudio: () => void;
  onCloseCockpit: () => void;
}

export function useDeckHotkeys({ onToggleCockpit, onToggleAudio, onCloseCockpit }: DeckHotkeys): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      if (isTypingTarget(event.target)) {
        return;
      }

      if (event.key === 'Escape') {
        onCloseCockpit();
        return;
      }

      if (event.key === 'o' || event.key === 'O') {
        event.preventDefault();
        onToggleCockpit();
      }

      if (event.key === 'm' || event.key === 'M') {
        event.preventDefault();
        onToggleAudio();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onCloseCockpit, onToggleAudio, onToggleCockpit]);
}
