import { useState, useEffect, useCallback } from 'react';

/** Pages that get a real, linkable URL (deep-link + back button + refresh-safe). */
const URL_PAGES = new Set(['settings', 'help', 'about', 'privacy']);

function pageFromLocation() {
  const path = window.location.pathname.replace(/^\//, '');
  return URL_PAGES.has(path) ? path : 'today';
}

/**
 * Drop-in replacement for `useState('today')` that mirrors a subset of pages
 * (URL_PAGES) into the browser/WebView URL via the native History API, while
 * calendar-internal pages (today/events/fasting) stay state-only.
 */
export function useUrlPage() {
  const [page, setPage] = useState(pageFromLocation);

  useEffect(() => {
    const onPopState = () => setPage(pageFromLocation());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((next) => {
    setPage(next);
    const path = URL_PAGES.has(next) ? `/${next}` : '/';
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
  }, []);

  return [page, navigate];
}
