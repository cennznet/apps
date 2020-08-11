import toFormatedBalance from '../src/util/toFormatedBalance';

describe('formatBalance', () => {
  test('value size is less than default power 4', () => {
    const stubValue = '123';
    const result = toFormatedBalance(stubValue);
    expect(result).toEqual('0.1230');
  });

  test('value size is more than default power 4', () => {
    const stubValue = '123456789';
    const result = toFormatedBalance(stubValue);
    expect(result).toEqual('12,345.6789');
  });
});
