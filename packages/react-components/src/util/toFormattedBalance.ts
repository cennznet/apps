import { formatBalance } from '@polkadot/util';

/**
 * Check Polkadot formatBalance available options, and enable the below options as needed:
 * https://github.com/polkadot-js/common/blob/master/packages/util/src/format/formatBalance.ts#L23
 */
interface PolkadotFormatBalanceOptions {
  decimals?: number;
  unit?: string;
  forceUnit?: string;
  withUnit?: boolean | string;
  // withSi?: boolean;
  // withSiFull?: boolean;
  // withUnit?: boolean | string;
}

interface Arguments {
  balance: string;
  fixedPoint?: number;
  options?: PolkadotFormatBalanceOptions;
}

const toFormatedBalance = (args: Arguments): string => {
  const DEFAULT_FIXED_POINT = 4;
  const { balance, fixedPoint = DEFAULT_FIXED_POINT, options } = args;
  const balanceAsNumber = parseInt(balance, 10);

  if (!balance || isNaN(balanceAsNumber)) {
    throw new Error(`Balance value is not valid: ${balance}`);
  }

  /**
   * Condition 1: balance length is less than desired power, e.g
   * 123 => 0.1230 (power is set to 4)
   */
  if (balance.length <= fixedPoint) {
    const scalingSize = Math.pow(10, 1 - fixedPoint);

    return (balanceAsNumber * scalingSize).toFixed(fixedPoint);
  }

  /**
   * Condition 2: balance length is more than desired power, e.g
   * '123456789' => 12,345.6789
   */
  const polkadotFormatBalanceOptions = {
    decimals: fixedPoint,
    forceUnit: '-',
    withSi: false,
    ...options
  };
  const formattedBalance = formatBalance(balance, polkadotFormatBalanceOptions);

  console.log('object', polkadotFormatBalanceOptions);
  const integerPart = formattedBalance.split('.')[0];
  const decimalPart = balance.slice(-fixedPoint);

  return `${integerPart}.${decimalPart}`;
};

export default toFormatedBalance;
