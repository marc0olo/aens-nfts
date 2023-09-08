require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const execSync = require('child_process').execSync;
const { AeSdk, CompilerHttp } = require('@aeternity/aepp-sdk');
const { utils } = require('@aeternity/aeproject');

const compiler = process.env.COMPILER;

const main = async () => {
    switch(compiler) {
        case 'HTTP':
            await runCompilerHttp();
            break;
        case 'CLI':
        default:
            await runCompilerCli();
            break;
    }
}

const runCompilerCli = async () => {
    execSync('./../aesophia_cli/v7.4.0 ../contracts/AENSWrapping.aes -i ../contracts -i ../contracts/interfaces -o ../generated_artifacts/bytecode-iris', { encoding: 'utf-8' });
    execSync('./../aesophia_cli/v7.4.0 --create_json_aci ../contracts/AENSWrapping.aes -i ../contracts -i ../contracts/interfaces -o ../generated_artifacts/aci-iris.json', { encoding: 'utf-8' });
}

const runCompilerHttp = async () => {
    const CONTRACT = '../contracts/AENSWrapping.aes';
    const sourceCode = utils.getContractContent(CONTRACT);
    const fileSystem = utils.getFilesystem(CONTRACT);

    const compilerUrl = process.env.COMPILER_URL ? process.env.COMPILER_URL : 'http://localhost:3080';
    const aeSdk = new AeSdk({
        onCompiler: new CompilerHttp(compilerUrl),
    });
    const contract = await aeSdk.initializeContract({ sourceCode, fileSystem });
    fs.writeFile('../generated_artifacts/aci-iris.json', JSON.stringify(contract._aci), (err) => {
        if (err) throw err;
    });
    fs.writeFile('../generated_artifacts/bytecode-iris', contract.$options.bytecode, (err) => {
        if (err) throw err;
    });
}

main();