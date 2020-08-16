import toFormattedBalance from '../src/util/toFormattedBalance';

describe('toFormattedBalance', () => {
  describe('with default settings', () => {
    test('when value length is smaller than default fixed point(4)', () => {
      const stubBalanceValue = '123';
      const result = toFormattedBalance({ balance: stubBalanceValue });
      expect(result).toEqual('0.1230');
    });

    test('when value length is larger than default fixed point(4)', () => {
      const stubBalanceValue = '123456789';
      const result = toFormattedBalance({ balance: stubBalanceValue });
      expect(result).toEqual('12,345.6789');
    });
  });

  describe('with assigned fixed point', () => {
    test('when balance value length is smaller than assigned fixed point(2)', () => {
      const stubBalanceValue = '123';
      const result = toFormattedBalance({
        balance: stubBalanceValue,
        fixedPoint: 2
      });
      expect(result).toEqual('1.23');
    });

    test('when balance value length is larger than assigned fixed point(2)', () => {
      const stubBalanceValue = '123456789';
      const result = toFormattedBalance({
        balance: stubBalanceValue,
        fixedPoint: 2
      });
      expect(result).toEqual('1,234,567.89');
    });
  });

  describe('with assigned balance unit', () => {
    test('when balance unit is set with a small balance value', () => {
      const stubBalanceValue = '0';
      const result = toFormattedBalance({
        balance: stubBalanceValue,
        unit: 'CPAY'
      });
      expect(result).toEqual('0.0000 CPAY');
    });

    test('when balance unit is set with a large balance value', () => {
      const stubBalanceValue = '123456789';
      const result = toFormattedBalance({
        balance: stubBalanceValue,
        unit: 'CENNZ'
      });
      expect(result).toEqual('12,345.6789 CENNZ');
    });
  });
});
