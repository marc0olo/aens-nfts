require('dotenv').config({ path: '.env.local' });
const { AeSdk, CompilerHttp, MemoryAccount, Node } = require('@aeternity/aepp-sdk');

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

if(!process.env.NFT_ID) {
    shutdown('NFT_ID');
}

if(!process.env.AENS_NAME) {
    shutdown('AENS_NAME');
}

const contractId = process.env.CONTRACT_ID;
const nftId = process.env.NFT_ID;
const aensName = process.env.AENS_NAME;
const recipientAddress = process.env.NAME_RECIPIENT ? process.env.NAME_RECIPIENT : undefined;

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

    const contract = await aeSdk.initializeContract({ aci, address: contractId });
    await contract.unwrap_single(nftId, aensName, recipientAddress);
}

main();