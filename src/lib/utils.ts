import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(value?: string) {
  return (value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function buildMatchSlug(title?: string, id?: string) {
  const baseSlug = slugify(title);
  const numericId = (id ?? "").trim();

  if (!baseSlug) {
    return numericId;
  }

  return numericId ? `${baseSlug}-${numericId}` : baseSlug;
}

export function buildMatchPath(title?: string, id?: string) {
  const slug = buildMatchSlug(title, id);
  return slug ? `/matches/${slug}` : "/matches";
}
