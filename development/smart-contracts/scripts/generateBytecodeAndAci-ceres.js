require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const { AeSdk, CompilerHttp } = require('@aeternity/aepp-sdk');
const { utils } = require('@aeternity/aeproject');

const CONTRACT = '../contracts/AENSWrappingCeres.aes';
const sourceCode = utils.getContractContent(CONTRACT);
const fileSystem = utils.getFilesystem(CONTRACT);

const compilerUrl = process.env.COMPILER_CERES_URL ? process.env.COMPILER_CERES_URL : 'http://localhost:3081';

const main = async () => {
    const aeSdk = new AeSdk({
        onCompiler: new CompilerHttp(compilerUrl),
    });
    const contract = await aeSdk.initializeContract({ sourceCode, fileSystem });
    fs.writeFile('../generated_artifacts/aci-ceres.json', JSON.stringify(contract._aci), (err) => {
        if (err) throw err;
    });
    fs.writeFile('../generated_artifacts/bytecode-ceres', contract.$options.bytecode, (err) => {
        if (err) throw err;
    });
}

main();