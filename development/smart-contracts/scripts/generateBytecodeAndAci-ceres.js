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
    const output = execSync('./../aesophia_cli/v7.4.0 ../contracts/AENSWrappingCeres.aes -i ../contracts -i ../contracts/interfaces -o ../generated_artifacts/bytecode-ceres', { encoding: 'utf-8' });
    console.log('Output was:\n', output);
    // TODO aci
}

const runCompilerHttp = async () => {
    const CONTRACT = '../contracts/AENSWrappingCeres.aes';
    const sourceCode = utils.getContractContent(CONTRACT);
    const fileSystem = utils.getFilesystem(CONTRACT);

    const compilerUrl = process.env.COMPILER_CERES_URL ? process.env.COMPILER_CERES_URL : 'http://localhost:3081';
    const aeSdk = new AeSdk({
        onCompiler: new CompilerHttp(compilerUrl),
    });
    const contract = await aeSdk.initializeContract({ sourceCode, fileSystem });
    console.log(contract);
    fs.writeFile('../generated_artifacts/aci-ceres.json', JSON.stringify(contract._aci), (err) => {
        if (err) throw err;
    });
    fs.writeFile('../generated_artifacts/bytecode-ceres', contract.$options.bytecode, (err) => {
        if (err) throw err;
    });
}

main();