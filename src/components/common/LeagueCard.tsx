"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function LeagueCard({
  href,
  logo,
  logoSrc,
  title,
  accent,
  fallbackLogo,
}: {
  href: string;
  logo?: ReactNode;
  logoSrc?: string;
  title: string;
  accent: string;
  fallbackLogo?: ReactNode;
}) {
  return (
    <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.2, ease: "easeOut" }}>
      <Link
        href={href}
        className="group flex h-full flex-col justify-between rounded-[30px] border border-white/10 bg-slate-950/80 p-8 transition duration-300 hover:border-emerald-400/40"
      >
        <div className="flex items-center justify-between gap-4">
          <div
            className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white/5 text-white"
            style={{ backgroundColor: accent }}
          >
            {logoSrc ? (
              <Image
                src={logoSrc}
                alt={`${title} logo`}
                width={80}
                height={80}
                className="h-20 w-20 object-contain"
              />
            ) : (
              logo ?? fallbackLogo
            )}
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.28em] text-slate-400 transition group-hover:bg-emerald-500/10">
            Premium
          </div>
        </div>
        <div className="mt-8 space-y-2">
          <p className="text-sm uppercase tracking-[0.32em] text-slate-400">League</p>
          <p className="text-2xl font-semibold text-white">{title}</p>
        </div>
      </Link>
    </motion.div>
  );
}
