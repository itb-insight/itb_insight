// Minimal chainable stand-in for the supabase-js query builder. Unit tests mock
// '@/lib/supabase/server' with it:
//
//   const state = vi.hoisted(() => ({ db: undefined as unknown as FakeDb }))
//   vi.mock('@/lib/supabase/server', async () => {
//     const { createFakeClient } = await import('<relative path>/tests/support/fake-supabase')
//     return { createServiceClient: () => createFakeClient(state.db), createClient: async () => createFakeClient(state.db) }
//   })
//
// Every query is recorded in `db.calls`; `db.resolve` decides what each one returns.

export type FakeOp = 'select' | 'insert' | 'update' | 'upsert' | 'delete'

export type FakeCall = {
  table: string
  op: FakeOp
  columns?: string
  payload?: unknown
  filters: Array<{ method: string; args: unknown[] }>
  /** How the query was awaited: directly ('many'), `.single()` or `.maybeSingle()`. */
  mode: 'many' | 'single' | 'maybeSingle'
}

export type FakeResult = { data: unknown; error: unknown; count?: number | null }

export type FakeDb = {
  calls: FakeCall[]
  resolve: (call: FakeCall) => FakeResult
}

const CHAIN_METHODS = [
  'eq',
  'neq',
  'gt',
  'gte',
  'lt',
  'lte',
  'in',
  'is',
  'like',
  'ilike',
  'or',
  'not',
  'match',
  'filter',
  'contains',
  'order',
  'limit',
  'range',
] as const

export function createFakeDb(resolve: FakeDb['resolve'] = () => ({ data: null, error: null })): FakeDb {
  return { calls: [], resolve }
}

export function createFakeClient(db: FakeDb) {
  const from = (table: string) => {
    const call: FakeCall = { table, op: 'select', filters: [], mode: 'many' }
    const run = (mode: FakeCall['mode']) => {
      call.mode = mode
      db.calls.push(call)
      return Promise.resolve(db.resolve(call))
    }

    const builder: Record<string, unknown> = {
      select(columns?: string) {
        // `.insert(...).select()` keeps the write; only a plain read records its columns.
        if (call.op === 'select') call.columns = columns
        return builder
      },
      insert(payload: unknown) {
        call.op = 'insert'
        call.payload = payload
        return builder
      },
      update(payload: unknown) {
        call.op = 'update'
        call.payload = payload
        return builder
      },
      upsert(payload: unknown) {
        call.op = 'upsert'
        call.payload = payload
        return builder
      },
      delete() {
        call.op = 'delete'
        return builder
      },
      single: () => run('single'),
      maybeSingle: () => run('maybeSingle'),
      // Awaiting the builder itself runs the query, like supabase-js.
      then(onFulfilled?: (value: FakeResult) => unknown, onRejected?: (reason: unknown) => unknown) {
        return run('many').then(onFulfilled, onRejected)
      },
    }

    for (const method of CHAIN_METHODS) {
      builder[method] = (...args: unknown[]) => {
        call.filters.push({ method, args })
        return builder
      }
    }

    return builder
  }

  // `.rpc(fn, args)` is recorded as a select on the pseudo-table `rpc:<fn>` with the args as payload.
  const rpc = (fn: string, args?: unknown) => {
    const call: FakeCall = { table: `rpc:${fn}`, op: 'select', payload: args, filters: [], mode: 'many' }
    db.calls.push(call)
    return Promise.resolve(db.resolve(call))
  }

  return { from, rpc }
}

/** Value passed to the first `.eq(column, value)` of a recorded call. */
export function eqValue(call: FakeCall, column: string): unknown {
  return call.filters.find((filter) => filter.method === 'eq' && filter.args[0] === column)?.args[1]
}

/** Recorded writes (insert/update/upsert/delete) to `table`. */
export function writesTo(db: FakeDb, table: string): FakeCall[] {
  return db.calls.filter((call) => call.table === table && call.op !== 'select')
}
