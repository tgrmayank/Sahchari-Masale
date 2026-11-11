'use client';
import { useEffect } from 'react';

/* - Makes the admin pages use the ADMIN manifest (not the storefront one).
   - Registers the service worker early.
   - Inside the installed app: ONLY the admin panel is available. Any other page
     redirects to /admin, and links to the public website are hidden. */
export default function AdminPwaBoot() {
  useEffect(() => {
    const HREF = '/admin.webmanifest';
    document.querySelectorAll('link[rel="manifest"]').forEach((l) => {
      if (!(l.getAttribute('href') || '').endsWith(HREF)) l.remove();
    });
    if (!document.querySelector(`link[rel="manifest"][href="${HREF}"]`)) {
      const l = document.createElement('link');
      l.rel = 'manifest';
      l.href = HREF;
      document.head.appendChild(l);
    }
    if ('serviceWorker' in navigator && window.isSecureContext) {
      navigator.serviceWorker.register('/service-worker.js').catch(() => {});
    }

    const app = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (app) {
      const root = document.querySelector('.adm');
      if (root) root.classList.add('is-app');
      if (!/^\/admin(\/|$)/.test(window.location.pathname)) window.location.replace('/admin');
    }
  }, []);
  return null;
}
