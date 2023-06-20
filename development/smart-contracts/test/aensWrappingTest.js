const { assert } = require('chai');
const { utils } = require('@aeternity/aeproject');

const CONTRACT_SOURCE = './contracts/AENSWrapping.aes';

describe('AENSWrapping', () => {
  let aeSdk;
  let contract;
  let contractId;
  let contractAccountAddress;

  const aensNames = [
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA.chain",
    "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.chain",
    "CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC.chain",
    // "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD.chain",
    // "EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE.chain",
    // "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF.chain",
    // "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG.chain",
    // "HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH.chain",
    // "IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII.chain",
    // "JJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ.chain",
    // "KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK.chain",
    // "LLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLL.chain",
    // "MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM.chain",
    // "NNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN.chain",
    // "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO.chain",
    // "PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP.chain",
    // "QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ.chain",
    // "RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR.chain",
    // "SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS.chain",
    // "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT.chain",
    // "UUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUU.chain",
    // "VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV.chain",
    // "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.chain",
    // "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.chain",
    // "YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY.chain",
    // "ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ.chain",
  ];

  before(async () => {
    aeSdk = await utils.getSdk();

    // a filesystem object must be passed to the compiler if the contract uses custom includes
    const fileSystem = utils.getFilesystem(CONTRACT_SOURCE);

    // get content of contract
    const sourceCode = utils.getContractContent(CONTRACT_SOURCE);

    // initialize the contract instance
    contract = await aeSdk.initializeContract({ sourceCode, fileSystem });
    await contract.$deploy([]);
    contractId = contract.$options.address;
    contractAccountAddress = contractId.replace("ct_", "ak_");

    // create a snapshot of the blockchain state
    await utils.createSnapshot(aeSdk);
  });

  // after each test roll back to initial state
  afterEach(async () => {
    await utils.rollbackSnapshot(aeSdk);
  });

  async function claimNames(names) {
    for (const name of names) {
      const preClaimTx = await aeSdk.aensPreclaim(name);
      await aeSdk.aensClaim(name, preClaimTx.salt);
    }
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

  async function getDelegationSignatures(names, contractId) {
    return new Map(
      await Promise.all(
        names.map(async (name) => [name, await aeSdk.createDelegationSignature(contractId, [name])])
      )
    );
  }

  describe('AENS Wrapping', () => {
    it('wrap_and_mint', async () => {
      await claimNames(aensNames);
      const namesDelegationSigs = await getDelegationSignatures(aensNames, contractId);

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

      for(let i=0; i<aensNames.length; i++) {
        assert.equal(wrapAndMintTx.decodedEvents[i].name, 'NameWrap');
        assert.equal(wrapAndMintTx.decodedEvents[i].args[0], 1);
        assert.equal(wrapAndMintTx.decodedEvents[i].args[1], aeSdk.selectedAddress);
        assert.equal(wrapAndMintTx.decodedEvents[i].args[2], aensNames[aensNames.length-(i+1)]);
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
      // prepare: claim and wrap names
      await claimNames(aensNames);
      const namesDelegationSigs = await getDelegationSignatures(aensNames, contractId);
      await contract.wrap_and_mint(namesDelegationSigs);

      // claim a new name
      const wrapSingleTestName = "wrapSingleTestName.chain";
      const preClaimTx = await aeSdk.aensPreclaim(wrapSingleTestName);
      await aeSdk.aensClaim(wrapSingleTestName, preClaimTx.salt);

      // pre-check logic
      const nftExpirationHeight = (await contract.get_expiration_by_nft_id(1)).decodedResult;
      const delegationSig = await aeSdk.createDelegationSignature(contractId, [wrapSingleTestName])

      // check before wrapping
      let nameInstance = await aeSdk.aensQuery(wrapSingleTestName);
      let metadataMap = (await contract.metadata(1)).decodedResult.MetadataMap[0];
      assert.equal(nameInstance.owner, aeSdk.selectedAddress);
      assert.equal(metadataMap.size, aensNames.length);
      assert.isFalse(metadataMap.has(wrapSingleTestName));
      assert.notEqual(nameInstance.ttl, nftExpirationHeight);

      const wrapSingleTx = await contract.wrap_single(1, wrapSingleTestName, delegationSig);
      console.log(`Gas used (wrap_single): ${wrapSingleTx.result.gasUsed}`);

      // check after wrapping
      nameInstance = await aeSdk.aensQuery(wrapSingleTestName);
      metadataMap = (await contract.metadata(1)).decodedResult.MetadataMap[0];
      assert.equal(nameInstance.owner, contractAccountAddress);
      assert.equal(metadataMap.size, aensNames.length + 1);
      assert.isTrue(metadataMap.has(wrapSingleTestName));
      assert.equal(nameInstance.ttl, nftExpirationHeight);
    });

    it('wrap_multiple', async () => {
      // mint an empty NFT
      const mintTx = await contract.mint(aeSdk.selectedAddress);
      console.log(`Gas used (mint): ${mintTx.result.gasUsed}`);

      // claim names
      await claimNames(aensNames);
      const namesDelegationSigs = await getDelegationSignatures(aensNames, contractId);

      // check before wrapping
      await expectNftMetadataMap(1, new Map());
      await expectNameAttributesProtocol(aensNames, { owner: aeSdk.selectedAddress })

      const wrapMultipleTx = await contract.wrap_multiple(1, namesDelegationSigs);
      console.log(`Gas used (wrap_multiple with ${aensNames.length} names): ${wrapMultipleTx.result.gasUsed}`);

      // check after wrapping
      const nftExpirationHeight = (await contract.get_expiration_by_nft_id(1)).decodedResult;
      await expectNameAttributesProtocol(aensNames, { owner: contractAccountAddress, ttl: nftExpirationHeight })
      await expectNftMetadataMap(1, getExpectedNftMetadataMap(aensNames));
    });
  });
});
