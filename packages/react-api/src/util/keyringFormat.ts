import { KeyringPair$Json } from '@polkadot/keyring/types';
import { KeyringPair$Json2 } from "@polkadot/react-api/types";

export function updateToV3KeyringFormat(json: KeyringPair$Json | KeyringPair$Json2) {
    // The difference between keyring v2 and v3 is in the field content
    // "encoding":{"content":["pkcs8",{"type":"sr25519"}] --- v2
    // "encoding":{"content":["pkcs8","sr25519"] --- v3
    // update the json with new way
    const pkcs8 = json.encoding.content[0];
    let accountType = json.encoding.content[1];
    if (typeof accountType === 'object' && accountType !== null) {
        accountType = Object.values(accountType)[0];
        json.encoding.content = [pkcs8, accountType];
    }
}