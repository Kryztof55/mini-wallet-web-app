'use client';

import { useEffect, useRef } from 'react';
import { StepIndicator } from '@/components/ui/step-indicator';
import { t } from '@/lib/i18n/t';
import type { TransferStep } from './state/draft';

const ORDER: readonly TransferStep[] = ['recipient', 'amount', 'summary'];

/**
 * Step indicator + heading (UIR-TX-01, UIR-TX-02): focus lands on the heading when the step
 * opens, so screen readers announce the new step; the view title follows.
 */
export function StepHeading({
  step,
  title,
}: {
  readonly step: TransferStep;
  readonly title: string;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
    document.title = `${t(`tx.step.${step}`)} · ${t('tx.title')} · Mini Wallet`;
  }, [step]);

  return (
    <div className="flex flex-col gap-4">
      <StepIndicator
        current={ORDER.indexOf(step) + 1}
        total={ORDER.length}
        name={t(`tx.step.${step}`)}
      />
      <h1 ref={heading} tabIndex={-1} className="text-2xl font-bold tracking-tight outline-none">
        {title}
      </h1>
    </div>
  );
}
