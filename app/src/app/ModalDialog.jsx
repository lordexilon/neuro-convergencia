'use client';

import {useEffect, useRef} from 'react';

export default function ModalDialog({labelledBy, onClose, children}) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    const trigger = document.activeElement;
    const bodyOverflow = document.body.style.overflow;
    const rootOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    // Native modal dialogs make the background inert and contain keyboard focus.
    dialog.showModal();
    // Small viewports can cause native autofocus to choose the scroll container.
    dialog.querySelector('button:not(:disabled),input:not(:disabled),summary')?.focus({preventScroll: true});
    return () => {
      dialog.close();
      document.body.style.overflow = bodyOverflow;
      document.documentElement.style.overflow = rootOverflow;
      if (trigger?.isConnected) trigger.focus({preventScroll: true});
    };
  }, []);
  return <dialog ref={ref} className="app-dialog" aria-labelledby={labelledBy}
    onKeyDown={event => {
      if (event.key !== 'Tab') return;
      const dialog = ref.current;
      const controls = [...dialog.querySelectorAll('a[href],button,input,textarea,select,summary,[tabindex]')]
        .filter(element => element.tabIndex >= 0 && !element.matches(':disabled') && element.getClientRects().length > 0 && getComputedStyle(element).visibility !== 'hidden');
      const first = controls[0], last = controls.at(-1);
      if (!first) {event.preventDefault(); dialog.focus(); return;}
      if (event.shiftKey && (document.activeElement === first || !controls.includes(document.activeElement))) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !controls.includes(document.activeElement))) {
        event.preventDefault(); first.focus();
      }
    }}
    onCancel={event => {event.preventDefault(); onClose();}}
    onClick={event => {if (event.target === event.currentTarget) onClose();}}>
    {children}
  </dialog>;
}
