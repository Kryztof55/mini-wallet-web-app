import type { Metadata } from 'next';
import { AppHeader } from '@/features/home/home-header';

export const metadata: Metadata = { title: 'Nueva transferencia' };

// Placeholder so Home's primary action has a destination; the flow is built in TASK-15.
export default function TransferRecipientPage() {
  return (
    <>
      <AppHeader />
      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-flow px-4 py-8 outline-none">
        <h1 className="text-2xl font-bold tracking-tight">Nueva transferencia</h1>
      </main>
    </>
  );
}
