require('dotenv').config({ path: '.env.local' });
const { AeSdk, CompilerHttp, MemoryAccount, Node } = require('@aeternity/aepp-sdk');

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

const compilerUrl = process.env.COMPILER_URL ? process.env.COMPILER_URL : 'http://localhost:3080';
const contractId = process.env.CONTRACT_ID;

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
        onCompiler: new CompilerHttp(compilerUrl),
        nodes: [
          { name: AE_NETWORK, instance: node },
        ],
        accounts: [new MemoryAccount(process.env.SECRET_KEY_ACCOUNT_1)],
    });

    // replace if needed, make sure to have enough AE balance to cover the name fee
    const name = 'WrappingNamesIsFunAnd1337.chain';
    const preClaimTx = await aeSdk.aensPreclaim(name);
    // note: there will be a "timeout" until a new keyblock is mined before the actual NameClaimTx can be mined
    await aeSdk.aensClaim(name, preClaimTx.salt);

    const contract = await aeSdk.initializeContract({ aci, address: contractId });
    const delegationSignature = await aeSdk.createDelegationSignature(contractId, [name]);
    const namesDelegationSigs = new Map([[name, delegationSignature]]);
    
    const nftId = (await contract.wrap_and_mint(namesDelegationSigs)).decodedResult;
    const nftData = (await contract.get_nft_data(nftId)).decodedResult;
    console.log(`NFT ID: ${nftId}`);
    console.log(`NFT data: ${JSON.stringify(nftData)}`);
}

main();