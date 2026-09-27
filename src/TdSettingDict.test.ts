import { describe, expect, it } from 'vitest';
import { TdSettingDict } from './TdSettingDict.js';

let keySeq = 0;

function uniqueKey(name: string): string {
  keySeq += 1;
  return `${name}-${keySeq}`;
}

describe('TdSettingDict', () => {
  it('stores and reads a string value', async () => {
    const key = uniqueKey('color');
    await TdSettingDict.set(key, 'blue');
    await expect(TdSettingDict.get(key)).resolves.toBe('blue');
  });

  it('returns undefined for a missing key', async () => {
    await expect(TdSettingDict.get(uniqueKey('missing'))).resolves.toBeUndefined();
  });

  it('overwrites an existing value', async () => {
    const key = uniqueKey('color');
    await TdSettingDict.set(key, 'blue');
    await TdSettingDict.set(key, 'red');
    await expect(TdSettingDict.get(key)).resolves.toBe('red');
  });

  it('rejects a non-string value', async () => {
    await expect(
      // @ts-expect-error intentional invalid value
      TdSettingDict.set(uniqueKey('color'), 1),
    ).rejects.toBeInstanceOf(TypeError);
  });

  it('rejects a non-string key on get and set', async () => {
    await expect(
      // @ts-expect-error intentional invalid key
      TdSettingDict.get(1),
    ).rejects.toBeInstanceOf(TypeError);
    await expect(
      // @ts-expect-error intentional invalid key
      TdSettingDict.set(1, 'blue'),
    ).rejects.toBeInstanceOf(TypeError);
  });
});
