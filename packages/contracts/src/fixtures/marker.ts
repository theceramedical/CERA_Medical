/**
 * The fixture marker, and why it exists in two forms.
 *
 * In memory, every fixture carries `__fixture: true`. That makes a fixture
 * visibly a fixture wherever one is held, so a helper that accidentally returns
 * seed data from a real code path is identifiable at the point it is inspected
 * rather than three layers later when an assertion about a customer's name fails.
 *
 * In the database the marker cannot be a column: adding `is_fixture` to nine
 * production tables to serve a test concern is a cost paid forever by rows that
 * will never be fixtures. The persisted marker is therefore in the values
 * themselves - the reserved `.invalid` email domain and the `fixture-` subject
 * prefix from `deterministic.ts` - which makes the production guard a query
 * against existing indexed columns and adds nothing to the schema.
 *
 * Both are needed. The in-memory marker cannot survive an insert; the value-based
 * marker cannot be checked by the type system.
 */

/** A record that is unambiguously seed data. */
export type Fixture<T> = T & { readonly __fixture: true };

/**
 * Marks and freezes a fixture.
 *
 * Frozen because fixtures are module-level singletons shared by every test in a
 * file. A test that mutates one to set up a case would otherwise change the
 * meaning of every later test in the run, and the failure appears in whichever
 * test happens to run next - a class of bug that costs hours and is trivially
 * prevented here.
 */
export function fixture<T extends object>(record: T): Fixture<T> {
  return Object.freeze({ ...record, __fixture: true as const });
}

/**
 * Strips the marker for persistence.
 *
 * The seeder calls this on every row. Drizzle builds an `INSERT` from the table's
 * columns, so an extra key is ignored today - but "ignored today" is not a
 * guarantee across a minor version, and a silently dropped `__fixture` would be
 * indistinguishable from a marker that was never applied.
 */
export function unmarked<T extends object>(record: Fixture<T>): T {
  const { __fixture: _marker, ...rest } = record;

  return rest as unknown as T;
}

/** Strips the marker from a list. */
export function unmarkedAll<T extends object>(records: readonly Fixture<T>[]): T[] {
  return records.map((record) => unmarked(record));
}
