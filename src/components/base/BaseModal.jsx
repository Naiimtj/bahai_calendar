import { useEffect, useId, useRef } from 'react';
import BaseIcon from './BaseIcon';

const CLOSE_DISTANCE = 130;
const MAX_HORIZONTAL_DRIFT = 60;

const hasVerticalScrollableAncestor = (target, dialog) => {
  let node = target instanceof HTMLElement ? target : null;

  while (node && node !== dialog) {
    const style = window.getComputedStyle(node);
    const canScroll =
      node.scrollHeight > node.clientHeight &&
      (style.overflowY === 'auto' || style.overflowY === 'scroll');

    if (canScroll) return true;
    node = node.parentElement;
  }

  return false;
};

const isTypingTarget = (node) =>
  node instanceof HTMLElement &&
  (node.isContentEditable ||
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(node.tagName));

const BaseModal = ({
  visible = false,
  title,
  onClose,
  fullscreen = false,
  sheet = false,
  ariaLabel,
  closeButtonHidden = true,
  closeLabel = 'Close',
  header,
  children,
  closeHidden = false,
  ...props
}) => {
  const titleId = useId();
  const dialogRef = useRef(null);
  const touchGesture = useRef(null);

  const handleTouchStart = (event) => {
    if (!window.matchMedia('(max-width: 767px)').matches) return;

    if (hasVerticalScrollableAncestor(event.target, dialogRef.current)) {
      touchGesture.current = null;
      return;
    }

    const touch = event.touches[0];

    touchGesture.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startedAtTop: dialogRef.current?.scrollTop <= 0,
      movedUp: false,
      typing: isTypingTarget(document.activeElement),
    };
  };

  const handleTouchMove = (event) => {
    const gesture = touchGesture.current;
    if (!gesture) return;

    const currentY = event.touches[0].clientY;

    // Si el movimiento es hacia arriba, es scroll normal.
    if (currentY < gesture.startY) {
      gesture.movedUp = true;
    }

    // Al empezar a desplazar con el teclado abierto, lo cerramos.
    if (gesture.typing && Math.abs(currentY - gesture.startY) > 12) {
      document.activeElement?.blur?.();
    }
  };

  const handleTouchEnd = (event) => {
    const gesture = touchGesture.current;
    touchGesture.current = null;

    if (
      !gesture ||
      gesture.typing ||
      gesture.movedUp ||
      !gesture.startedAtTop ||
      dialogRef.current?.scrollTop > 0 ||
      !window.matchMedia('(max-width: 767px)').matches
    ) {
      return;
    }

    const touch = event.changedTouches[0];
    const deltaY = touch.clientY - gesture.startY;
    const deltaX = Math.abs(touch.clientX - gesture.startX);

    if (deltaY > CLOSE_DISTANCE && deltaX < MAX_HORIZONTAL_DRIFT) {
      onClose?.();
    }
  };

  const handleTouchCancel = () => {
    touchGesture.current = null;
  };

  useEffect(() => {
    if (!visible) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [visible, onClose]);

  if (!visible) return null;

  const topContent = (title || closeButtonHidden || header) && (
    <>
      {!closeHidden && closeButtonHidden && (
        <div
          aria-hidden="true"
          className="mx-auto my-3 h-1.5 w-10 rounded-full bg-slate-300 dark:bg-slate-600"
        />
      )}
      {title && (
        <h2
          id={titleId}
          className={`text-2xl font-semibold text-gray-900 dark:text-gray-100 text-center ${closeHidden ? 'md:mt-4 mt-2' : ''}`}
        >
          {title}
        </h2>
      )}
      {header}
    </>
  );

  return (
    <div
      role="none"
      className={`fixed inset-0 bg-black/30 backdrop-blur-xl flex justify-center z-50 pb-[var(--app-system-navigation-bottom,0px)] ${
        sheet ? 'items-end md:items-center' : 'items-center'
      }`}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
      {...props}
    >
      <dialog
        ref={dialogRef}
        open
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : ariaLabel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        className={
          sheet
            ? 'relative overflow-y-auto overflow-x-hidden bg-gray-100 px-4 shadow-2xl dark:bg-gray-900 pb-sheet w-full max-md:my-0 max-md:h-sheet rounded-t-[2.25rem] md:h-auto md:max-h-[85%] md:w-[90%] md:max-w-xl md:rounded-[2rem] motion-safe:max-md:animate-sheet-in motion-reduce:animate-fade-in'
            : `bg-gray-50 dark:bg-gray-900 shadow-lg relative overflow-y-auto overflow-x-hidden pb-[var(--kb-height)] md:px-4 px-2 rounded-lg ${
                fullscreen
                  ? 'w-full h-full md:h-auto md:w-[90%] md:max-w-2xl'
                  : 'w-[95%] max-w-2xl !max-h-[80%]'
              }`
        }
      >
        {!closeButtonHidden && (
          <button
            type="button"
            aria-label={closeLabel}
            onClick={onClose}
            className="absolute z-10 right-0 top-0 m-1 p-0 bg-transparent border-none cursor-pointer leading-none"
          >
            <BaseIcon
              icon="close"
              size="x-large"
              className="fill-primary hover:fill-primary dark:fill-gray-300 dark:hover:fill-white"
              aria-hidden="true"
            />
          </button>
        )}

        <div
          className={
            sheet
              ? 'flex flex-col gap-2 mb-4'
              : 'bg-gray-50 dark:bg-gray-900 flex flex-col gap-2 mb-4'
          }
        >
          {header ? (
            <div className="sticky top-0 z-10 -mx-2 md:-mx-4 px-2 md:px-4 pb-2 flex flex-col md:gap-2 bg-gray-50/70 dark:bg-gray-900/70 backdrop-blur-md">
              {topContent}
            </div>
          ) : (
            topContent
          )}

          {children}
        </div>
      </dialog>
    </div>
  );
};

export default BaseModal;
