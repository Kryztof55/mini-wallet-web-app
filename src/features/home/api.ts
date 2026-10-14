import { z } from 'zod';
import { request, type HttpRequest } from '@/lib/http/client';

const MoneySchema = z.object({ amountMinor: z.number().int(), currency: z.literal('MXN') });

export const SummarySchema = z.object({ firstName: z.string().nullable(), balance: MoneySchema });
export type Summary = z.infer<typeof SummarySchema>;

export const ActivitySchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      direction: z.enum(['in', 'out']),
      counterparty: z.object({ name: z.string().nullable(), maskedIdentifier: z.string() }),
      amount: MoneySchema,
      concept: z.string().nullable(),
      status: z.enum(['completed', 'pending', 'failed']),
      occurredAt: z.string(),
    }),
  ),
});

const HOME_TIMEOUT_MS = 10_000;

export function createHomeApi(send: HttpRequest = request) {
  return {
    getSummary: () =>
      send('GET', '/api/me/summary', { schema: SummarySchema, timeoutMs: HOME_TIMEOUT_MS }),
    getActivity: () =>
      send('GET', '/api/me/transactions', { schema: ActivitySchema, timeoutMs: HOME_TIMEOUT_MS }),
  };
}

export type HomeApi = ReturnType<typeof createHomeApi>;
export const homeApi = createHomeApi();
