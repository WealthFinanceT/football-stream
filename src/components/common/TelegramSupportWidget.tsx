'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const DISMISSED_KEY = 'goalpulse-telegram-widget-dismissed';
const AUTO_OPENED_KEY = 'goalpulse-telegram-widget-auto-opened';
const TELEGRAM_URL = 'https://t.me/goalpulsesupport';

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 text-white">
      <path
        fill="currentColor"
        d="M9.78 15.65L9.44 19.6c.3 0 .43-.13.58-.29l1.4-1.35 2.9 2.13c.53.29.91.14.95-.49l1.72-8.11c.16-.67-.24-.94-.68-.77L4.82 11.1c-.64.24-.63.61-.11.77l2.77.86 6.43-4.06c.3-.18.57-.08.35.11l-5.2 4.7Z"
      />
    </svg>
  );
}

export function TelegramSupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const dismissed = window.localStorage.getItem(DISMISSED_KEY) === 'true';
    const autoOpened = window.localStorage.getItem(AUTO_OPENED_KEY) === 'true';

    if (dismissed || autoOpened) {
      return;
    }

    const timer = window.setTimeout(() => {
      setIsOpen(true);
      window.localStorage.setItem(AUTO_OPENED_KEY, 'true');
    }, 20000);

    return () => window.clearTimeout(timer);
  }, []);

  const closeWidget = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(DISMISSED_KEY, 'true');
    }

    setIsClosing(true);
    window.setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 220);
  };

  const openWidget = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(AUTO_OPENED_KEY, 'true');
    }
    setIsOpen(true);
    setIsClosing(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={openWidget}
        className="fixed bottom-4 right-4 z-[60] flex h-14 w-14 items-center justify-center rounded-full border border-emerald-400/40 bg-gradient-to-br from-emerald-400 via-emerald-500 to-sky-500 text-white shadow-[0_18px_50px_rgba(16,185,129,0.35)] transition-transform duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-300/60 sm:bottom-6 sm:right-6 sm:h-16 sm:w-16"
        aria-label="Open Telegram support"
      >
        <span className="absolute inset-0 rounded-full animate-[pulse_3.5s_ease-in-out_infinite] border border-emerald-200/40" />
        <TelegramIcon />
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/35 px-3 py-4 backdrop-blur-[2px] sm:items-end sm:justify-end sm:px-6 sm:py-6">
          <div
            role="dialog"
            aria-modal="true"
            className={`w-full max-w-md rounded-[28px] border border-white/10 bg-slate-950/80 p-5 shadow-[0_24px_80px_rgba(2,6,23,0.6)] backdrop-blur-xl transition-all duration-300 sm:max-w-[420px] ${
              isClosing ? 'translate-y-3 opacity-0' : 'translate-y-0 opacity-100'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
                <TelegramIcon />
              </div>
              <button
                type="button"
                onClick={closeWidget}
                className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
                aria-label="Close support widget"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-4 text-left">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.32em] text-emerald-300">
                  Need support?
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Can&apos;t Find Your Match?
                </h2>
              </div>

              <p className="text-sm leading-7 text-slate-300">
                If there&apos;s a match you expected to watch but it&apos;s unavailable,
                let us know and we&apos;ll do our best to make it available as quickly as
                possible.
              </p>

              <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-white">Need help or found a broken stream?</p>
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  Contact our support team on Telegram.
                </p>
              </div>

              <a
                href={TELEGRAM_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/20"
              >
                Message GoalPulse Support
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
