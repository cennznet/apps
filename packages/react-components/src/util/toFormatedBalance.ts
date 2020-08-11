import { formatBalance } from '@polkadot/util';

const toFormatedBalance = (value: string): string => {
  const POWER = 4;
  /**
   * Condition 1: value length is less than desired power, e.g
   * 123 => 0.1230 (power is set to 4)
   */
  if (value.length <= POWER) {
    return (parseInt(value, 10) * Math.pow(10, 1 - POWER)).toFixed(POWER);
  }

  /**
   * Condition 2: value length is more than desired power, e.g
   * '123456789' => 12,345.6789
   */
  const formattedBalance = formatBalance(value, {
    decimals: POWER,
    forceUnit: '-',
    withSi: false
  });

  const integerPart = formattedBalance.split('.')[0];
  const decimalPart = value.slice(-POWER);

  return `${integerPart}.${decimalPart}`;
};

export default toFormatedBalance;
