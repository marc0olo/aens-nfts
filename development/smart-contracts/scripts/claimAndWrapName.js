require('dotenv').config({ path: '.env.local' });
const { AeSdk, MemoryAccount, Node } = require('@aeternity/aepp-sdk');

// https://github.com/GoogleChromeLabs/jsbi/issues/30#issuecomment-953187833
BigInt.prototype.toJSON = function() { return this.toString() }

const shutdown = (varName) => {
    console.error(`Missing ENV variable: ${varName}`);
    process.exit(1);
}

if(!process.env.SECRET_KEY_ACCOUNT_1) {
    shutdown('SECRET_KEY_ACCOUNT_1');
}

if(!process.env.CONTRACT_ID) {
    shutdown('CONTRACT_ID');
}

if(!process.env.AENS_NAME) {
    shutdown('AENS_NAME');
}

const contractId = process.env.CONTRACT_ID;
const aensName = process.env.AENS_NAME;

// run 'generateBytecodeAndAci.js' first
const aci = require('../generated_artifacts/aci.json');

const AE_NETWORK = process.env.AE_NETWORK || 'TESTNET'
const SETTINGS = {
    TESTNET: {
        nodeUrl: 'https://testnet.aeternity.io'
      },
    MAINNET: {
        nodeUrl: 'https://mainnet.aeternity.io'
    }
}

const main = async () => {
    const node = new Node(SETTINGS[AE_NETWORK].nodeUrl);
    const aeSdk = new AeSdk({
        nodes: [
          { name: AE_NETWORK, instance: node },
        ],
        accounts: [new MemoryAccount(process.env.SECRET_KEY_ACCOUNT_1)],
    });

    // make sure to have enough AE balance to cover the name fee
    const preClaimTx = await aeSdk.aensPreclaim(aensName);
    // note: there will be a "timeout" until a new keyblock is mined before the actual NameClaimTx can be mined
    await aeSdk.aensClaim(aensName, preClaimTx.salt);

    const contract = await aeSdk.initializeContract({ aci, address: contractId });
    const delegationSignature = await aeSdk.createDelegationSignature(contractId, [aensName]);
    const namesDelegationSigs = new Map([[aensName, delegationSignature]]);
    
    const wrapAndMintTx = await contract.wrap_and_mint(namesDelegationSigs);
    const nftId = wrapAndMintTx.decodedResult;
    const nftData = (await contract.get_nft_data(nftId)).decodedResult;
    console.log(`TX hash: ${wrapAndMintTx.txData.hash}`);
    console.log(`NFT ID: ${wrapAndMintTx.decodedResult}`);
    console.log(`NFT data: ${JSON.stringify(nftData)}`);
}

main();