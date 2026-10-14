'use client';

import * as RadixDialog from '@radix-ui/react-dialog';
import type { ReactElement, ReactNode } from 'react';

export type DialogProps = {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly title: string;
  readonly description?: ReactNode;
  /**
   * The element that opens the dialog. Needed so focus returns to it on close (A11Y-24):
   * Radix only restores focus to its own trigger.
   */
  readonly trigger?: ReactElement;
  readonly children?: ReactNode;
  /** Buttons, in a predictable order: the safe action first. */
  readonly actions: ReactNode;
};

/**
 * Modal dialog (A11Y-24): focus moves in and stays while open, Escape closes it, focus returns
 * to the trigger, and the dialog is labelled by its title.
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  trigger,
  children,
  actions,
}: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger ? <RadixDialog.Trigger asChild>{trigger}</RadixDialog.Trigger> : null}
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-40 bg-overlay" />
        <RadixDialog.Content
          {...(description ? {} : { 'aria-describedby': undefined })}
          className="fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-flow -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto rounded-lg border border-border bg-surface-raised p-6 shadow-xl"
        >
          <RadixDialog.Title className="text-lg font-semibold text-text-primary">
            {title}
          </RadixDialog.Title>
          {description ? (
            <RadixDialog.Description className="text-base text-text-secondary">
              {description}
            </RadixDialog.Description>
          ) : null}
          {children}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{actions}</div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

/** Closes the surrounding dialog; wrap a `Button` with it. */
export const DialogClose = RadixDialog.Close;
