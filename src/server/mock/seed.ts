import 'server-only';
import type { Contact } from '@/core/contact';
import {
  maskIdentifier,
  type EmailAddress,
  type Identifier,
  type PhoneNumber,
} from '@/core/identifier';
import type { ContactId, TransactionId, UserId } from '@/core/ids';
import type { Money } from '@/core/money';
import type { Transaction, TransactionDirection, TransactionStatus } from '@/core/transaction';
import type { User } from '@/core/user';

/** Simulated failures attached to seeded users (TS-00 §9.1). */
export type MockBehaviors = {
  readonly summaryFails?: boolean;
  readonly activityFails?: boolean;
  readonly codeRequestFails?: boolean;
};

export type SeedData = {
  readonly users: readonly User[];
  readonly balances: ReadonlyMap<UserId, Money>;
  readonly transactions: ReadonlyMap<UserId, readonly Transaction[]>;
  readonly contacts: ReadonlyMap<UserId, readonly Contact[]>;
  readonly behaviors: ReadonlyMap<UserId, MockBehaviors>;
};

const phone = (value: string): Identifier => ({ kind: 'phone', value: value as PhoneNumber });
const email = (value: string): Identifier => ({ kind: 'email', value: value as EmailAddress });
const mxn = (amountMinor: number): Money => ({ amountMinor, currency: 'MXN' });
const HOUR = 60 * 60 * 1000;

type TxSpec = readonly [
  name: string | null,
  identifier: Identifier,
  direction: TransactionDirection,
  amountMinor: number,
  concept: string | null,
  status: TransactionStatus,
  hoursAgo: number,
];

function transactions(
  userId: UserId,
  prefix: string,
  now: Date,
  specs: readonly TxSpec[],
): Transaction[] {
  return specs.map(
    ([name, identifier, direction, amountMinor, concept, status, hoursAgo], index) => ({
      id: `txn_${prefix}_${String(index + 1).padStart(2, '0')}` as TransactionId,
      userId,
      direction,
      counterparty: { name, maskedIdentifier: maskIdentifier(identifier) },
      amount: mxn(amountMinor),
      concept,
      status,
      occurredAt: new Date(now.getTime() - hoursAgo * HOUR).toISOString(),
    }),
  );
}

function contact(
  userId: UserId,
  id: string,
  name: string,
  identifier: Identifier,
  usedHoursAgo: number | null,
  now: Date,
): Contact {
  return {
    id: id as ContactId,
    userId,
    name,
    identifier,
    lastUsedAt:
      usedHoursAgo === null ? null : new Date(now.getTime() - usedHoursAgo * HOUR).toISOString(),
  };
}

export const SEED_USER_IDS = {
  ana: 'usr_ana' as UserId,
  nico: 'usr_nico' as UserId,
  carla: 'usr_carla' as UserId,
  beto: 'usr_beto' as UserId,
  marta: 'usr_marta' as UserId,
  fallaLogin: 'usr_falla_login' as UserId,
} as const;

/** Builds the seed with dates relative to `now`, so "Hoy" and "Ayer" always appear. */
export function createSeed(now: Date): SeedData {
  const { ana, nico, carla, beto, marta, fallaLogin } = SEED_USER_IDS;
  const luis = phone('5598765432');
  const maria = email('maria@demo.mx');
  const jorge = phone('5511112222');
  const sofia = phone('5533334444');
  const empresa = email('nomina@empresa.mx');
  const ivan = phone('5544445555');

  const users: User[] = [
    {
      id: ana,
      firstName: 'Ana',
      lastName: 'López',
      identifiers: [phone('5512345678'), email('ana@demo.mx')],
    },
    {
      id: nico,
      firstName: 'Nico',
      lastName: 'Ruiz',
      identifiers: [phone('5500000001'), email('nuevo@demo.mx')],
    },
    {
      id: carla,
      firstName: 'Carla',
      lastName: 'Díaz',
      identifiers: [phone('5500000002'), email('cero@demo.mx')],
    },
    {
      id: beto,
      firstName: 'Beto',
      lastName: 'Sánchez',
      identifiers: [phone('5500000003'), email('falla.saldo@demo.mx')],
    },
    {
      id: marta,
      firstName: 'Marta',
      lastName: 'Gil',
      identifiers: [phone('5500000004'), email('falla.movs@demo.mx')],
    },
    {
      id: fallaLogin,
      firstName: 'Prueba',
      lastName: 'Login',
      identifiers: [phone('5500000005'), email('falla.login@demo.mx')],
    },
  ];

  const anaSpecs: TxSpec[] = [
    ['Luis Pérez', luis, 'out', 25000, 'Tacos', 'completed', 2],
    ['Empresa SA', empresa, 'in', 1500000, 'Nómina', 'completed', 5],
    ['María Torres', maria, 'out', 80000, 'Renta octubre', 'pending', 20],
    ['Jorge Ramírez', jorge, 'out', 12050, null, 'completed', 27],
    ['Sofía Díaz', sofia, 'in', 30000, 'Cena', 'completed', 30],
    ['Iván Castro', ivan, 'out', 99900, 'Boletos', 'failed', 50],
  ];
  for (let i = 0; i < 19; i += 1) {
    const out = i % 3 !== 0;
    anaSpecs.push([
      out ? 'Luis Pérez' : 'Sofía Díaz',
      out ? luis : sofia,
      out ? 'out' : 'in',
      5000 + i * 1250,
      i % 4 === 0 ? `Pago ${i + 1}` : null,
      'completed',
      72 + i * 24,
    ]);
  }

  return {
    users,
    balances: new Map<UserId, Money>([
      [ana, mxn(1234567)],
      [nico, mxn(50000)],
      [carla, mxn(0)],
      [beto, mxn(70000)],
      [marta, mxn(200000)],
      [fallaLogin, mxn(10000)],
    ]),
    transactions: new Map<UserId, readonly Transaction[]>([
      [ana, transactions(ana, 'ana', now, anaSpecs)],
      [nico, []],
      [
        carla,
        transactions(carla, 'carla', now, [
          ['Luis Pérez', luis, 'out', 15000, 'Café', 'completed', 4],
          ['Sofía Díaz', sofia, 'out', 35000, null, 'completed', 30],
          ['Empresa SA', empresa, 'in', 50000, 'Reembolso', 'completed', 100],
        ]),
      ],
      [
        beto,
        transactions(beto, 'beto', now, [['Luis Pérez', luis, 'in', 70000, null, 'completed', 10]]),
      ],
      [marta, []],
      [fallaLogin, []],
    ]),
    contacts: new Map<UserId, readonly Contact[]>([
      [
        ana,
        [
          contact(ana, 'ctc_ana_luis', 'Luis Pérez', luis, 2, now),
          contact(ana, 'ctc_ana_maria', 'María Torres', maria, 20, now),
          contact(ana, 'ctc_ana_jorge', 'Jorge Ramírez', jorge, 27, now),
          contact(ana, 'ctc_ana_sofia', 'Sofía Díaz', sofia, null, now),
        ],
      ],
      [nico, []],
      [
        carla,
        [
          contact(carla, 'ctc_carla_luis', 'Luis Pérez', luis, 4, now),
          contact(carla, 'ctc_carla_sofia', 'Sofía Díaz', sofia, 30, now),
        ],
      ],
      [beto, [contact(beto, 'ctc_beto_luis', 'Luis Pérez', luis, 10, now)]],
      [marta, [contact(marta, 'ctc_marta_maria', 'María Torres', maria, null, now)]],
      [fallaLogin, []],
    ]),
    behaviors: new Map<UserId, MockBehaviors>([
      [beto, { summaryFails: true }],
      [marta, { activityFails: true }],
      [fallaLogin, { codeRequestFails: true }],
    ]),
  };
}
