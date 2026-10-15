'use client';

import Link from 'next/link';
import { buttonClasses } from '@/shared/ui/button';
import { ViewHeading } from '@/shared/ui/view-heading';
import { t } from '@/shared/lib/i18n/t';

/** UIR-CONF-15 / AC-CONF-17: missing and not-owned look the same. */
export function ReceiptNotFound() {
  return (
    <div className="flex flex-col items-start gap-4">
      <ViewHeading>{t('conf.receipt.not_found')}</ViewHeading>
      <p className="text-text-secondary">{t('conf.receipt.not_found_body')}</p>
      <Link href="/" className={buttonClasses()}>
        {t('conf.receipt.home')}
      </Link>
    </div>
  );
}
