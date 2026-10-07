/** Shared Tailwind class strings, so forms and buttons look the same everywhere. */

export const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-100";

export const labelClass = "flex flex-col gap-1.5 text-sm font-medium";

export const primaryButtonClass =
  "inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300";

export const secondaryButtonClass =
  "inline-flex items-center justify-center rounded-lg border border-zinc-300 px-4 py-2.5 font-medium hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-900";

/**
 * Small text actions ("Remove", "Rename", "Cancel"). The min-height and
 * padding give a finger-sized tap area without changing how they look.
 */
const textActionBase =
  "inline-flex min-h-10 items-center px-1 text-sm font-medium hover:underline disabled:opacity-60";

export const dangerLinkClass = `${textActionBase} text-red-600 dark:text-red-400`;

export const quietLinkClass = `${textActionBase} text-zinc-600 dark:text-zinc-400`;

export const plainLinkClass = textActionBase;

export const errorClass = "text-sm text-red-600 dark:text-red-400";

export const mutedClass = "text-sm text-zinc-600 dark:text-zinc-400";
