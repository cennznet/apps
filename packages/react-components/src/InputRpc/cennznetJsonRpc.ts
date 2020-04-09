/**
 * @polkadot/jsonrpc has been deprecated since version 1.8.1
 *
 * TODO: Get refactored by using types to make PRC decoration, once polkadot/api dependency is upgraded to 1.8.1 above
 */
import defaultJsonRpc from '@polkadot/jsonrpc';
import createMethod from '@polkadot/jsonrpc/create/method';
import createParam from '@polkadot/jsonrpc/create/param';
import { RpcMethodOpt } from '@polkadot/jsonrpc/types';

const buyPrice: RpcMethodOpt = {
  description: 'Retrieves the spot exchange buy price',
  params: [
    createParam('AssetToBuy', 'AssetId'),
    createParam('Amount', 'Balance'),
    createParam('AssetToPay', 'AssetId')
  ],
  type: 'Balance'
};

const sellPrice: RpcMethodOpt = {
  description: 'Retrieves the spot exchange sell price',
  params: [
    createParam('AssetToSell', 'AssetId'),
    createParam('Amount', 'Balance'),
    createParam('AssetToPayout', 'AssetId')
  ],
  type: 'Balance'
};

const cennznetJsonRpc = Object.assign({}, defaultJsonRpc, {
  cennzx: {
    isDeprecated: false,
    isHidden: false,
    description:
      'CENNZX-spot',
    section: 'cennzx',
    methods: {
      buyPrice: createMethod('cennzx', 'buyPrice', buyPrice),
      sellPrice: createMethod('cennzx', 'sellPrice', sellPrice)
    }
  }
});

export default cennznetJsonRpc;
