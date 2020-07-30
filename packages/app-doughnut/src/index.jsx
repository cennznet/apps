"use strict";
// Copyright 2017-2020 @polkadot/app-123code authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const react_copy_to_clipboard_1 = __importDefault(require("react-copy-to-clipboard"));
const doughnut_wasm_1 = require("@plugnet/doughnut-wasm");
const Unlock_1 = __importDefault(require("@polkadot/app-toolbox/Unlock"));
const react_components_1 = require("@polkadot/react-components");
const Button_1 = __importDefault(require("@polkadot/react-components/Button/Button"));
const ui_keyring_1 = __importDefault(require("@polkadot/ui-keyring"));
const util_1 = require("@polkadot/util");
const translate_1 = require("./translate");
function DoughnutApp({ className }) {
    var date = new Date();
    const today = `${date.getFullYear()}-${date.getMonth().toString().padStart(2, "0")}-${date.getDay().toString().padStart(2, "0")}`;
    date.setDate(date.getDate() - 1);
    const yesterday = `${date.getFullYear()}-${date.getMonth().toString().padStart(2, "0")}-${date.getDay().toString().padStart(2, "0")}`;
    const { t } = translate_1.useTranslation();
    // Queue clipboard event
    const { queueAction } = react_1.useContext(react_components_1.StatusContext);
    const _onCopy = () => {
        queueAction && queueAction({
            account: '',
            action: t('clipboard'),
            status: 'queued',
            message: t('🍩💙📋')
        });
    };
    const [issuerPair, setIssuerPair] = react_1.useState(ui_keyring_1.default.getPairs()[0] || null);
    const _onChangeAccount = (accountId) => setIssuerPair(ui_keyring_1.default.getPair(accountId || ''));
    const [holderAddress, setHolderAddress] = react_1.useState();
    const [expiry, setExpiry] = react_1.useState(today);
    const [notBefore, setNotBefore] = react_1.useState(yesterday);
    const [domainValue, setDomainValue] = react_1.useState();
    const [domainKey, setDomainKey] = react_1.useState();
    const [doughnut, setDoughnut] = react_1.useState();
    // Issue a doughnut from input params
    const makeDoughnut = () => {
        // pacify TS null checks
        if (!issuerPair || !holderAddress || !domainValue || !domainKey)
            return;
        var d = new doughnut_wasm_1.Doughnut(ui_keyring_1.default.decodeAddress(issuerPair.address), ui_keyring_1.default.decodeAddress(holderAddress), new Date(expiry).getTime() / 1000, new Date(notBefore).getTime() / 1000)
            .addDomain(domainKey, util_1.hexToU8a(domainValue));
        // We can't get the private key bytes here for good reason
        // therefore we must sign the doughnut using external methods.
        if (issuerPair.type === 'sr25519') {
            // sr25519 is not implemented yet.
            // @polkadot schnorrkel libs are hard coded to use signing context 'substrate'
            // which will create unverifiable doughnuts
            alert("sr25519 signing is not supported yet 😔\n Please use an ed25519 based account");
        }
        else if (issuerPair.type === 'ed25519') {
            // Sign using UI keypair
            // hack: to set the signature version to ed25519
            d.signEd25519(new Uint8Array(32));
            // sign and attach the signature
            let signature = issuerPair.sign(d.payload());
            let encoded = d.encode();
            encoded.set(signature, encoded.length - signature.length);
            setDoughnut(encoded);
        }
    };
    return (<main className={className}>
      <h2>D🍩UGHNUT MAKER</h2>
      <div>
        {
    // User must unlock account to sign doughnuts
    issuerPair?.isLocked && (<Unlock_1.default onClose={() => { }} onUnlock={() => { }} pair={issuerPair}/>)}
        <react_components_1.InputAddress className='full' help={t('The account that will issue the doughnut.')} label={t('issuer')} isInput={false} onChange={_onChangeAccount} type='account'/>
        <react_components_1.InputAddress help={t('The account that will use the doughnut.')} label={t('holder')} onChange={setHolderAddress} type='allPlus'/>
        <react_components_1.Input help={t('When the doughnut will expire.')} value={expiry} label={t('expiry')} onChange={setExpiry} type='date'/>
        <react_components_1.Input value={notBefore} help={t('When the doughnut will activate.')} label={t('not before')} onChange={setNotBefore} type='date'/>
        <react_components_1.Input placeholder='cennznet' label={t('domain key (utf8)')} onChange={setDomainKey} type='text'/>
        <react_components_1.Input placeholder='0x' label={t('domain value (hex)')} onChange={setDomainValue} type='text'/>
        <Button_1.default icon='key' isPrimary label={t('Make')} onClick={makeDoughnut} isDisabled={domainValue === undefined || domainKey === undefined ||
        domainKey.length <= 0 || !util_1.isHex(domainValue)}/>
      </div>
      <h3 hidden={!doughnut}>{'Et Voilà! 👨‍🍳:'}</h3>
      <react_copy_to_clipboard_1.default text={util_1.u8aToHex(doughnut)} onCopy={_onCopy}>
        <div style={{ cursor: 'copy', overflowWrap: 'break-word' }} hidden={!doughnut}>
          {util_1.u8aToHex(doughnut)}
        </div>
      </react_copy_to_clipboard_1.default>
    </main>);
}
exports.default = DoughnutApp;
