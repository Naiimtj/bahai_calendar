import { useEffect, useId, useMemo, useRef, useState } from 'react';
import BaseIcon from './BaseIcon';

const MENU_MAX_HEIGHT = 288; // px, matches 18rem in the menu's max-h class
const MENU_MIN_HEIGHT = 132;
const MENU_MIN_WIDTH = 224; // px, matches min-w-[14rem]
const EDGE_GAP = 8;

const MENU_POSITION_CLASSES = {
  'down-end': 'top-0 end-0 origin-top-right rtl:origin-top-left',
  'up-end': 'bottom-0 end-0 origin-bottom-right rtl:origin-bottom-left',
  'down-start': 'top-0 start-0 origin-top-left rtl:origin-top-right',
  'up-start': 'bottom-0 start-0 origin-bottom-left rtl:origin-bottom-right',
};

// Usable area: viewport intersected with every clipping ancestor, below sticky headers.
function getVisibleBounds(trigger) {
  let left = 0;
  let right = window.visualViewport?.width ?? window.innerWidth;
  let top = 0;
  let bottom = window.visualViewport?.height ?? window.innerHeight;

  for (let node = trigger; node.parentElement; node = node.parentElement) {
    for (
      let sibling = node.previousElementSibling;
      sibling;
      sibling = sibling.previousElementSibling
    ) {
      if (window.getComputedStyle(sibling).position === 'sticky') {
        top = Math.max(top, sibling.getBoundingClientRect().bottom);
      }
    }

    const parent = node.parentElement;
    const { overflowX, overflowY } = window.getComputedStyle(parent);
    if (overflowX !== 'visible' || overflowY !== 'visible') {
      const rect = parent.getBoundingClientRect();
      top = Math.max(top, rect.top);
      bottom = Math.min(bottom, rect.bottom);
      left = Math.max(left, rect.left);
      right = Math.min(right, rect.right);
    }
  }

  return { top, bottom, left, right };
}

function buildGroups(options) {
  const groups = [];

  options.forEach((opt) => {
    const last = groups[groups.length - 1];
    if (!last || last.group !== opt.group) {
      groups.push({ group: opt.group, options: [opt] });
      return;
    }
    last.options.push(opt);
  });

  return groups;
}

export default function BaseMenu({
  value,
  options = [],
  onChange,
  label,
  displayLabel,
  disabled = false,
  hideChevron = false,
  className = '',
}) {
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const itemRefs = useRef([]);
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState('down');
  const [align, setAlign] = useState('end');
  const menuId = useId();

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value],
  );

  const text = displayLabel ?? selectedOption?.label ?? '';

  const groups = useMemo(() => buildGroups(options), [options]);
  const headerCount = useMemo(
    () => groups.filter((group) => Boolean(group.group)).length,
    [groups],
  );

  const flatOptions = useMemo(
    () => groups.flatMap((group) => group.options),
    [groups],
  );

  const closeAndFocusTrigger = () => {
    setOpen(false);
    triggerRef.current?.focus({ preventScroll: true });
  };

  const openMenu = () => {
    if (disabled || options.length === 0) return;
    const trigger = triggerRef.current;
    const root = rootRef.current;
    if (trigger && root) {
      const rect = trigger.getBoundingClientRect();
      const bounds = getVisibleBounds(trigger);
      const below = bounds.bottom - rect.top - EDGE_GAP;
      const above = rect.bottom - bounds.top - EDGE_GAP;
      const estimated = Math.min(
        options.length * 44 + headerCount * 32 + 16,
        MENU_MAX_HEIGHT,
      );
      const down = below >= estimated || below >= above;
      setPlacement(down ? 'down' : 'up');
      const rootRect = root.getBoundingClientRect();
      const rtl = window.getComputedStyle(root).direction === 'rtl';
      const endRoom =
        (rtl ? bounds.right - rootRect.left : rootRect.right - bounds.left) -
        EDGE_GAP;
      const startRoom =
        (rtl ? rootRect.right - bounds.left : bounds.right - rootRect.left) -
        EDGE_GAP;
      setAlign(
        endRoom >= MENU_MIN_WIDTH || endRoom >= startRoom ? 'end' : 'start',
      );
      rootRef.current?.style.setProperty(
        '--menu-max-h',
        `${Math.max(down ? below : above, MENU_MIN_HEIGHT)}px`,
      );
    }
    setOpen(true);
  };

  const handleSelect = (nextValue) => {
    onChange(nextValue);
    closeAndFocusTrigger();
  };

  const focusItemAt = (index) => {
    const count = flatOptions.length;
    if (count === 0) return;
    const wrappedIndex = ((index % count) + count) % count;
    itemRefs.current[wrappedIndex]?.focus({ preventScroll: true });
  };

  useEffect(() => {
    if (!open) return;

    const items = itemRefs.current.filter(Boolean);
    const checked = items.find(
      (item) => item.getAttribute('aria-checked') === 'true',
    );
    (checked ?? items[0])?.focus({ preventScroll: true });

    const menu = menuRef.current;
    if (checked && menu) {
      menu.scrollTop =
        checked.offsetTop - (menu.clientHeight - checked.offsetHeight) / 2;
    }
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown, true);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
    };
  }, [open]);

  useEffect(() => {
    if (disabled && open) {
      setOpen(false);
    }
  }, [disabled, open]);

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        type="button"
        ref={triggerRef}
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={label ? `${label}: ${text}` : undefined}
        onClick={() => {
          if (open) {
            setOpen(false);
            return;
          }
          openMenu();
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            if (!open) openMenu();
          }
        }}
        className={`flex min-w-0 max-w-full items-center gap-1.5 rounded-lg text-[17px] text-gray-500 transition-opacity active:opacity-60 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-dark dark:text-gray-400 dark:focus-visible:ring-btn-primary ${className}`}
      >
        {selectedOption?.color && (
          <BaseIcon
            icon="circle"
            size="small"
            color={selectedOption.color}
            className="shrink-0"
          />
        )}
        <span className="truncate">{text}</span>
        {!hideChevron && (
          <BaseIcon
            icon="chevronUpDown"
            size="small"
            className="shrink-0 stroke-gray-400 dark:stroke-gray-500"
          />
        )}
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={label}
          ref={menuRef}
          onKeyDown={(event) => {
            const activeIndex = itemRefs.current.findIndex(
              (item) => item === document.activeElement,
            );

            if (event.key === 'ArrowDown') {
              event.preventDefault();
              focusItemAt(activeIndex < 0 ? 0 : activeIndex + 1);
              return;
            }

            if (event.key === 'ArrowUp') {
              event.preventDefault();
              focusItemAt(activeIndex < 0 ? 0 : activeIndex - 1);
              return;
            }

            if (event.key === 'Home') {
              event.preventDefault();
              focusItemAt(0);
              return;
            }

            if (event.key === 'End') {
              event.preventDefault();
              focusItemAt(flatOptions.length - 1);
              return;
            }

            if (event.key === 'Escape') {
              event.stopPropagation();
              closeAndFocusTrigger();
              return;
            }

            if (event.key === 'Tab') {
              setOpen(false);
            }
          }}
          className={`absolute z-40 w-max min-w-[14rem] max-w-[min(20rem,calc(100vw-3rem))] max-h-[min(18rem,var(--menu-max-h,18rem))] overflow-y-auto overscroll-contain rounded-3xl bg-white/85 py-1.5 shadow-2xl ring-1 ring-black/5 backdrop-blur-xl dark:bg-gray-800/85 dark:ring-white/10 motion-safe:animate-menu-in motion-reduce:animate-fade-in ${MENU_POSITION_CLASSES[`${placement}-${align}`]}`}
        >
          {groups.map((group, groupIndex) => {
            const groupLabel = group.group;

            return (
              <div
                key={`group-${groupIndex}-${groupLabel || 'default'}`}
                role="group"
                aria-label={groupLabel || undefined}
              >
                {groupIndex > 0 && (
                  <div
                    role="separator"
                    className="mx-4 my-1.5 border-t border-gray-300/70 dark:border-white/10"
                  />
                )}

                {groupLabel && (
                  <div
                    aria-hidden="true"
                    className="pb-1 pe-4 ps-11 pt-2 text-sm text-gray-500 dark:text-gray-400"
                  >
                    {groupLabel}
                  </div>
                )}

                {group.options.map((opt) => {
                  const selected = opt.value === value;
                  const itemIndex = flatOptions.findIndex(
                    (entry) => entry.value === opt.value,
                  );

                  return (
                    <button
                      key={`${String(opt.value)}-${itemIndex}`}
                      type="button"
                      role="menuitemradio"
                      aria-checked={selected}
                      tabIndex={-1}
                      ref={(node) => {
                        itemRefs.current[itemIndex] = node;
                      }}
                      onClick={() => handleSelect(opt.value)}
                      className="flex min-h-11 w-full items-center gap-3 px-4 py-2.5 text-start text-[17px] text-gray-900 active:bg-black/5 focus-visible:bg-black/5 focus-visible:outline-none dark:text-gray-100 dark:active:bg-white/10 dark:focus-visible:bg-white/10"
                    >
                      <span className="flex w-4 shrink-0 justify-center">
                        {selected && (
                          <BaseIcon
                            icon="check"
                            size="small"
                            className="stroke-gray-900 dark:stroke-gray-100"
                          />
                        )}
                      </span>
                      {opt.color && (
                        <BaseIcon
                          icon="circle"
                          size="small"
                          color={opt.color}
                          className="shrink-0"
                        />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block break-words">{opt.label}</span>
                        {opt.description && (
                          <span className="block break-words text-sm text-gray-500 dark:text-gray-400">
                            {opt.description}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
