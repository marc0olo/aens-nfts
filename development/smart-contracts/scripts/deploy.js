require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const { AeSdk, MemoryAccount, Node } = require('@aeternity/aepp-sdk');

const shutdown = (varName) => {
    console.error(`Missing ENV variable: ${varName}`);
    process.exit(1);
}

if(!process.env.SECRET_KEY_DEPLOYER) {
    shutdown('SECRET_KEY_DEPLOYER');
}

// run 'generateBytecodeAndAci.js' first
const aci = require('../generated_artifacts/aci.json');
const bytecode = fs.readFileSync('../generated_artifacts/bytecode', 'utf8');

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
        accounts: [new MemoryAccount(process.env.SECRET_KEY_DEPLOYER)],
    });
    const contract = await aeSdk.initializeContract({ aci, bytecode });
    await contract.init("Wrapped AENS", "WAENS", 180_000, 100);
    console.log(`Deployed at: ${contract.$options.address}`);
}

main();