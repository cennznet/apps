import toFormattedBalance from '../src/util/toFormattedBalance';

describe('formatBalance', () => {
  describe('with default settings', () => {
    test('when value length is smaller than default fixed point(4)', () => {
      const stubBalanceValue = '123';
      const result = toFormattedBalance({ balance: stubBalanceValue });
      expect(result).toEqual('0.1230');
    });

    test('when value length is bigger than default fixed point(4)', () => {
      const stubBalanceValue = '123456789';
      const result = toFormattedBalance({ balance: stubBalanceValue });
      expect(result).toEqual('12,345.6789');
    });
  });

  describe('with assigned fixed point', () => {
    test('when value length is smaller than assigned fixed point(2)', () => {
      const stubBalanceValue = '123';
      const result = toFormattedBalance({
        balance: stubBalanceValue,
        fixedPoint: 2
      });
      expect(result).toEqual('1.23');
    });

    test('when value length is bigger than assigned fixed point(2)', () => {
      const stubBalanceValue = '123456789';
      const result = toFormattedBalance({
        balance: stubBalanceValue,
        fixedPoint: 2
      });
      expect(result).toEqual('1,234,567.89');
    });
  });

  describe('with polkadot formatBalance config options', () => {
    test('when forceUnit is set', () => {
      const stubBalanceValue = '0';
      const result = toFormattedBalance({
        balance: stubBalanceValue,
        options: {
          forceUnit: 'CPAY'
        }
      });
      expect(result).toEqual('0.0000 CPAY');
    });

    test('when value length is bigger than assigned fixed point(2)', () => {
      const stubBalanceValue = '123456789';
      const result = toFormattedBalance({
        balance: stubBalanceValue,
        options: {
          withUnit: 'CENNZ'
        }
      });
      expect(result).toEqual('12,345.6789 CENNZ');
    });
  });
});
