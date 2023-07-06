require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const { AeSdk, CompilerHttp, MemoryAccount, Node } = require('@aeternity/aepp-sdk');
const { utils } = require('@aeternity/aeproject');

const shutdown = (varName) => {
    console.error(`Missing ENV variable: ${varName}`);
    process.exit(1);
}

if(!process.env.SECRET_KEY) {
    shutdown('SECRET_KEY');
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
        onCompiler: new CompilerHttp('https://v7.compiler.aeternity.io'),
        nodes: [
          { name: AE_NETWORK, instance: node },
        ],
        accounts: [new MemoryAccount(process.env.SECRET_KEY)],
    });
    const contract = await aeSdk.initializeContract({ aci, bytecode });
    console.log(contract);
    await contract.init();
    console.log(`Deployed at: ${contract.$options.address}`);
}

main();