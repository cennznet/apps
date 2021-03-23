import BN from 'bn.js';

import { Balance } from '@polkadot/types/interfaces';
import { formatBalance } from '@polkadot/util';

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
const toFormattedBalance = (
  args: {
    value: BN | string | Balance;
    fixedPoint?: number;
    unit?: string;
    trim?: boolean;
  }
): string => {
  const DEFAULT_FIXED_POINT = formatBalance.getDefaults().decimals;
  const DEFAULT_UNIT = '';
  const {
    value,
    fixedPoint = DEFAULT_FIXED_POINT,
    unit = DEFAULT_UNIT,
    trim = false,
  } = args;
  const unitPart = unit ? ` ${unit}` : '';

  // Make it a string so we know what we're dealing with
  let raw = value.toString();

  // values with a decimal point should be converted to their fixed width form.
  const balance: string = raw.indexOf('.') > 0 ?
    decimalToFixedWidth({ value: raw, fixedPoint, pad: trim }) : raw;

  /**
   * Condition 1: balance length is smaller than fixed point, e.g:
   * "123" ==> "0.1230" # when value length (3) is smaller than fixed point (4)
   */
  if (balance.length < fixedPoint) {
    const valueAsBN = new BN(balance);
    const scalingSize = Math.pow(10, 1 - fixedPoint);
    var valuePart = (valueAsBN.toNumber() * scalingSize).toFixed(fixedPoint);
    if (trim) {
      // .00000 => ''
      valuePart = valuePart.replace(/\.0+$/, '');
    }

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

  // Adds thousands separators.
  // Note: we could use something simpler like `toLocaleString` but it cannot handle big number input.
  const formattedBalance = formatBalance(balance, polkadotFormatBalanceOptions);
  const integerPart = formattedBalance.split('.')[0];
  const decimalPart = trim ? 
    balance.substr(-fixedPoint).replace(/0+$/, '') :
    balance.substr(-fixedPoint);

  // no important decimals after trimming
  if (decimalPart.length == 0) {
    return `${integerPart}${unitPart}`;
  }

  return `${integerPart}.${decimalPart}${unitPart}`;
};

// Convert a value with decimal points into it's fixed width equivalent
// e.g. '1234.567' => '1234567
const decimalToFixedWidth = (
  { value, fixedPoint, pad = true }: { value: string, fixedPoint: number, pad?: boolean }
): string => {

  let [prefix, postfix = ''] = value.split('.');

  if(pad && postfix.length < fixedPoint) {
    // no decimal places given, the value should be padded out
    postfix = postfix.padEnd(fixedPoint, '0');
  } else if (postfix.length > fixedPoint) {
    // ensure decimal part is shortened to fixedPoint places
    postfix = postfix.substring(0, fixedPoint);
  }

  // this will also remove leading 0s for fixed width representation
  return (+(prefix + postfix)).toString();
};

export default toFormattedBalance;
export { decimalToFixedWidth };
