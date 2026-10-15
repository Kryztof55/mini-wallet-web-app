'use client';

import * as RadixToast from '@radix-ui/react-toast';
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { t } from '@/shared/lib/i18n/t';
import { CheckIcon, CloseIcon } from '@/shared/ui/icons';

export type ToastOptions = {
  readonly title: string;
  readonly description?: string;
};

type ToastItem = ToastOptions & { readonly id: number };

const ToastContext = createContext<((options: ToastOptions) => void) | null>(null);

export const TOAST_DURATION_MS = 5000;

/**
 * Status toasts (accessibility requirements §3): announced politely (`background` type),
 * never steal focus, stay 5 s (paused on hover/focus) and can be dismissed. A toast is never
 * the only place an error is shown.
 */
export function ToastProvider({ children }: { readonly children: ReactNode }) {
  const [toasts, setToasts] = useState<readonly ToastItem[]>([]);

  const show = useCallback((options: ToastOptions) => {
    setToasts((current) => [...current, { ...options, id: Date.now() + Math.random() }]);
  }, []);

  const remove = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={show}>
      <RadixToast.Provider
        duration={TOAST_DURATION_MS}
        label={t('common.notification')}
        swipeDirection="down"
      >
        {children}
        {toasts.map((toast) => (
          <RadixToast.Root
            key={toast.id}
            type="background"
            onOpenChange={(open) => {
              if (!open) remove(toast.id);
            }}
            className="flex items-start gap-3 rounded-lg border border-border bg-surface-raised p-4 text-text-primary shadow-lg"
          >
            <CheckIcon className="mt-0.5 text-status-success" />
            <div className="flex flex-1 flex-col gap-0.5">
              <RadixToast.Title className="text-sm font-semibold">{toast.title}</RadixToast.Title>
              {toast.description ? (
                <RadixToast.Description className="text-sm text-text-secondary">
                  {toast.description}
                </RadixToast.Description>
              ) : null}
            </div>
            <RadixToast.Close
              aria-label={t('common.close')}
              className="-m-1 inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-text-secondary hover:bg-action-secondary hover:text-text-primary"
            >
              <CloseIcon className="size-4" />
            </RadixToast.Close>
          </RadixToast.Root>
        ))}
        <RadixToast.Viewport
          label={t('common.notifications_region')}
          className="fixed inset-x-0 bottom-0 z-50 mx-auto flex w-full max-w-flow flex-col gap-2 p-4 outline-none"
        />
      </RadixToast.Provider>
    </ToastContext.Provider>
  );
}

export function useToast(): (options: ToastOptions) => void {
  const show = useContext(ToastContext);
  if (!show) throw new Error('useToast must be used inside <ToastProvider>');
  return show;
}
