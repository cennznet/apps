import jsonrpc from '@polkadot/types/interfaces/jsonrpc';
import {DefinitionRpcSub } from '@cennznet/types';
import {DefinitionRpcExt} from '@polkadot/types/types';
import * as definitions from '@cennznet/types/interfaces/definitions';

const cennznetRpc: Record<string, Record<string, DefinitionRpcExt>> = {};

Object
    .keys(definitions)
    .filter((key: string) => Object.keys(definitions[key as 'cennzx'].rpc || {}).length !== 0)
    .forEach((section): void => {
        cennznetRpc[section] = {};

        Object
            .entries(definitions[section as 'cennzx'].rpc)
            .forEach(([method, def]): void => {
                const isSubscription = !!(def as DefinitionRpcSub).pubsub;

                cennznetRpc[section][method] = ({ ...def, isSubscription, jsonrpc: `${section}_${method}`, method, section });
            });
    });

const cennznetJsonRpc = Object.assign({}, jsonrpc, cennznetRpc);

export default cennznetJsonRpc;
