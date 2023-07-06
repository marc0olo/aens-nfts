const fs = require('fs');
const { AeSdk, CompilerHttp } = require('@aeternity/aepp-sdk');
const { utils } = require('@aeternity/aeproject');

const CONTRACT = '../contracts/AENSWrapping.aes';
const sourceCode = utils.getContractContent(CONTRACT);
const fileSystem = utils.getFilesystem(CONTRACT);

const main = async () => {
    const aeSdk = new AeSdk({
        onCompiler: new CompilerHttp('https://v7.compiler.aeternity.io'),
    });
    const contract = await aeSdk.initializeContract({ sourceCode, fileSystem });
    fs.writeFile('../generated_artifacts/aci.json', JSON.stringify(contract._aci), (err) => {
        if (err) throw err;
    });
    fs.writeFile('../generated_artifacts/bytecode', contract.$options.bytecode, (err) => {
        if (err) throw err;
    });
}

main();