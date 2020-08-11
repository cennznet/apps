import { formatBalance } from '@polkadot/util';

interface Arguments {
  balance: string;
  fixedPoint?: number;
  unit?: string;
}

/**
 * To format balance with preference options
 *
 * Examples (default):
 * "12" ==> "0.0012"
 * "123456789" ==> "12,345.6789"
 *
 * Examples (fixedPoint=2 and unit="Unit")
 * "123" ==> "1.23 Unit"
 */
const toFormattedBalance = (args: Arguments): string => {
  const DEFAULT_FIXED_POINT = 4;
  const DEFAULT_UNIT = '';
  const {
    balance,
    fixedPoint = DEFAULT_FIXED_POINT,
    unit = DEFAULT_UNIT
  } = args;
  const balanceAsNumber = parseInt(balance, 10);
  const unitPart = unit ? ` ${unit}` : '';

  if (!balance || isNaN(balanceAsNumber)) {
    throw new Error(`Balance value is not valid: ${balance}`);
  }

  /**
   * Condition 1: balance length is smaller than fixed point, e.g:
   * "123" ==> "0.1230" # when value length (3) is smaller than fixed point (4)
   */
  if (balance.length <= fixedPoint) {
    const scalingSize = Math.pow(10, 1 - fixedPoint);
    const valuePart = (balanceAsNumber * scalingSize).toFixed(fixedPoint);

    return `${valuePart}${unitPart}`;
  }

  /**
   * Condition 2: balance length is larger than fixed point, e.g:
   * "123456789" ==> "12,345.6789" # when value length is larger than fixed point (4)
   */
  const polkadotFormatBalanceOptions = {
    decimals: fixedPoint,
    forceUnit: '-',
    withSi: false
  };
  const formattedBalance = formatBalance(balance, polkadotFormatBalanceOptions);

  console.log('object', polkadotFormatBalanceOptions);
  const integerPart = formattedBalance.split('.')[0];
  const decimalPart = balance.slice(-fixedPoint);

  return `${integerPart}.${decimalPart}${unitPart}`;
};

export default toFormattedBalance;
