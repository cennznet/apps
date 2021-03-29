const {Keyring} = require('@polkadot/keyring');
const {Keyring: KeyringLatest} = require('@polkadot/keyring-latest');
const {mnemonicGenerate} = require('@polkadot/util-crypto');
const {cryptoWaitReady} = require('@polkadot/util-crypto');
const assert = require('assert').strict;

async function main() {
    await cryptoWaitReady();
    // Create an instance of the old keyring
    const keyring = new Keyring({type: 'sr25519'});
    const mnemonic = mnemonicGenerate();
    console.log('mnemonic:',mnemonic);
    const pair = keyring.addFromMnemonic(mnemonic);
  // Create an instance of the latest keyring
    const keyringLatest = new KeyringLatest({type: 'sr25519'});
    const pairLatest = keyringLatest.addFromMnemonic(mnemonic);
    console.log('Pair:::',pair.address);
    console.log('Pair latest:::', pairLatest.address);
    assert.equal(pair.address, pairLatest.address);
    assert.equal(pair.publicKey.toString(), pairLatest.publicKey.toString());
}

main().catch(console.error);
