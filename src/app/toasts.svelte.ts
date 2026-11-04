/** Short notifications that replace the old "OK" message boxes. */

export type ToastKind = 'info' | 'success' | 'warning' | 'error';

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastOptions {
  kind?: ToastKind;
  /** Milliseconds before the toast disappears on its own; 0 keeps it until dismissed. */
  duration?: number;
}

const DEFAULT_DURATION_MS: Record<ToastKind, number> = {
  info: 5000,
  success: 4000,
  warning: 8000,
  error: 0,
};

let nextId = 1;

export const toasts: Toast[] = $state([]);

export function dismissToast(id: number): void {
  const index = toasts.findIndex((toast) => toast.id === id);
  if (index >= 0) {
    toasts.splice(index, 1);
  }
}

export function showToast(message: string, options: ToastOptions = {}): number {
  const kind = options.kind ?? 'info';
  const duration = options.duration ?? DEFAULT_DURATION_MS[kind];
  const id = nextId;
  nextId += 1;
  toasts.push({ id, kind, message });
  if (duration > 0) {
    setTimeout(() => dismissToast(id), duration);
  }
  return id;
}
