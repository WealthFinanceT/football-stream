import { formatMatchDate } from "@/lib/date";

export { formatMatchDate, formatMatchDateTime, formatMatchTime } from "@/lib/date";

export function formatDate(value: string | Date): string {
  return formatMatchDate(value);
}
