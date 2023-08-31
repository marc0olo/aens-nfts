const chaiAsPromised = require('chai-as-promised');
const { assert, expect, use } = require('chai');

const { utils } = require('@aeternity/aeproject');
const { AeSdk, CompilerHttp, Node } = require('@aeternity/aepp-sdk');

use(chaiAsPromised);

const AENS_WRAPPING_SOURCE = './contracts/AENSWrapping.aes';
const DUMMY_SOURCE = './contracts/test/Dummy.aes';
const NFT_RECEIVER_SOURCE = './contracts/test/NFTReceiver.aes';

describe('AENSWrapping', () => {
  let aeSdk;
  let contract;
  let contractId;
  let contractAccountAddress;
  let dummyContract;
  let dummyContractId;
  let dummyContractAddress;
  let nftReceiverContract;
  let nftReceiverContractId;
  let nftReceiverContractAddress;

  const aensNamesUnsorted = [
    "aaaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA.chain",
    "bbbBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.chain",
    "cccCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC.chain",
    "dddDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD.chain",
    "eeeEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE.chain",
    "fffFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF.chain",
    "gggGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG.chain",
    "hhhHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH.chain",
    "iiiIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII.chain",
    "jjjJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ.chain",
    "kkkKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK.chain",
    "lllLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLL.chain",
    "mmmMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM.chain",
    "nnnNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN.chain",
    "oooOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO.chain",
    "pppPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP.chain",
    "qqqQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ.chain",
    "rrrRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR.chain",
    "sssSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS.chain",
    "tttTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT.chain",
    "uuuUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUU.chain",
    "vvvVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV.chain",
    "wwwWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.chain",
    "xxxXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.chain",
    "yyyYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY.chain",
    "zzzZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ.chain",
    "aaaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA1.chain",
    "bbbBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB1.chain",
    "cccCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC1.chain",
    "dddDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD1.chain",
    "eeeEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE1.chain",
    "fffFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF1.chain",
    "gggGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG1.chain",
    "hhhHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH1.chain",
    "iiiIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII1.chain",
    "jjjJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ1.chain",
    "kkkKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK1.chain",
    "lllLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLL1.chain",
    "mmmMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM1.chain",
    "nnnNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN1.chain",
    "oooOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO1.chain",
    "pppPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP1.chain",
    "qqqQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ1.chain",
    "rrrRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR1.chain",
    "sssSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS1.chain",
    "tttTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT1.chain",
    "uuuUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUU1.chain",
    "vvvVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV1.chain",
    "wwwWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW1.chain",
    "xxxXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX1.chain", // 50 names
    // "yyyYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY1.chain",
    // "zzzZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ1.chain",
    // "aaaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA2.chain",
    // "bbbBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB2.chain",
    // "cccCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC2.chain",
    // "dddDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD2.chain",
    // "eeeEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE2.chain",
    // "fffFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF2.chain",
    // "gggGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG2.chain",
    // "hhhHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH2.chain",
    // "iiiIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII2.chain",
    // "jjjJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ2.chain",
    // "kkkKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK2.chain",
    // "lllLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLL2.chain",
    // "mmmMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM2.chain",
    // "nnnNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN2.chain",
    // "oooOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO2.chain",
    // "pppPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP2.chain",
    // "qqqQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ2.chain",
    // "rrrRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR2.chain",
    // "sssSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS2.chain",
    // "tttTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT2.chain",
    // "uuuUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUU2.chain",
    // "vvvVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV2.chain",
    // "wwwWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW2.chain",
    // "xxxXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX2.chain",
    // "yyyYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY2.chain",
    // "zzzZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ2.chain",
    // "aaaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA3.chain",
    // "bbbBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB3.chain",
    // "cccCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC3.chain",
    // "dddDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD3.chain",
    // "eeeEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE3.chain",
    // "fffFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF3.chain",
    // "gggGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG3.chain",
    // "hhhHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH3.chain",
    // "iiiIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII3.chain",
    // "jjjJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ3.chain",
    // "kkkKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK3.chain",
    // "lllLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLL3.chain",
    // "mmmMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM3.chain",
    // "nnnNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN3.chain",
    // "oooOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO3.chain",
    // "pppPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP3.chain",
    // "qqqQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ3.chain",
    // "rrrRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR3.chain",
    // "sssSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS3.chain",
    // "tttTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT3.chain",
    // "uuuUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUU3.chain",
    // "vvvVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV3.chain"
  ];

  console.log(`Name count: ${aensNamesUnsorted.length}`);

  const aensNames = aensNamesUnsorted.sort();

  const aensNamesLowercase = [];
  aensNames.forEach(name => aensNamesLowercase.push(name.toLowerCase()));

  const oneAe = 1_000_000_000_000_000_000n;

  const globalConfig = {
    reward: 1_337n,
    reward_block_window: 179_950n,
    emergency_reward: 1_000_000n,
    emergency_reward_block_window: 179_900n,
    can_receive_from_others: true,
    burnable_if_expired_or_empty: false
  }

  let namesDelegationSigs;

  const nameLimit = 50;

  const aeSdkCeres = new AeSdk({
    accounts: utils.getDefaultAccounts(),
    nodes: [{ name: 'node', instance: new Node("http://localhost:3001", { ignoreVersion: true }) }],
    onCompiler: new CompilerHttp("http://localhost:3081"), // ceres compatible compiler
    interval: 50,
  });

  before(async () => {
    aeSdk = utils.getSdk();

    // rollback to first keyblock
    await utils.rollbackHeight(aeSdk, 0);
    // stupid but strange, opened an issue here: https://github.com/aeternity/aeproject/issues/493
    assert.equal(await aeSdk.getHeight(), 2);

    // activate iris
    await utils.awaitKeyBlocks(aeSdk, 3);
    assert.equal(await aeSdk.getHeight(), 5);
    let nodeInfo = await aeSdk.getNodeInfo();
    assert.equal(nodeInfo.consensusProtocolVersion, 5);

    // initialize the contract instance BEFORE Ceres (to use FATEv2 and allow interaction with "old" AENS pointer types)
    contract = await aeSdk.initializeContract({
      sourceCode: utils.getContractContent(AENS_WRAPPING_SOURCE),
      fileSystem: utils.getFilesystem(AENS_WRAPPING_SOURCE)
    });
    await contract.init("Wrapped AENS", "WAENS", 180_000, nameLimit, aeSdk.selectedAddress);
    contractId = contract.$options.address;
    contractAccountAddress = contractId.replace("ct_", "ak_");

    dummyContract = await aeSdk.initializeContract({
      sourceCode: utils.getContractContent(DUMMY_SOURCE),
      fileSystem: utils.getFilesystem(DUMMY_SOURCE)
    });
    await dummyContract.$deploy([]);
    dummyContractId = dummyContract.$options.address;
    dummyContractAddress = dummyContractId.replace("ct_", "ak_");

    nftReceiverContract = await aeSdk.initializeContract({
      sourceCode: utils.getContractContent(NFT_RECEIVER_SOURCE),
      fileSystem: utils.getFilesystem(NFT_RECEIVER_SOURCE)
    });
    await nftReceiverContract.$deploy([]);
    nftReceiverContractId = nftReceiverContract.$options.address;
    nftReceiverContractAddress = nftReceiverContractId.replace("ct_", "ak_");

    // activate ceres
    assert.equal(await aeSdk.getHeight(), 8);
    await utils.awaitKeyBlocks(aeSdk, 13);
    assert.equal(await aeSdk.getHeight(), 21);
    nodeInfo = await aeSdk.getNodeInfo();
    assert.equal(nodeInfo.consensusProtocolVersion, 6);

    // claim AENS names if needed
    if(await isClaimNeeded(aensNames)) {
      await claimNames(aensNames);
    }
    
    // create delegation signature map for all names
    namesDelegationSigs = await getDelegationSignatures(aensNames, contractId);

    // create a snapshot of the blockchain state
    await utils.createSnapshot(aeSdk);
  });

  // after each test roll back to initial state
  afterEach(async () => {
    await utils.rollbackSnapshot(aeSdk);
  });

  async function isClaimNeeded(names) {
    if(names.length > 0 ){
      try {
        await aeSdk.aensQuery(names[0]);
      } catch(e) {
        return true;
      }
    }
    return false;
  }

  async function claimNames(names) {
    console.log(`BEGIN: claiming ${names.length} names ...`);
    for (const name of names) {
      const preClaimTx = await aeSdk.aensPreclaim(name);
      await aeSdk.aensClaim(name, preClaimTx.salt);
    }
    console.log(`END: claiming names`);
  }

  function getExpectedNftMetadataMap(names) {
    const nftMetadataMap = new Map();
    for(const name of names) {
      nftMetadataMap.set(name, "");
    }
    return nftMetadataMap;
  }

  async function expectNameAttributesProtocol(names, expectedNameAttributes) {
    for (const name of names) {
      const nameInstance = await aeSdk.aensQuery(name);
      if (expectedNameAttributes.owner)
        assert.equal(nameInstance.owner, expectedNameAttributes.owner);
      if (expectedNameAttributes.ttl)
        assert.equal(nameInstance.ttl, expectedNameAttributes.ttl);
    }
  }

  async function expectNameOwnerContract(names, expectedOwner) {
    for (const name of names) {
      const resolveOwnerDryRun = await contract.resolve_owner(name);
      assert.equal(resolveOwnerDryRun.decodedResult, expectedOwner);
    }
  }

  async function expectNftNameExpirationHeightContract(tokenId, expectedExpirationHeight) {
    const getExpirationByNftIdDryRun = await contract.get_expiration_by_nft_id(tokenId);
    assert.equal(getExpirationByNftIdDryRun.decodedResult, expectedExpirationHeight);
  }

  async function expectNameNftId(names, tokenId) {
    for (const name of names) {
      const resolveNftIdDryRun = await contract.resolve_nft_id(name);
      assert.equal(resolveNftIdDryRun.decodedResult, tokenId);
    }
  }

  async function expectNftMetadataMap(nftId, expectedNftMetadataMap) {
    let metadataMap = (await contract.metadata(nftId)).decodedResult.MetadataMap[0];
    assert.deepEqual(metadataMap, expectedNftMetadataMap);
  }

  async function getDelegationSignatures(names, contractId, onAccount = utils.getDefaultAccounts()[0]) {
    return new Map(
      await Promise.all(
        names.map(async (name) => [name, await aeSdk.createDelegationSignature(contractId, [name], { onAccount })])
      )
    );
  }

  function getTotalTxCosts(txResult) {
    const txFee = txResult.txData.tx.fee;
    const gasCosts = BigInt(txResult.result.gasUsed) * txResult.result.gasPrice;
    return txFee + gasCosts;
  }

  describe('AENS Wrapping', () => {

    describe('Happy paths', () => {

      it('wrap_and_mint', async () => {
        await expectNameAttributesProtocol(aensNames, {owner: aeSdk.selectedAddress});
        await expectNameOwnerContract(aensNames, undefined);
        await expectNameNftId(aensNames, undefined);
  
        const oldHeight = await aeSdk.getHeight();
        const heightDiff = 5;
        await utils.awaitKeyBlocks(aeSdk, heightDiff);
        const newHeight = await aeSdk.getHeight();
  
        assert.equal(newHeight, oldHeight + heightDiff);
  
        const maxRelativeTtl = 180_000;
        const expectedTtl = newHeight + maxRelativeTtl;

        const wrapAndMintTx = await contract.wrap_and_mint(namesDelegationSigs);
        
        console.log(`Gas used (wrap_and_mint with ${aensNames.length} names): ${wrapAndMintTx.result.gasUsed}`);
  
        for(let i=0; i<aensNamesLowercase.length; i++) {
          assert.equal(wrapAndMintTx.decodedEvents[i].name, 'NameWrap');
          assert.equal(wrapAndMintTx.decodedEvents[i].args[0], aensNamesLowercase[aensNamesLowercase.length-(i+1)]);
          assert.equal(wrapAndMintTx.decodedEvents[i].args[1], 1);
          assert.equal(wrapAndMintTx.decodedEvents[i].args[2], aeSdk.selectedAddress);
          assert.equal(wrapAndMintTx.decodedEvents[i].args[3], expectedTtl);
        }
  
        assert.equal(wrapAndMintTx.decodedEvents[aensNames.length].name, 'Mint');
        assert.equal(wrapAndMintTx.decodedEvents[aensNames.length].args[0], aeSdk.selectedAddress);
        assert.equal(wrapAndMintTx.decodedEvents[aensNames.length].args[1], 1);
  
        await expectNameAttributesProtocol(aensNames, {owner: contractAccountAddress, ttl: expectedTtl });
        await expectNameOwnerContract(aensNames, aeSdk.selectedAddress);
        await expectNameNftId(aensNames, 1);
        await expectNftNameExpirationHeightContract(1, expectedTtl);
  
        const nftMetadataDryRun = await contract.metadata(1);
        assert.equal(nftMetadataDryRun.decodedResult.MetadataMap[0].size, aensNames.length);
      });
  
      it('wrap_single', async () => {
        const tokenId = (await contract.mint(aeSdk.selectedAddress)).decodedResult;
  
        // claim a new name
        const wrapSingleTestName = "wrapSingleTestName.chain";
        const preClaimTx = await aeSdk.aensPreclaim(wrapSingleTestName);
        await aeSdk.aensClaim(wrapSingleTestName, preClaimTx.salt);
  
        // pre-check logic
        const nftExpirationHeight = (await contract.get_expiration_by_nft_id(tokenId)).decodedResult;
        const delegationSig = await aeSdk.createDelegationSignature(contractId, [wrapSingleTestName])
  
        // check before wrapping
        let nameInstance = await aeSdk.aensQuery(wrapSingleTestName);
        let metadataMap = (await contract.metadata(tokenId)).decodedResult.MetadataMap[0];
        assert.equal(nameInstance.owner, aeSdk.selectedAddress);
        assert.equal(metadataMap.size, 0);
        assert.notEqual(nameInstance.ttl, nftExpirationHeight);
  
        const wrapSingleTx = await contract.wrap_single(tokenId, wrapSingleTestName, delegationSig);
        console.log(`Gas used (wrap_single): ${wrapSingleTx.result.gasUsed}`);
  
        // check after wrapping
        nameInstance = await aeSdk.aensQuery(wrapSingleTestName);
        metadataMap = (await contract.metadata(tokenId)).decodedResult.MetadataMap[0];
        assert.equal(nameInstance.owner, contractAccountAddress);
        assert.equal(metadataMap.size, 1);
        assert.isTrue(metadataMap.has(wrapSingleTestName.toLowerCase()));
        assert.equal(nameInstance.ttl, nftExpirationHeight);
      });
  
      it('wrap_multiple', async () => {
        // mint an empty NFT
        const mintTx = await contract.mint(aeSdk.selectedAddress);
        console.log(`Gas used (mint): ${mintTx.result.gasUsed}`);
  
        // check before wrapping
        await expectNftMetadataMap(1, new Map());
        await expectNameAttributesProtocol(aensNames, { owner: aeSdk.selectedAddress })
  
        const wrapMultipleTx = await contract.wrap_multiple(1, namesDelegationSigs);
        console.log(`Gas used (wrap_multiple with ${aensNames.length} names): ${wrapMultipleTx.result.gasUsed}`);
  
        // check after wrapping
        const nftExpirationHeight = (await contract.get_expiration_by_nft_id(1)).decodedResult;
        await expectNameAttributesProtocol(aensNames, { owner: contractAccountAddress, ttl: nftExpirationHeight })
        await expectNftMetadataMap(1, getExpectedNftMetadataMap(aensNamesLowercase));
      });
  
      it('unwrap_single', async () => {
        // prepare: wrap names
        await contract.wrap_and_mint(namesDelegationSigs);
  
        // check after wrapping
        await expectNftMetadataMap(1, getExpectedNftMetadataMap(aensNamesLowercase));
        await expectNameAttributesProtocol(aensNames, { owner: contractAccountAddress });
  
        // unwrap single name from nft
        const unwrapSingleTx = await contract.unwrap_single(1, aensNames[0]);
        console.log(`Gas used (unwrap_single): ${unwrapSingleTx.result.gasUsed}`);
  
        // check after unwrapping
        await expectNftMetadataMap(1, getExpectedNftMetadataMap(aensNamesLowercase.slice(1)));
        await expectNameAttributesProtocol(aensNames.slice(1), { owner: contractAccountAddress });
        await expectNameAttributesProtocol([aensNames[0]], { owner: aeSdk.selectedAddress });
      });
  
      it('unwrap_multiple', async () => {
        // prepare: wrap names
        await contract.wrap_and_mint(namesDelegationSigs);
  
        // check after wrapping
        await expectNftMetadataMap(1, getExpectedNftMetadataMap(aensNamesLowercase));
        await expectNameAttributesProtocol(aensNames, { owner: contractAccountAddress });
  
        // unwrap multiple names from nft
        const unwrapMultipleTx = await contract.unwrap_multiple(1, aensNames);
        console.log(`Gas used (unwrap_multiple with ${aensNames.length} names): ${unwrapMultipleTx.result.gasUsed}`);
  
        // check after unwrapping
        await expectNftMetadataMap(1, getExpectedNftMetadataMap(new Map()));
        await expectNameAttributesProtocol(aensNames, { owner: aeSdk.selectedAddress });
      });
  
      it('unwrap_all', async () => {
        // prepare: wrap names
        await contract.wrap_and_mint(namesDelegationSigs);
  
        // check after wrapping
        await expectNftMetadataMap(1, getExpectedNftMetadataMap(aensNamesLowercase));
        await expectNameAttributesProtocol(aensNames, { owner: contractAccountAddress });
  
        // unwrap multiple names from nft
        const unwrapAllTx = await contract.unwrap_all(1);
        console.log(`Gas used (unwrap_all for ${aensNames.length} names): ${unwrapAllTx.result.gasUsed}`);
  
        // check after unwrapping
        await expectNftMetadataMap(1, getExpectedNftMetadataMap(new Map()));
        await expectNameAttributesProtocol(aensNames, { owner: aeSdk.selectedAddress });
      });
  
      it('transfer_single', async () => {
        // prepare: wrap names
        await contract.wrap_and_mint(namesDelegationSigs);
  
        // prepare: mint an empty NFT on other account
        const otherAccount = utils.getDefaultAccounts()[1];
        const mintTx = await contract.mint(otherAccount.address, undefined, undefined, { onAccount: otherAccount });
        console.log(`Gas used (mint): ${mintTx.result.gasUsed}`);
  
        // checks after nft creation
        let ownerDryRunTx = await contract.owner(1);
        assert.equal(ownerDryRunTx.decodedResult, aeSdk.selectedAddress);
        ownerDryRunTx = await contract.owner(2);
        assert.equal(ownerDryRunTx.decodedResult, otherAccount.address);
        await expectNameOwnerContract(aensNames, aeSdk.selectedAddress);
        await expectNameNftId(aensNames, 1);
  
        // check TTL / expiration height of nft & names before transfer
        const expirationHeightNftOne = (await contract.get_expiration_by_nft_id(1)).decodedResult;
        const expirationHeightNftTwo = (await contract.get_expiration_by_nft_id(2)).decodedResult;
        assert.notEqual(expirationHeightNftTwo, expirationHeightNftOne);
        expectNameAttributesProtocol(aensNames, { owner: contractAccountAddress, ttl: expirationHeightNftOne });
  
        // set global config to allow receiving names
        await contract.set_global_config(globalConfig, { onAccount: otherAccount });

        // transfer a single name to another NFT
        const transferSingleTx = await contract.transfer_single(1, 2, aensNames[0]);
        console.log(`Gas used (transfer_single): ${transferSingleTx.result.gasUsed}`);

        // check NameTransfer event
        assert.equal(transferSingleTx.decodedEvents[0].name, 'NameTransfer');
        assert.equal(transferSingleTx.decodedEvents[0].args[0], aensNamesLowercase[0]);
        assert.equal(transferSingleTx.decodedEvents[0].args[1], 1);
        assert.equal(transferSingleTx.decodedEvents[0].args[2], 2);
  
        // check after transfer
        await expectNameOwnerContract(aensNames.slice(1), aeSdk.selectedAddress);
        await expectNameOwnerContract([aensNames[0]], otherAccount.address);
        await expectNameNftId(aensNames.slice(1), 1);
        await expectNftMetadataMap(1, getExpectedNftMetadataMap((aensNamesLowercase.slice(1))));
        await expectNameNftId([aensNames[0]], 2);
        await expectNftMetadataMap(2, getExpectedNftMetadataMap((([aensNamesLowercase[0]]))));
  
        // check TTL / expiration height of nft & names after transfer
        expectNameAttributesProtocol(aensNames.slice(1), { owner: contractAccountAddress, ttl: expirationHeightNftOne });
        expectNameAttributesProtocol([aensNames[0]], { owner: contractAccountAddress, ttl: expirationHeightNftTwo });
      });

      it('transfer_multiple', async () => {
        // prepare: wrap names
        await contract.wrap_and_mint(namesDelegationSigs);
  
        // prepare: mint an empty NFT on other account
        const otherAccount = utils.getDefaultAccounts()[1];
        const mintTx = await contract.mint(otherAccount.address, undefined, undefined, { onAccount: otherAccount });
        console.log(`Gas used (mint): ${mintTx.result.gasUsed}`);
  
        // checks after nft creation
        let ownerDryRunTx = await contract.owner(1);
        assert.equal(ownerDryRunTx.decodedResult, aeSdk.selectedAddress);
        ownerDryRunTx = await contract.owner(2);
        assert.equal(ownerDryRunTx.decodedResult, otherAccount.address);
        await expectNameOwnerContract(aensNames, aeSdk.selectedAddress);
        await expectNameNftId(aensNames, 1);
  
        // check TTL / expiration height of nft & names before transfer
        const expirationHeightNftOne = (await contract.get_expiration_by_nft_id(1)).decodedResult;
        const expirationHeightNftTwo = (await contract.get_expiration_by_nft_id(2)).decodedResult;
        assert.notEqual(expirationHeightNftTwo, expirationHeightNftOne);
        expectNameAttributesProtocol(aensNames, { owner: contractAccountAddress, ttl: expirationHeightNftOne });
        let nftDataOne = (await contract.get_nft_data(1)).decodedResult
        assert.deepEqual(nftDataOne, {id: 1n, owner: aeSdk.selectedAddress, owner_config: undefined, names: aensNamesLowercase, expiration_height: expirationHeightNftOne});
        let nftDataTwo = (await contract.get_nft_data(2)).decodedResult;
        assert.deepEqual(nftDataTwo, {id: 2n, owner: otherAccount.address, owner_config: undefined, names: [], expiration_height: expirationHeightNftTwo});
  
        // set global config to allow receiving names
        await contract.set_global_config(globalConfig, { onAccount: otherAccount });

        // transfer multiple names to another NFT
        const transferMultipleTx = await contract.transfer_multiple(1, 2, aensNames);
        console.log(`Gas used (transfer_multiple with ${aensNames.length} names): ${transferMultipleTx.result.gasUsed}`);

        // check NameTransfer event
        for(let i=0; i<aensNamesLowercase.length; i++) {
          assert.equal(transferMultipleTx.decodedEvents[i].name, 'NameTransfer');
          assert.equal(transferMultipleTx.decodedEvents[i].args[0], aensNamesLowercase[aensNamesLowercase.length-(i+1)]);
          assert.equal(transferMultipleTx.decodedEvents[i].args[1], 1);
          assert.equal(transferMultipleTx.decodedEvents[i].args[2], 2);
        }
  
        // check after transfer
        await expectNftMetadataMap(1, new Map());
        await expectNameOwnerContract(aensNames, otherAccount.address);
        await expectNftMetadataMap(2, getExpectedNftMetadataMap(aensNamesLowercase));
        await expectNameNftId(aensNames, 2);
        nftDataOne = (await contract.get_nft_data(1)).decodedResult
        assert.deepEqual(nftDataOne, {id: 1n, owner: aeSdk.selectedAddress, owner_config: undefined, names: [], expiration_height: expirationHeightNftOne});
        nftDataTwo = (await contract.get_nft_data(2)).decodedResult;
        assert.deepEqual(nftDataTwo, {id: 2n, owner: otherAccount.address, owner_config: globalConfig, names: aensNamesLowercase, expiration_height: expirationHeightNftTwo});
  
        // check TTL / expiration height of nft & names after transfer
        expectNameAttributesProtocol(aensNames, { owner: contractAccountAddress, ttl: expirationHeightNftTwo });
      });

      it('transfer_all', async () => {
        // prepare: wrap names
        await contract.wrap_and_mint(namesDelegationSigs);
  
        // prepare: mint an empty NFT on other account
        const otherAccount = utils.getDefaultAccounts()[1];
        const mintTx = await contract.mint(otherAccount.address, undefined, undefined, { onAccount: otherAccount });
        console.log(`Gas used (mint): ${mintTx.result.gasUsed}`);
  
        // check TTL / expiration height of nft & names before transfer
        const expirationHeightNftTwo = (await contract.get_expiration_by_nft_id(2)).decodedResult;
  
        // allow token 2 to receive names
        await contract.set_global_config(globalConfig, { onAccount: otherAccount });

        // transfer multiple names to another NFT
        const transferAllTx = await contract.transfer_all(1, 2);
        console.log(`Gas used (transfer_all for ${aensNames.length} names): ${transferAllTx.result.gasUsed}`);

        // check NameTransfer event
        for(let i=0; i<aensNamesLowercase.length; i++) {
          assert.equal(transferAllTx.decodedEvents[i].name, 'NameTransfer');
          assert.equal(transferAllTx.decodedEvents[i].args[0], aensNamesLowercase[aensNamesLowercase.length-(i+1)]);
          assert.equal(transferAllTx.decodedEvents[i].args[1], 1);
          assert.equal(transferAllTx.decodedEvents[i].args[2], 2);
        }

        // check after transfer
        await expectNftMetadataMap(1, new Map());
        await expectNameOwnerContract(aensNames, otherAccount.address);
        await expectNftMetadataMap(2, getExpectedNftMetadataMap(aensNamesLowercase));
        await expectNameNftId(aensNames, 2);
  
        // check TTL / expiration height of nft & names after transfer
        expectNameAttributesProtocol(aensNames, { owner: contractAccountAddress, ttl: expirationHeightNftTwo });
      });

      it('transfer (NFT)', async () => {
        // prepare: wrap names
        await contract.wrap_and_mint(namesDelegationSigs);
  
        const otherAccount = utils.getDefaultAccounts()[1];

        // check owner before transfer
        await expectNameOwnerContract(aensNames, aeSdk.selectedAddress);
        let ownerDryRunTx = await contract.owner(1);
        assert.equal(ownerDryRunTx.decodedResult, aeSdk.selectedAddress);

        let resolveNftIdAndOwnerTxDryRun = await contract.resolve_nft_id_and_owner(aensNames[0]);
        assert.deepEqual(resolveNftIdAndOwnerTxDryRun.decodedResult, [1n, aeSdk.selectedAddress]);

        // transfer NFT to other account
        const transferTx = await contract.transfer(otherAccount.address, 1);
        console.log(`Gas used (transfer): ${transferTx.result.gasUsed}`);

        // check Transfer event
        assert.equal(transferTx.decodedEvents[0].name, 'Transfer');
        assert.equal(transferTx.decodedEvents[0].args[0], aeSdk.selectedAddress);
        assert.equal(transferTx.decodedEvents[0].args[1], otherAccount.address);
        assert.equal(transferTx.decodedEvents[0].args[2], 1);

        // check after transfer
        await expectNameOwnerContract(aensNames, otherAccount.address);
        ownerDryRunTx = await contract.owner(1);
        assert.equal(ownerDryRunTx.decodedResult, otherAccount.address);
        resolveNftIdAndOwnerTxDryRun = await contract.resolve_nft_id_and_owner(aensNames[0]);
        assert.deepEqual(resolveNftIdAndOwnerTxDryRun.decodedResult, [1n, otherAccount.address]);
      });

      it('transfer_multiple_nfts', async () => {
        // prepare: wrap names
        await contract.wrap_and_mint(namesDelegationSigs);

        await contract.mint(aeSdk.selectedAddress);
  
        const otherAccount = utils.getDefaultAccounts()[1];

        // check owner before transfer
        await expectNameOwnerContract(aensNames, aeSdk.selectedAddress);
        let ownerDryRunTx = await contract.owner(1);
        assert.equal(ownerDryRunTx.decodedResult, aeSdk.selectedAddress);
        ownerDryRunTx = await contract.owner(2);
        assert.equal(ownerDryRunTx.decodedResult, aeSdk.selectedAddress);
        let resolveNftIdAndOwnerTxDryRun = await contract.resolve_nft_id_and_owner(aensNames[0]);
        assert.deepEqual(resolveNftIdAndOwnerTxDryRun.decodedResult, [1n, aeSdk.selectedAddress]);

        // transfer NFTs to other account
        const transferMultipleNftsTx = await contract.transfer_multiple_nfts(otherAccount.address, [1, 2]);
        console.log(`Gas used (transfer_multiple_nfts): ${transferMultipleNftsTx.result.gasUsed}`);

        // check Transfer events
        assert.equal(transferMultipleNftsTx.decodedEvents[0].name, 'Transfer');
        assert.equal(transferMultipleNftsTx.decodedEvents[0].args[0], aeSdk.selectedAddress);
        assert.equal(transferMultipleNftsTx.decodedEvents[0].args[1], otherAccount.address);
        assert.equal(transferMultipleNftsTx.decodedEvents[0].args[2], 2);
        assert.equal(transferMultipleNftsTx.decodedEvents[1].name, 'Transfer');
        assert.equal(transferMultipleNftsTx.decodedEvents[1].args[0], aeSdk.selectedAddress);
        assert.equal(transferMultipleNftsTx.decodedEvents[1].args[1], otherAccount.address);
        assert.equal(transferMultipleNftsTx.decodedEvents[1].args[2], 1);

        // check after transfer
        await expectNameOwnerContract(aensNames, otherAccount.address);
        ownerDryRunTx = await contract.owner(1);
        assert.equal(ownerDryRunTx.decodedResult, otherAccount.address);
        ownerDryRunTx = await contract.owner(2);
        assert.equal(ownerDryRunTx.decodedResult, otherAccount.address);
        resolveNftIdAndOwnerTxDryRun = await contract.resolve_nft_id_and_owner(aensNames[0]);
        assert.deepEqual(resolveNftIdAndOwnerTxDryRun.decodedResult, [1n, otherAccount.address]);
      });

      it('extend_all', async () => {
        // prepare: wrap names
        await contract.wrap_and_mint(namesDelegationSigs);

        // move 10 blocks into the future
        await utils.awaitKeyBlocks(aeSdk, 10);

        // get height before extending
        const heightBeforeExtending = await aeSdk.getHeight();
        // extend names with other account, without distributing any reward
        const otherAccount = utils.getDefaultAccounts()[1];
        const extendAllTx = await contract.extend_all(1, { onAccount: otherAccount });
        console.log(`Gas used (extend_all with ${aensNames.length} names): ${extendAllTx.result.gasUsed}`);

        const expectedNewExpirationHeight = heightBeforeExtending + 180_000;

        // check NameExtend event
        for(let i=0; i<aensNamesLowercase.length; i++) {
          assert.equal(extendAllTx.decodedEvents[i].name, 'NameExtend');
          assert.equal(extendAllTx.decodedEvents[i].args[0], aensNamesLowercase[aensNamesLowercase.length-(i+1)]);
          assert.equal(extendAllTx.decodedEvents[i].args[1], 1);
          assert.equal(extendAllTx.decodedEvents[i].args[2], expectedNewExpirationHeight);
          assert.equal(extendAllTx.decodedEvents[i].args[3], otherAccount.address);
        }

        // check correct expiration height after extending
        const newExpirationHeight = (await contract.get_expiration_by_nft_id(1)).decodedResult;
        assert.equal(newExpirationHeight, expectedNewExpirationHeight);
        await expectNameAttributesProtocol(aensNames, { ttl: expectedNewExpirationHeight });
      });

      it('set_global_config, set_nft_config, remove_nft_config & remove_global_config', async () => {
        await contract.mint(aeSdk.selectedAddress);

        // pre config checks
        const expirationHeight = (await contract.get_expiration_by_nft_id(1)).decodedResult;
        let nftDataOne = (await contract.get_nft_data(1)).decodedResult;
        assert.deepEqual(nftDataOne, {id: 1n, owner: aeSdk.selectedAddress, owner_config: undefined, names: [], expiration_height: expirationHeight});
        let config = (await contract.get_global_config(aeSdk.selectedAddress)).decodedResult;
        assert.deepEqual(config, undefined);
      
        // set global config
        await contract.set_global_config(globalConfig);

        // check global config
        config = (await contract.get_global_config(aeSdk.selectedAddress)).decodedResult;
        assert.deepEqual(config, globalConfig);
        // check nft data
        nftDataOne = (await contract.get_nft_data(1)).decodedResult;
        assert.deepEqual(nftDataOne, {id: 1n, owner: aeSdk.selectedAddress, owner_config: globalConfig, names: [], expiration_height: expirationHeight});

        // set nft config
        const nftConfig = {
          reward: 1n,
          reward_block_window: 10n,
          emergency_reward: 1_000n,
          emergency_reward_block_window: 1n,
          can_receive_from_others: true,
          burnable_if_expired_or_empty: true
        }
        await contract.set_nft_config(1, nftConfig);

        // check global config
        config = (await contract.get_global_config(aeSdk.selectedAddress)).decodedResult;
        assert.deepEqual(config, globalConfig);
        // check nft data
        nftDataOne = (await contract.get_nft_data(1)).decodedResult;
        assert.deepEqual(nftDataOne, {id: 1n, owner: aeSdk.selectedAddress, owner_config: nftConfig, names: [], expiration_height: expirationHeight});

        // remove nft config
        await contract.remove_nft_config(1);

        // check nft data
        nftDataOne = (await contract.get_nft_data(1)).decodedResult;
        assert.deepEqual(nftDataOne, {id: 1n, owner: aeSdk.selectedAddress, owner_config: globalConfig, names: [], expiration_height: expirationHeight});

        // remove global config
        await contract.remove_global_config();

        // after removal checks
        nftDataOne = (await contract.get_nft_data(1)).decodedResult;
        assert.deepEqual(nftDataOne, {id: 1n, owner: aeSdk.selectedAddress, owner_config: undefined, names: [], expiration_height: expirationHeight});
        config = (await contract.get_global_config(aeSdk.selectedAddress)).decodedResult;
        assert.deepEqual(config, undefined);
      });

      it('deposit_to_reward_pool, withdraw_from_reward_pool & get_reward_pool', async () => {
        // check before deposit
        let rewardPool = (await contract.get_reward_pool(aeSdk.selectedAddress)).decodedResult;
        assert.equal(rewardPool, 0n);

        // deposit
        await contract.deposit_to_reward_pool({ amount: oneAe });

        // check after deposit
        rewardPool = (await contract.get_reward_pool(aeSdk.selectedAddress)).decodedResult;
        assert.equal(rewardPool, oneAe);

        // withdraw tenth
        const toWithdraw = oneAe / 10n;
        await contract.withdraw_from_reward_pool(toWithdraw);

        // check after withdraw
        rewardPool = (await contract.get_reward_pool(aeSdk.selectedAddress)).decodedResult;
        assert.equal(rewardPool, oneAe - toWithdraw);

        // withdraw remaining balance
        await contract.withdraw_from_reward_pool();
        
        // check before deposit
        rewardPool = (await contract.get_reward_pool(aeSdk.selectedAddress)).decodedResult;
        assert.equal(rewardPool, 0n);
      });

      it('extend_all_for_reward (regular reward)', async () => {
        // prepare: wrap names
        await contract.wrap_and_mint(namesDelegationSigs);

        // set global config
        await contract.set_global_config(globalConfig);

        // deposit
        await contract.deposit_to_reward_pool({ amount: oneAe });

        // check before extending for reward
        let rewardPool = (await contract.get_reward_pool(aeSdk.selectedAddress)).decodedResult;
        assert.equal(rewardPool, oneAe);

        // extend for 0 reward
        const otherAccount = utils.getDefaultAccounts()[1];
        let extendAllForRewardTx = await contract.extend_all_for_reward(1, { onAccount: otherAccount });

        // check Reward event
        assert.equal(extendAllForRewardTx.decodedEvents[0].name, 'Reward');
        assert.equal(extendAllForRewardTx.decodedEvents[0].args[0], 1);
        assert.equal(extendAllForRewardTx.decodedEvents[0].args[1], otherAccount.address);
        assert.equal(extendAllForRewardTx.decodedEvents[0].args[2], 0);

        // get block height, expiration height and jump into the future
        let blockHeight = await aeSdk.getHeight();
        let expirationHeight = (await contract.get_expiration_by_nft_id(1)).decodedResult;
        let targetDelta = Number(expirationHeight) - Number(globalConfig.reward_block_window) - blockHeight + 1;
        await utils.awaitKeyBlocks(aeSdk, targetDelta);

        // get balance
        let oldBalance = BigInt(await aeSdk.getBalance(otherAccount.address));

        // extend for regular reward
        extendAllForRewardTx = await contract.extend_all_for_reward(1, { onAccount: otherAccount });
        console.log(`Gas used (extend_all_for_reward with ${aensNames.length} names and regular reward): ${extendAllForRewardTx.result.gasUsed}`);

        // get total tx costs
        let totalCosts = getTotalTxCosts(extendAllForRewardTx);

        // get balance after claiming reward
        let newBalance = BigInt(await aeSdk.getBalance(otherAccount.address));

        assert.equal(newBalance, oldBalance + globalConfig.reward - totalCosts);

        const totalRewardDistributed = (await contract.get_total_reward_distributed()).decodedResult;
        assert.equal(totalRewardDistributed, globalConfig.reward);

        // check Reward event
        assert.equal(extendAllForRewardTx.decodedEvents[0].name, 'Reward');
        assert.equal(extendAllForRewardTx.decodedEvents[0].args[0], 1);
        assert.equal(extendAllForRewardTx.decodedEvents[0].args[1], otherAccount.address);
        assert.equal(extendAllForRewardTx.decodedEvents[0].args[2], globalConfig.reward);
      });

      it('extend_all_for_reward (emergency reward)', async () => {
        // prepare: wrap names
        await contract.wrap_and_mint(namesDelegationSigs);

        // set global config
        await contract.set_global_config(globalConfig);

        // deposit
        await contract.deposit_to_reward_pool({ amount: oneAe });

        // check before extending for reward
        let rewardPool = (await contract.get_reward_pool(aeSdk.selectedAddress)).decodedResult;
        assert.equal(rewardPool, oneAe);

        // extend for 0 reward
        const otherAccount = utils.getDefaultAccounts()[1];
        let extendAllForRewardTx = await contract.extend_all_for_reward(1, { onAccount: otherAccount });

        // check Reward event
        assert.equal(extendAllForRewardTx.decodedEvents[0].name, 'Reward');
        assert.equal(extendAllForRewardTx.decodedEvents[0].args[0], 1);
        assert.equal(extendAllForRewardTx.decodedEvents[0].args[1], otherAccount.address);
        assert.equal(extendAllForRewardTx.decodedEvents[0].args[2], 0);

        // get block height, expiration height and jump into the future
        let blockHeight = await aeSdk.getHeight();
        let expirationHeight = (await contract.get_expiration_by_nft_id(1)).decodedResult;
        let targetDelta = Number(expirationHeight) - Number(globalConfig.emergency_reward_block_window) - blockHeight + 1;
        await utils.awaitKeyBlocks(aeSdk, targetDelta);

        // get balance
        let oldBalance = BigInt(await aeSdk.getBalance(otherAccount.address));

        // extend for emergency reward
        extendAllForRewardTx = await contract.extend_all_for_reward(1, { onAccount: otherAccount });
        console.log(`Gas used (extend_all_for_reward with ${aensNames.length} names and emergency reward): ${extendAllForRewardTx.result.gasUsed}`);

        // get total tx costs
        let totalCosts = getTotalTxCosts(extendAllForRewardTx);

        // get balance after claiming reward
        let newBalance = BigInt(await aeSdk.getBalance(otherAccount.address));

        assert.equal(newBalance, oldBalance + globalConfig.emergency_reward - totalCosts);

        // check Reward event
        assert.equal(extendAllForRewardTx.decodedEvents[0].name, 'Reward');
        assert.equal(extendAllForRewardTx.decodedEvents[0].args[0], 1);
        assert.equal(extendAllForRewardTx.decodedEvents[0].args[1], otherAccount.address);
        assert.equal(extendAllForRewardTx.decodedEvents[0].args[2], globalConfig.emergency_reward);
      });

      it('burn & burn_multiple_nfts', async () => {
        // prepare: mint 3 different NFTs
        await contract.mint(aeSdk.selectedAddress);
        await contract.mint(aeSdk.selectedAddress);
        await contract.mint(aeSdk.selectedAddress);

        // checks before burning
        let totalSupply = (await contract.total_supply()).decodedResult;
        let nftBalance = (await contract.balance(aeSdk.selectedAddress)).decodedResult;
        let ownedTokens = (await contract.get_owned_tokens(aeSdk.selectedAddress)).decodedResult;
        assert.equal(totalSupply, 3);
        assert.equal(nftBalance, 3);
        assert.deepEqual(ownedTokens, [1n, 2n, 3n]);

        // burn a single NFT
        const burnTx = await contract.burn(2);
        console.log(`Gas used (burn): ${burnTx.result.gasUsed}`);

        // check Burn event
        assert.equal(burnTx.decodedEvents[0].name, 'Burn');
        assert.equal(burnTx.decodedEvents[0].args[0], aeSdk.selectedAddress);
        assert.equal(burnTx.decodedEvents[0].args[1], 2);

        // checks after burning a single nft
        totalSupply = (await contract.total_supply()).decodedResult;
        nftBalance = (await contract.balance(aeSdk.selectedAddress)).decodedResult;
        ownedTokens = (await contract.get_owned_tokens(aeSdk.selectedAddress)).decodedResult;
        assert.equal(totalSupply, 2);
        assert.equal(nftBalance, 2);
        assert.deepEqual(ownedTokens, [1n, 3n]);

        const burnMultipleNftsTx = await contract.burn_multiple_nfts([1,3]);
        console.log(`Gas used (burn_multiple_nfts with 2 nfts): ${burnMultipleNftsTx.result.gasUsed}`);

        // check Burn events
        assert.equal(burnMultipleNftsTx.decodedEvents[0].name, 'Burn');
        assert.equal(burnMultipleNftsTx.decodedEvents[0].args[0], aeSdk.selectedAddress);
        assert.equal(burnMultipleNftsTx.decodedEvents[0].args[1], 3);
        assert.equal(burnMultipleNftsTx.decodedEvents[1].name, 'Burn');
        assert.equal(burnMultipleNftsTx.decodedEvents[1].args[0], aeSdk.selectedAddress);
        assert.equal(burnMultipleNftsTx.decodedEvents[1].args[1], 1);

        // checks after burning multiple nfts
        totalSupply = (await contract.total_supply()).decodedResult;
        nftBalance = (await contract.balance(aeSdk.selectedAddress)).decodedResult;
        ownedTokens = (await contract.get_owned_tokens(aeSdk.selectedAddress)).decodedResult;
        assert.equal(totalSupply, 0);
        assert.equal(nftBalance, 0);
        assert.deepEqual(ownedTokens, []);

        // TODO test burning with expired names
      });

      it('revoke_single', async () => {
        // prepare: wrap names
        await contract.wrap_and_mint(namesDelegationSigs);

        // pre revocation checks
        const expirationHeight = (await contract.get_expiration_by_nft_id(1)).decodedResult;
        let nftDataOne = (await contract.get_nft_data(1)).decodedResult;
        assert.deepEqual(nftDataOne, {id: 1n, owner: aeSdk.selectedAddress, owner_config: undefined, names: aensNamesLowercase, expiration_height: expirationHeight});
        await expectNftMetadataMap(1, getExpectedNftMetadataMap(aensNamesLowercase));

        const revokeSingleTx = await contract.revoke_single(1, aensNames[0]);
        console.log(`Gas used (revoke_single): ${revokeSingleTx.result.gasUsed}`);

        // check NameRevoke event
        assert.equal(revokeSingleTx.decodedEvents[0].name, 'NameRevoke');
        assert.equal(revokeSingleTx.decodedEvents[0].args[0], aensNamesLowercase[0]);
        assert.equal(revokeSingleTx.decodedEvents[0].args[1], 1);

        // after revocation checks
        nftDataOne = (await contract.get_nft_data(1)).decodedResult;
        assert.deepEqual(nftDataOne, {id: 1n, owner: aeSdk.selectedAddress, owner_config: undefined, names: aensNamesLowercase.slice(1), expiration_height: expirationHeight});
        await expectNftMetadataMap(1, getExpectedNftMetadataMap(aensNamesLowercase.slice(1)));
        try {
          await aeSdk.aensQuery(aensNames[0]);
        } catch(e) {
          assert.equal(e.statusCode, 404);
          assert.equal(e.details.reason, "Name revoked");
        }
      });

      it('revoke_multiple', async () => {
        // prepare: wrap names
        await contract.wrap_and_mint(namesDelegationSigs);

        // pre revocation checks
        const expirationHeight = (await contract.get_expiration_by_nft_id(1)).decodedResult;
        let nftDataOne = (await contract.get_nft_data(1)).decodedResult;
        assert.deepEqual(nftDataOne, {id: 1n, owner: aeSdk.selectedAddress, owner_config: undefined, names: aensNamesLowercase, expiration_height: expirationHeight});
        await expectNftMetadataMap(1, getExpectedNftMetadataMap(aensNamesLowercase));

        const revokeMultipleTx = await contract.revoke_multiple(1, aensNames.slice(1));
        console.log(`Gas used (revoke_multiple) with ${aensNames.slice(1).length} names: ${revokeMultipleTx.result.gasUsed}`);

        // check NameRevoke events
        for(let i=0; i<aensNamesLowercase.slice(1).length; i++) {
          assert.equal(revokeMultipleTx.decodedEvents[i].name, 'NameRevoke');
          assert.equal(revokeMultipleTx.decodedEvents[i].args[0], aensNamesLowercase.slice(1)[aensNamesLowercase.slice(1).length-(i+1)]);
          assert.equal(revokeMultipleTx.decodedEvents[i].args[1], 1);
        }

        // after revocation checks
        nftDataOne = (await contract.get_nft_data(1)).decodedResult;
        assert.deepEqual(nftDataOne, {id: 1n, owner: aeSdk.selectedAddress, owner_config: undefined, names: [aensNamesLowercase[0]], expiration_height: expirationHeight});
        await expectNftMetadataMap(1, getExpectedNftMetadataMap([aensNamesLowercase[0]]));
        for(let i=0; i<aensNames.slice(1).length; i++) {
          try {
            await aeSdk.aensQuery(aensNames.slice(1)[i]);
          } catch(e) {
            assert.equal(e.statusCode, 404);
            assert.equal(e.details.reason, "Name revoked");
          }
        }
      });

      it('revoke_all', async () => {
        // prepare: wrap names
        await contract.wrap_and_mint(namesDelegationSigs);

        // pre revocation checks
        const expirationHeight = (await contract.get_expiration_by_nft_id(1)).decodedResult;
        let nftDataOne = (await contract.get_nft_data(1)).decodedResult;
        assert.deepEqual(nftDataOne, {id: 1n, owner: aeSdk.selectedAddress, owner_config: undefined, names: aensNamesLowercase, expiration_height: expirationHeight});
        await expectNftMetadataMap(1, getExpectedNftMetadataMap(aensNamesLowercase));

        const revokeAllTx = await contract.revoke_all(1);
        console.log(`Gas used (revoke_all) with ${aensNames.length} names: ${revokeAllTx.result.gasUsed}`);

        // check NameRevoke events
        for(let i=0; i<aensNamesLowercase.length; i++) {
          assert.equal(revokeAllTx.decodedEvents[i].name, 'NameRevoke');
          assert.equal(revokeAllTx.decodedEvents[i].args[0], aensNamesLowercase[aensNamesLowercase.length-(i+1)]);
          assert.equal(revokeAllTx.decodedEvents[i].args[1], 1);
        }

        // after revocation checks
        nftDataOne = (await contract.get_nft_data(1)).decodedResult;
        assert.deepEqual(nftDataOne, {id: 1n, owner: aeSdk.selectedAddress, owner_config: undefined, names: [], expiration_height: expirationHeight});
        await expectNftMetadataMap(1, new Map());
        for(let i=0; i<aensNames.length; i++) {
          try {
            await aeSdk.aensQuery(aensNames[i]);
          } catch(e) {
            assert.equal(e.statusCode, 404);
            assert.equal(e.details.reason, "Name revoked");
          }
        }
      });

      it('add_or_replace_pointer', async () => {
        // prepare: wrap names
        await contract.wrap_and_mint(namesDelegationSigs);

        // check before adding pointer
        let nameInstance = await aeSdk.aensQuery(aensNames[0]);
        assert.deepEqual(nameInstance.pointers, []);

        // add pointer
        let addOrReplacePointerTx = await contract.add_or_replace_pointer(1, aensNames[0], "account_pubkey", {'AENS.AccountPt': [aeSdk.selectedAddress]})
        console.log(`Gas used (add_or_replace_pointer): ${addOrReplacePointerTx.result.gasUsed}`);

        // check after adding pointer
        nameInstance = await aeSdk.aensQuery(aensNames[0]);
        assert.deepEqual(nameInstance.pointers, [
          {
            key: 'account_pubkey',
            id: aeSdk.selectedAddress
          }
        ]);

        // replace pointer
        const otherAccount = utils.getDefaultAccounts()[1];
        await contract.add_or_replace_pointer(1, aensNames[0], "account_pubkey", {'AENS.AccountPt': [otherAccount.address]})

        // check after replacing pointer
        nameInstance = await aeSdk.aensQuery(aensNames[0]);
        assert.deepEqual(nameInstance.pointers, [
          {
            key: 'account_pubkey',
            id: otherAccount.address
          }
        ]);
      });

      it('add_or_replace_pointers', async () => {
        // prepare: wrap names
        await contract.wrap_and_mint(namesDelegationSigs);

        // check before adding pointer
        let nameInstance = await aeSdk.aensQuery(aensNames[0]);
        assert.deepEqual(nameInstance.pointers, []);

        // add pointers
        const pointers = new Map();
        for(let i=0; i<30; i++) {
          pointers.set(`pointer-${i+1}`, {'AENS.AccountPt': [aeSdk.selectedAddress]});
        }
        let addOrReplacePointersTx = await contract.add_or_replace_pointers(1, aensNames[0], pointers, true)
        console.log(`Gas used (add_or_replace_pointers) with ${pointers.size} pointers: ${addOrReplacePointersTx.result.gasUsed}`);

        const expectedPointers = [];
        for(let i=0; i<30; i++) {
          expectedPointers.push(
            {
              key: `pointer-${i+1}`,
              id: aeSdk.selectedAddress
            }
          );
        }
        // check after adding pointers
        nameInstance = await aeSdk.aensQuery(aensNames[0]);
        assert.sameDeepMembers(nameInstance.pointers, expectedPointers);

        const otherAccount = utils.getDefaultAccounts()[1];
        const updatedPointers = new Map();
        for(let i=0; i<32; i++) {
          updatedPointers.set(`pointer-${i+1}`, {'AENS.AccountPt': [otherAccount.address]});
        }

        addOrReplacePointersTx = await contract.add_or_replace_pointers(1, aensNames[0], updatedPointers, true);
        console.log(`Gas used (add_or_replace_pointers) with ${updatedPointers.size} pointers: ${addOrReplacePointersTx.result.gasUsed}`);

        const expectedUpdatedPointers = [];
        for(let i=0; i<32; i++) {
          expectedUpdatedPointers.push(
            {
              key: `pointer-${i+1}`,
              id: otherAccount.address
            }
          );
        }

        nameInstance = await aeSdk.aensQuery(aensNames[0]);
        assert.sameDeepMembers(nameInstance.pointers, expectedUpdatedPointers);

        const replacePointers = new Map();
        for(let i=0; i<7; i++) {
          replacePointers.set(`pointer-${i+1}`, {'AENS.AccountPt': [aeSdk.selectedAddress]});
        }
        // don't keep existing pointers
        await contract.add_or_replace_pointers(1, aensNames[0], replacePointers, false);
        const expectedReplacedPointers = [];
        for(let i=0; i<7; i++) {
          expectedReplacedPointers.push(
            {
              key: `pointer-${i+1}`,
              id: aeSdk.selectedAddress
            }
          );
        }

        nameInstance = await aeSdk.aensQuery(aensNames[0]);
        assert.sameDeepMembers(nameInstance.pointers, expectedReplacedPointers);
      });

      it('remove_pointer', async () => {
        // prepare: wrap names
        await contract.wrap_and_mint(namesDelegationSigs);

        // add pointer
        await contract.add_or_replace_pointer(1, aensNames[0], "account_pubkey", {'AENS.AccountPt': [aeSdk.selectedAddress]})

        // check before removing pointer
        let nameInstance = await aeSdk.aensQuery(aensNames[0]);
        assert.deepEqual(nameInstance.pointers, [
          {
            key: 'account_pubkey',
            id: aeSdk.selectedAddress
          }
        ]);

        // remove pointer
        const removePointerTx = await contract.remove_pointer(1, aensNames[0], "account_pubkey");
        console.log(`Gas used (remove_pointer): ${removePointerTx.result.gasUsed}`);

        // check after removing pointer
        nameInstance = await aeSdk.aensQuery(aensNames[0]);
        assert.deepEqual(nameInstance.pointers, []);
      });

      it('remove_pointers & remove_all_pointers', async () => {
        // prepare: wrap names
        await contract.wrap_and_mint(namesDelegationSigs);

        // add pointers
        const pointers = new Map();
        for(let i=0; i<32; i++) {
          pointers.set(`pointer-${i+1}`, {'AENS.AccountPt': [aeSdk.selectedAddress]});
        }
        await contract.add_or_replace_pointers(1, aensNames[0], pointers, false);

        // remove pointers
        const removePointerTx = await contract.remove_pointers(1, aensNames[0], [...pointers.keys()].slice(1));
        console.log(`Gas used (remove_pointers) with ${pointers.size - 1}: ${removePointerTx.result.gasUsed}`);

        // check after removing pointers
        nameInstance = await aeSdk.aensQuery(aensNames[0]);
        assert.deepEqual(nameInstance.pointers, [
          {
            key: 'pointer-1',
            id: aeSdk.selectedAddress
          }
        ]);

        // add pointers again
        await contract.add_or_replace_pointers(1, aensNames[0], pointers, false);

        // remove all pointers
        const removeAllPointersTx = await contract.remove_all_pointers(1, aensNames[0]);
        console.log(`Gas used (remove_all_pointers): ${removeAllPointersTx.result.gasUsed}`);

        // check after removing all pointers
        nameInstance = await aeSdk.aensQuery(aensNames[0]);
        assert.deepEqual(nameInstance.pointers, []);
      });

      it('non ASCII chars work as expected', async () => {
        const nonAsciiNames = ["приветприветпривет.chain", "bücherregal.chain", "æternityisgreat.chain"];
        await claimNames(nonAsciiNames);
        const nonAsciiNamesDelegationSigs = await getDelegationSignatures(nonAsciiNames, contractId);
        const nftId = (await contract.wrap_and_mint(nonAsciiNamesDelegationSigs)).decodedResult;
        let nonAsciiMetadata = (await contract.metadata(nftId)).decodedResult.MetadataMap[0];
        assert.deepEqual(nonAsciiMetadata, getExpectedNftMetadataMap(nonAsciiNames));
        await contract.unwrap_multiple(nftId, nonAsciiNames);
        nonAsciiMetadata = (await contract.metadata(nftId)).decodedResult.MetadataMap[0];
        assert.deepEqual(nonAsciiMetadata, new Map());
        await contract.burn(nftId);
      });

      it('migration', async () => {
        const admin = (await contract.get_admin()).decodedResult;
        assert.equal(admin, aeSdk.selectedAddress);
        let migrationTarget = (await contract.get_migration_target()).decodedResult;
        assert.isUndefined(migrationTarget);
        let migrationTargetDeployer = (await contract.get_migration_target_deployer()).decodedResult;
        assert.equal(migrationTargetDeployer, aeSdk.selectedAddress);

        let tx = await contract.set_migration_target_deployer(utils.getDefaultAccounts()[1].address);
        assert.equal(tx.decodedEvents[0].name, 'MigrationTargetDeployerSet');
        assert.equal(tx.decodedEvents[0].args[0], utils.getDefaultAccounts()[1].address);
        migrationTargetDeployer = (await contract.get_migration_target_deployer()).decodedResult;
        assert.equal(migrationTargetDeployer, utils.getDefaultAccounts()[1].address);

        tx = await contract.set_migration_target_deployer();
        assert.equal(tx.decodedEvents[0].name, 'MigrationTargetDeployerUnset');
        migrationTargetDeployer = (await contract.get_migration_target_deployer()).decodedResult;
        assert.equal(migrationTargetDeployer, aeSdk.selectedAddress);

        const ceresContract = await aeSdkCeres.initializeContract({
          sourceCode: utils.getContractContent("./contracts/AENSWrappingCeres.aes"),
          fileSystem: utils.getFilesystem("./contracts/AENSWrappingCeres.aes")
        });
        await ceresContract.init("Wrapped AENS Ceres", "WAENSC", 180_000, nameLimit, contractId);
        migrationTarget = (await contract.get_migration_target()).decodedResult;
        assert.equal(migrationTarget, ceresContract.$options.address.replace("ct_", "ak_"));

        // prepare: wrap names in old contract
        const nftId = (await contract.wrap_and_mint(namesDelegationSigs)).decodedResult;

        // checks before migration
        let irisTotalSupply = (await contract.total_supply()).decodedResult;
        let ceresTotalSupply = (await ceresContract.total_supply()).decodedResult;
        assert.equal(irisTotalSupply, 1);
        assert.equal(ceresTotalSupply, 0);
        let irisMetadata = (await contract.metadata(nftId)).decodedResult.MetadataMap[0];
        assert.deepEqual(irisMetadata, getExpectedNftMetadataMap(aensNamesLowercase));
        let irisOwner = (await contract.owner(nftId)).decodedResult;
        assert.equal(irisOwner, aeSdk.selectedAddress);

        const expectedTtl = (await contract.get_expiration_by_nft_id(nftId)).decodedResult;

        // migrate
        const triggerMigrationTx = await ceresContract.trigger_migration(nftId);
        console.log(`Gas used (trigger_migration with ${aensNames.length} names): ${triggerMigrationTx.result.gasUsed}`);

        let eventCounter = 0;
        for(eventCounter; eventCounter<aensNamesLowercase.length; eventCounter++) {
          assert.equal(triggerMigrationTx.decodedEvents[eventCounter].name, 'NameWrap');
          assert.equal(triggerMigrationTx.decodedEvents[eventCounter].contract.address, ceresContract.$options.address);
          assert.equal(triggerMigrationTx.decodedEvents[eventCounter].args[0], aensNamesLowercase[aensNamesLowercase.length-(eventCounter+1)]);
          assert.equal(triggerMigrationTx.decodedEvents[eventCounter].args[1], 1);
          assert.equal(triggerMigrationTx.decodedEvents[eventCounter].args[2], aeSdk.selectedAddress);
          assert.equal(triggerMigrationTx.decodedEvents[eventCounter].args[3], expectedTtl);
        }

        // check Mint event (ceres contract)
        assert.equal(triggerMigrationTx.decodedEvents[eventCounter].name, 'Mint');
        assert.equal(triggerMigrationTx.decodedEvents[eventCounter].contract.address, ceresContract.$options.address);
        assert.equal(triggerMigrationTx.decodedEvents[eventCounter].args[0], aeSdk.selectedAddress);
        assert.equal(triggerMigrationTx.decodedEvents[eventCounter].args[1], 1);

        eventCounter++;
        // check Burn event (iris contract)
        assert.equal(triggerMigrationTx.decodedEvents[eventCounter].name, 'Burn');
        assert.equal(triggerMigrationTx.decodedEvents[eventCounter].contract.address, contractId);
        assert.equal(triggerMigrationTx.decodedEvents[eventCounter].args[0], aeSdk.selectedAddress);
        assert.equal(triggerMigrationTx.decodedEvents[eventCounter].args[1], 1);

        eventCounter++;
        // check Migrate event (iris contract)
        assert.equal(triggerMigrationTx.decodedEvents[eventCounter].name, 'Migrate');
        assert.equal(triggerMigrationTx.decodedEvents[eventCounter].contract.address, contractId);
        assert.equal(triggerMigrationTx.decodedEvents[eventCounter].args[0], nftId);
        assert.equal(triggerMigrationTx.decodedEvents[eventCounter].args[1], aensNames.length);
        assert.equal(triggerMigrationTx.decodedEvents[eventCounter].args[2], aeSdk.selectedAddress);
        
        // checks after migration
        const nftIdCeres = triggerMigrationTx.decodedResult;
        irisTotalSupply = (await contract.total_supply()).decodedResult;
        ceresTotalSupply = (await ceresContract.total_supply()).decodedResult;
        assert.equal(irisTotalSupply, 0);
        assert.equal(ceresTotalSupply, 1);
        irisMetadata = (await contract.metadata(nftId)).decodedResult;
        assert.isUndefined(irisMetadata);
        ceresMetadata = (await ceresContract.metadata(nftIdCeres)).decodedResult.MetadataMap[0];
        assert.deepEqual(ceresMetadata, getExpectedNftMetadataMap(aensNamesLowercase));
        irisOwner = (await contract.owner(nftId).decodedResult);
        assert.isUndefined(irisOwner);
        ceresOwner = (await ceresContract.owner(nftIdCeres)).decodedResult;
        assert.equal(ceresOwner, aeSdkCeres.selectedAddress);
      });
    });

    describe('Abort paths', () => {
      const otherAccount = utils.getDefaultAccounts()[1];

      it('mint', async () => {
        await expect(
          contract.mint(otherAccount.address))
          .to.be.rejectedWith(`Invocation failed: "CALLER_MUST_BE_RECIPIENT"`);

        await expect(
          contract.mint(otherAccount.address, {'MetadataMap': [new Map()]}))
          .to.be.rejectedWith(`Invocation failed: "MINTING_WITH_METADATA_NOT_ALLOWED"`);
      });

      it('transfer', async () => {
        const tokenId = (await contract.mint(aeSdk.selectedAddress)).decodedResult;

        await expect(
          contract.transfer(aeSdk.selectedAddress, tokenId))
          .to.be.rejectedWith(`Invocation failed: "SENDER_MUST_NOT_BE_RECEIVER"`);

        await expect(
          contract.transfer(dummyContractAddress, tokenId))
          .to.be.rejectedWith(`Invocation failed: "SAFE_TRANSFER_FAILED"`);
        
        await expect(
          contract.transfer(otherAccount.address, tokenId, undefined, { onAccount: otherAccount }))
          .to.be.rejectedWith(`Invocation failed: "ONLY_OWNER_APPROVED_OR_OPERATOR_CALL_ALLOWED"`);
      });

      it('transfer_to_contract', async () => {
        const tokenId = (await contract.mint(aeSdk.selectedAddress)).decodedResult;

        await expect(
          contract.transfer_to_contract(tokenId))
          .to.be.rejectedWith(`Invocation failed: "CALLER_MUST_BE_A_CONTRACT"`);
      });

      it('burn', async () => {
        const tokenId = (await contract.mint(aeSdk.selectedAddress)).decodedResult;

        await expect(
          contract.burn(tokenId + 1n))
          .to.be.rejectedWith(`Invocation failed: "TOKEN_NOT_EXISTS"`);

        const wrapSingleTestName = "wrapSingleTestName.chain";
        const preClaimTx = await aeSdk.aensPreclaim(wrapSingleTestName);
        await aeSdk.aensClaim(wrapSingleTestName, preClaimTx.salt);
        const delegationSig = await aeSdk.createDelegationSignature(contractId, [wrapSingleTestName]);
        await contract.wrap_single(tokenId, wrapSingleTestName, delegationSig);

        await expect(
          contract.burn(tokenId))
          .to.be.rejectedWith(`Invocation failed: "WRAPPED_NAMES_NOT_EXPIRED"`);

        // set global config to disallow burning of empty NFTs
        await contract.set_global_config(globalConfig);
        const tokenIdToBurn = (await contract.mint(aeSdk.selectedAddress)).decodedResult;
        await expect(
          contract.burn(tokenIdToBurn))
          .to.be.rejectedWith(`Invocation failed: "BURNING_NOT_ALLOWED"`);
        
        // passes after removing global config even if executed from other account
        await contract.remove_global_config();
        await contract.burn(tokenIdToBurn, { onAccount: otherAccount });
      });

      it('wrap_and_mint', async () => {
        const namesDelegationWrongSigs = await getDelegationSignatures(aensNames, contractId, otherAccount);
        await expect(
          contract.wrap_and_mint(namesDelegationWrongSigs))
          .to.be.rejectedWith(`Invocation failed: "Error in aens_transfer: bad_signature"`);
      });

      it('wrap_single', async () => {
        // workaround due to https://github.com/aeternity/aeproject/issues/470
        const contractLowTtl = await aeSdk.initializeContract({
          sourceCode: utils.getContractContent(AENS_WRAPPING_SOURCE),
          fileSystem: utils.getFilesystem(AENS_WRAPPING_SOURCE)
        });
        await contractLowTtl.init("Wrapped AENS Low TTL", "WAENSLTTL", 21, 100, aeSdk.selectedAddress);

        const tokenId = (await contractLowTtl.mint(aeSdk.selectedAddress)).decodedResult;

        // let name ttl in NFT expire
        await utils.awaitKeyBlocks(aeSdk, 22);

        const wrapSingleTestName = "wrapSingleTestName.chain";
        const preClaimTx = await aeSdk.aensPreclaim(wrapSingleTestName);
        await aeSdk.aensClaim(wrapSingleTestName, preClaimTx.salt);
        const delegationSig = await aeSdk.createDelegationSignature(contractId, [wrapSingleTestName]);

        await expect(
          contractLowTtl.wrap_single(tokenId, wrapSingleTestName, delegationSig))
          .to.be.rejectedWith(`Invocation failed: "NAMES_IN_NFT_EXPIRED"`);
      });

      it('add_or_replace_pointer(s)', async () => {
        let tokenId = (await contract.mint(aeSdk.selectedAddress)).decodedResult;

        await expect(
          contract.add_or_replace_pointer(tokenId, aensNames[0], "account_pubkey", {'AENS.AccountPt': [aeSdk.selectedAddress]}))
          .to.be.rejectedWith(`Invocation failed: "NAME_NOT_WRAPPED"`);

        tokenId = (await contract.wrap_and_mint(namesDelegationSigs)).decodedResult;
        const pointers = new Map();
        for(let i=0; i<33; i++) {
          pointers.set(`pointer-${i+1}`, {'AENS.AccountPt': [aeSdk.selectedAddress]});
        }

        await expect(
          contract.add_or_replace_pointers(tokenId, aensNames[0], pointers, false))
          .to.be.rejectedWith(`Invocation failed: "POINTER_LIMIT_EXCEEDED"`);
      });

      it('transfer_single, transfer_multiple & transfer_all', async () => {
        const sourceTokenId = (await contract.wrap_and_mint(namesDelegationSigs)).decodedResult;

        await expect(
          contract.transfer_single(sourceTokenId, 1337, aensNames[0]))
          .to.be.rejectedWith(`Invocation failed: "TOKEN_NOT_EXISTS"`);

        const firstTargetNftId = (await contract.mint(otherAccount.address, undefined, undefined, { onAccount: otherAccount })).decodedResult;

        await expect(
          contract.transfer_single(sourceTokenId, firstTargetNftId, aensNames[0]))
          .to.be.rejectedWith(`Invocation failed: "RECEIVING_NAME_NOT_ALLOWED"`);

        // set global config to allow receiving names
        await contract.set_global_config(globalConfig, { onAccount: otherAccount });
        // passes now
        await contract.transfer_single(sourceTokenId, firstTargetNftId, aensNames[0]);

        const nftConfig = {
          reward: 1n,
          reward_block_window: 10n,
          emergency_reward: 1_000n,
          emergency_reward_block_window: 1n,
          can_receive_from_others: false,
          burnable_if_expired_or_empty: false
        }
        // mint second target nft and set nft config to disallow receiving names and overrule global cfg
        const secondTargetNftId = (await contract.mint(otherAccount.address, undefined, undefined, { onAccount: otherAccount })).decodedResult;
        await contract.set_nft_config(secondTargetNftId, nftConfig, { onAccount: otherAccount });

        await expect(
          contract.transfer_multiple(sourceTokenId, secondTargetNftId, aensNames.slice(1)))
          .to.be.rejectedWith(`Invocation failed: "RECEIVING_NAME_NOT_ALLOWED"`);

        const emptySourceNftId = (await contract.mint(aeSdk.selectedAddress)).decodedResult;

        await expect(
          contract.transfer_all(emptySourceNftId, firstTargetNftId, aensNames.slice(1)))
          .to.be.rejectedWith(`Invocation failed: "NO_NAMES_WRAPPED"`);

        // passes because sourceTokenId has names wrapped and firstTargetNft can still receive
        await contract.transfer_all(sourceTokenId, firstTargetNftId, aensNames.slice(1));
      });

      it('deposit_to_reward_pool', async () => {
        await expect(
          contract.deposit_to_reward_pool())
          .to.be.rejectedWith(`Invocation failed: "DEPOSIT_VALUE_MISSING"`);
      });

      it('withdraw_from_reward_pool', async () => {
        await expect(
          contract.withdraw_from_reward_pool())
          .to.be.rejectedWith(`Invocation failed: "NO_AE_IN_REWARD_POOL"`);
        
        // deposit
        await contract.deposit_to_reward_pool({ amount: oneAe });

        await expect(
          contract.withdraw_from_reward_pool(oneAe + 1n))
          .to.be.rejectedWith(`Invocation failed: "INSUFFICIENT_BALANCE_IN_POOL"`);
      });

      it('name wrapping & name transfer', async () => {
        if(aensNames.length == nameLimit) {
          const wrapSingleTestName = "wrapSingleTestName.chain";
          const preClaimTx = await aeSdk.aensPreclaim(wrapSingleTestName);
          await aeSdk.aensClaim(wrapSingleTestName, preClaimTx.salt);
  
          const namesDelegationSigsExceeded = await getDelegationSignatures(aensNames.concat([wrapSingleTestName]), contractId);
  
          await expect(
            contract.wrap_and_mint(namesDelegationSigsExceeded))
            .to.be.rejectedWith(`Invocation failed: "NAME_LIMIT_EXCEEDED"`);
  
          const recipientTokenId = (await contract.wrap_and_mint(await getDelegationSignatures([wrapSingleTestName], contractId))).decodedResult;
          const senderTokenId = (await contract.wrap_and_mint(namesDelegationSigs)).decodedResult;
  
          await expect(
            contract.transfer_all(senderTokenId, recipientTokenId))
            .to.be.rejectedWith(`Invocation failed: "NAME_LIMIT_EXCEEDED"`);
        } else {
          console.log(`SKIPPED CHECK for "NAME_LIMIT_EXCEEDED`);
        }
      });

      it('migration', async () => {
        // create NFT in old contract
        const nftId = (await contract.wrap_and_mint(namesDelegationSigs)).decodedResult;

        await expect(
          dummyContract.trigger_migration(contractId, nftId))
          .to.be.rejectedWith(`Invocation failed: "MIGRATION_NOT_ACTIVATED_YET"`);

        // deploy ceres contract (activates migration and uses a lower nameLimit)
        const ceresContract = await aeSdkCeres.initializeContract({
          sourceCode: utils.getContractContent("./contracts/AENSWrappingCeres.aes"),
          fileSystem: utils.getFilesystem("./contracts/AENSWrappingCeres.aes")
        });
        await ceresContract.init("Wrapped AENS Ceres", "WAENSC", 180_000, nameLimit - 1, contractId);

        await expect(
          dummyContract.trigger_migration(contractId, nftId))
          .to.be.rejectedWith(`Invocation failed: "MIGRATION_MUST_BE_TRIGGERED_BY_TARGET_CONTRACT"`);

        await expect(
          ceresContract.trigger_migration(nftId, { onAccount: utils.getDefaultAccounts()[1] }))
          .to.be.rejectedWith(`Invocation failed: "ORIGIN_MUST_BE_OWNER"`);

        if(aensNames.length == nameLimit) {
          await expect(
            ceresContract.trigger_migration(nftId))
            .to.be.rejectedWith(`Invocation failed: "NAME_LIMIT_EXCEEDED"`);
        }
      });
    });

    describe('NFT Receiver', () => {
      it('failed transfer', async () => {
        const tokenId = (await contract.mint(aeSdk.selectedAddress)).decodedResult;
        await expect(
          contract.transfer(nftReceiverContractAddress, tokenId, "should fail"))
          .to.be.rejectedWith(`Invocation failed: "SAFE_TRANSFER_FAILED"`);
      });

      it('successful transfer', async () => {
        const tokenId = (await contract.mint(aeSdk.selectedAddress)).decodedResult;

        await contract.transfer(nftReceiverContractAddress, tokenId);
        assert.equal(nftReceiverContractAddress, (await contract.owner(tokenId)).decodedResult);

        const originalOwner = (await nftReceiverContract.get_nft_owner(contractId, tokenId)).decodedResult;
        assert.equal(originalOwner, aeSdk.selectedAddress);
      });
    });
  });
});
