import type { CrmPort, EmailPort, StoragePort } from '@cera/contracts';

export function fakeCrm(): CrmPort & { readonly upserts: { key: string }[] } {
  const upserts: { key: string }[] = [];
  return {
    upserts,
    upsertLead(_payload, idempotencyKey) {
      const existing = upserts.find((row) => row.key === idempotencyKey);
      if (existing !== undefined) {
        return Promise.resolve({ externalId: 'lead-1', responseCode: 200 });
      }
      upserts.push({ key: idempotencyKey });
      return Promise.resolve({ externalId: 'lead-1', responseCode: 201 });
    },
  };
}

export function fakeEmail(): EmailPort & { readonly sent: string[] } {
  const sent: string[] = [];
  return {
    sent,
    send(message) {
      if (sent.includes(message.idempotencyKey)) {
        return Promise.resolve({ id: 'email-1' });
      }
      sent.push(message.idempotencyKey);
      return Promise.resolve({ id: `email-${String(sent.length)}` });
    },
  };
}

export function fakeStorage(): StoragePort & { readonly keys: string[] } {
  const keys: string[] = [];
  return {
    keys,
    put(key) {
      keys.push(key);
      return Promise.resolve({ url: `https://media.local/${key}` });
    },
    delete(key) {
      const index = keys.indexOf(key);
      if (index >= 0) keys.splice(index, 1);
      return Promise.resolve();
    },
  };
}
