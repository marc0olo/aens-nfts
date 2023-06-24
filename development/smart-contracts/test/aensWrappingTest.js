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

    describe('Happy paths', () => {

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
          assert.equal(wrapAndMintTx.decodedEvents[i].args[0], aensNames[aensNames.length-(i+1)]);
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
  
      it('unwrap_single', async () => {
        // prepare: claim and wrap names
        await claimNames(aensNames);
        const namesDelegationSigs = await getDelegationSignatures(aensNames, contractId);
        await contract.wrap_and_mint(namesDelegationSigs);
  
        // check after wrapping
        await expectNftMetadataMap(1, getExpectedNftMetadataMap(aensNames));
        await expectNameAttributesProtocol(aensNames, { owner: contractAccountAddress });
  
        // unwrap single name from nft
        const unwrapSingleTx = await contract.unwrap_single(1, aensNames[0]);
        console.log(`Gas used (unwrap_single): ${unwrapSingleTx.result.gasUsed}`);
  
        // check after unwrapping
        await expectNftMetadataMap(1, getExpectedNftMetadataMap(aensNames.slice(1)));
        await expectNameAttributesProtocol(aensNames.slice(1), { owner: contractAccountAddress });
        await expectNameAttributesProtocol([aensNames[0]], { owner: aeSdk.selectedAddress });
      });
  
      it('unwrap_multiple', async () => {
        // prepare: claim and wrap names
        await claimNames(aensNames);
        const namesDelegationSigs = await getDelegationSignatures(aensNames, contractId);
        await contract.wrap_and_mint(namesDelegationSigs);
  
        // check after wrapping
        await expectNftMetadataMap(1, getExpectedNftMetadataMap(aensNames));
        await expectNameAttributesProtocol(aensNames, { owner: contractAccountAddress });
  
        // unwrap multiple names from nft
        const unwrapMultipleTx = await contract.unwrap_multiple(1, aensNames);
        console.log(`Gas used (unwrap_multiple with ${aensNames.length} names): ${unwrapMultipleTx.result.gasUsed}`);
  
        // check after unwrapping
        await expectNftMetadataMap(1, getExpectedNftMetadataMap(new Map()));
        await expectNameAttributesProtocol(aensNames, { owner: aeSdk.selectedAddress });
      });
  
      it('unwrap_all', async () => {
        // prepare: claim and wrap names
        await claimNames(aensNames);
        const namesDelegationSigs = await getDelegationSignatures(aensNames, contractId);
        await contract.wrap_and_mint(namesDelegationSigs);
  
        // check after wrapping
        await expectNftMetadataMap(1, getExpectedNftMetadataMap(aensNames));
        await expectNameAttributesProtocol(aensNames, { owner: contractAccountAddress });
  
        // unwrap multiple names from nft
        const unwrapAllTx = await contract.unwrap_all(1);
        console.log(`Gas used (unwrap_all for ${aensNames.length} names): ${unwrapAllTx.result.gasUsed}`);
  
        // check after unwrapping
        await expectNftMetadataMap(1, getExpectedNftMetadataMap(new Map()));
        await expectNameAttributesProtocol(aensNames, { owner: aeSdk.selectedAddress });
      });
  
      it('transfer_single', async () => {
        // prepare: claim and wrap names
        await claimNames(aensNames);
        const namesDelegationSigs = await getDelegationSignatures(aensNames, contractId);
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
  
        // transfer a single name to another NFT
        const transferSingleTx = await contract.transfer_single(1, 2, aensNames[0]);
        console.log(`Gas used (transfer_single): ${transferSingleTx.result.gasUsed}`);

        // check NameTransfer event
        assert.equal(transferSingleTx.decodedEvents[0].name, 'NameTransfer');
        assert.equal(transferSingleTx.decodedEvents[0].args[0], aensNames[0]);
        assert.equal(transferSingleTx.decodedEvents[0].args[1], 1);
        assert.equal(transferSingleTx.decodedEvents[0].args[2], 2);
  
        // check after transfer
        await expectNameOwnerContract(aensNames.slice(1), aeSdk.selectedAddress);
        await expectNameOwnerContract([aensNames[0]], otherAccount.address);
        await expectNameNftId(aensNames.slice(1), 1);
        await expectNftMetadataMap(1, getExpectedNftMetadataMap((aensNames.slice(1))));
        await expectNameNftId([aensNames[0]], 2);
        await expectNftMetadataMap(2, getExpectedNftMetadataMap((([aensNames[0]]))));
  
        // check TTL / expiration height of nft & names after transfer
        expectNameAttributesProtocol(aensNames.slice(1), { owner: contractAccountAddress, ttl: expirationHeightNftOne });
        expectNameAttributesProtocol([aensNames[0]], { owner: contractAccountAddress, ttl: expirationHeightNftTwo });
      });

      it('transfer_multiple', async () => {
        // prepare: claim and wrap names
        await claimNames(aensNames);
        const namesDelegationSigs = await getDelegationSignatures(aensNames, contractId);
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
        assert.deepEqual(nftDataOne, {id: 1n, owner: aeSdk.selectedAddress, owner_config: undefined, names: aensNames, expiration_height: expirationHeightNftOne});
        let nftDataTwo = (await contract.get_nft_data(2)).decodedResult;
        assert.deepEqual(nftDataTwo, {id: 2n, owner: otherAccount.address, owner_config: undefined, names: [], expiration_height: expirationHeightNftTwo});
  
        // transfer multiple names to another NFT
        const transferMultipleTx = await contract.transfer_multiple(1, 2, aensNames);
        console.log(`Gas used (transfer_multiple with ${aensNames.length} names): ${transferMultipleTx.result.gasUsed}`);

        // check NameTransfer event
        for(let i=0; i<aensNames.length; i++) {
          assert.equal(transferMultipleTx.decodedEvents[i].name, 'NameTransfer');
          assert.equal(transferMultipleTx.decodedEvents[i].args[0], aensNames[aensNames.length-(i+1)]);
          assert.equal(transferMultipleTx.decodedEvents[i].args[1], 1);
          assert.equal(transferMultipleTx.decodedEvents[i].args[2], 2);
        }
  
        // check after transfer
        await expectNftMetadataMap(1, new Map());
        await expectNameOwnerContract(aensNames, otherAccount.address);
        await expectNftMetadataMap(2, getExpectedNftMetadataMap(aensNames));
        await expectNameNftId(aensNames, 2);
        nftDataOne = (await contract.get_nft_data(1)).decodedResult
        assert.deepEqual(nftDataOne, {id: 1n, owner: aeSdk.selectedAddress, owner_config: undefined, names: [], expiration_height: expirationHeightNftOne});
        nftDataTwo = (await contract.get_nft_data(2)).decodedResult;
        assert.deepEqual(nftDataTwo, {id: 2n, owner: otherAccount.address, owner_config: undefined, names: aensNames, expiration_height: expirationHeightNftTwo});
  
        // check TTL / expiration height of nft & names after transfer
        expectNameAttributesProtocol(aensNames, { owner: contractAccountAddress, ttl: expirationHeightNftTwo });
      });

      it('transfer_all', async () => {
        // prepare: claim and wrap names
        await claimNames(aensNames);
        const namesDelegationSigs = await getDelegationSignatures(aensNames, contractId);
        await contract.wrap_and_mint(namesDelegationSigs);
  
        // prepare: mint an empty NFT on other account
        const otherAccount = utils.getDefaultAccounts()[1];
        const mintTx = await contract.mint(otherAccount.address, undefined, undefined, { onAccount: otherAccount });
        console.log(`Gas used (mint): ${mintTx.result.gasUsed}`);
  
        // check TTL / expiration height of nft & names before transfer
        const expirationHeightNftTwo = (await contract.get_expiration_by_nft_id(2)).decodedResult;
  
        // transfer multiple names to another NFT
        const transferAllTx = await contract.transfer_all(1, 2);
        console.log(`Gas used (transfer_all for ${aensNames.length} names): ${transferAllTx.result.gasUsed}`);

        // check NameTransfer event
        for(let i=0; i<aensNames.length; i++) {
          assert.equal(transferAllTx.decodedEvents[i].name, 'NameTransfer');
          assert.equal(transferAllTx.decodedEvents[i].args[0], aensNames[aensNames.length-(i+1)]);
          assert.equal(transferAllTx.decodedEvents[i].args[1], 1);
          assert.equal(transferAllTx.decodedEvents[i].args[2], 2);
        }

        // check after transfer
        await expectNftMetadataMap(1, new Map());
        await expectNameOwnerContract(aensNames, otherAccount.address);
        await expectNftMetadataMap(2, getExpectedNftMetadataMap(aensNames));
        await expectNameNftId(aensNames, 2);
  
        // check TTL / expiration height of nft & names after transfer
        expectNameAttributesProtocol(aensNames, { owner: contractAccountAddress, ttl: expirationHeightNftTwo });
      });

      it('transfer (NFT)', async () => {
        // prepare: claim and wrap names
        await claimNames(aensNames);
        const namesDelegationSigs = await getDelegationSignatures(aensNames, contractId);
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

      it('extend_all', async () => {
        // prepare: claim and wrap names
        await claimNames(aensNames);
        const namesDelegationSigs = await getDelegationSignatures(aensNames, contractId);
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
        for(let i=0; i<aensNames.length; i++) {
          assert.equal(extendAllTx.decodedEvents[i].name, 'NameExtend');
          assert.equal(extendAllTx.decodedEvents[i].args[0], aensNames[aensNames.length-(i+1)]);
          assert.equal(extendAllTx.decodedEvents[i].args[1], 1);
          assert.equal(extendAllTx.decodedEvents[i].args[2], expectedNewExpirationHeight);
          assert.equal(extendAllTx.decodedEvents[i].args[3], otherAccount.address);
        }

        // check correct expiration height after extending
        const newExpirationHeight = (await contract.get_expiration_by_nft_id(1)).decodedResult;
        assert.equal(newExpirationHeight, expectedNewExpirationHeight);
        await expectNameAttributesProtocol(aensNames, { ttl: expectedNewExpirationHeight });
      });
    });
  });
});
