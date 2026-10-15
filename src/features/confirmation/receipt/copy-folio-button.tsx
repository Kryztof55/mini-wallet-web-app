'use client';

import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { t } from '@/lib/i18n/t';

/**
 * UIR-CONF-13: copies the folio and confirms with a polite toast ("Folio copiado"). If the
 * clipboard is unavailable, says so; the folio stays selectable on screen.
 */
export function CopyFolioButton({
  folio,
  clipboard,
}: {
  readonly folio: string;
  readonly clipboard?: Pick<Clipboard, 'writeText'>;
}) {
  const toast = useToast();
  const copy = async () => {
    try {
      await (clipboard ?? navigator.clipboard).writeText(folio);
      toast({ title: t('conf.receipt.copied') });
    } catch {
      toast({ title: t('conf.receipt.copy_failed') });
    }
  };
  return (
    <Button variant="secondary" size="sm" onClick={() => void copy()}>
      {t('conf.receipt.copy')}
    </Button>
  );
}
