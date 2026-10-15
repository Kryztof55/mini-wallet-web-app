import { buttonClasses } from '@/shared/ui/button';
import { SendIcon } from '@/shared/ui/icons';
import { StartTransferLink } from '@/shared/components/start-transfer-link';
import { cn } from '@/shared/lib/cn';
import { t } from '@/shared/lib/i18n/t';

/**
 * Primary action, always rendered and enabled (UIR-HOME-03). Small viewports: fixed at the
 * bottom within thumb reach; larger: inline next to the balance.
 */
export function SendMoneyAction() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface p-4 md:static md:z-auto md:border-0 md:bg-transparent md:p-0">
      <StartTransferLink
        href="/transfer/recipient"
        className={cn(buttonClasses({ fullWidth: true }), 'md:w-auto md:px-8')}
      >
        <SendIcon />
        {t('home.send')}
      </StartTransferLink>
    </div>
  );
}
