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
    // "CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC.chain",
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
    console.log(`Claiming ${names.length} names for ${aeSdk.selectedAddress}`);
    for (const name of names) {
      const preClaimTx = await aeSdk.aensPreclaim(name);
      await aeSdk.aensClaim(name, preClaimTx.salt);
    }
  }

  async function expectNameOwnerProtocol(names, expectedOwner) {
    for (const name of names) {
      const nameInstance = await aeSdk.aensQuery(name);
      assert.equal(nameInstance.owner, expectedOwner);
    }
  }

  async function expectNameOwnerContract(names, expectedOwner) {
    for (const name of names) {
      const resolveOwnerDryRun = await contract.resolve_owner(name);
      assert.equal(resolveOwnerDryRun.decodedResult, expectedOwner);
    }
  }

  async function expectNameNftId(names, tokenId) {
    for (const name of names) {
      const resolveNftIdDryRun = await contract.resolve_nft_id(name);
      assert.equal(resolveNftIdDryRun.decodedResult, tokenId);
    }
  }

  describe('AENS Wrapping', () => {
    it('wrapAndMint', async () => {
      await claimNames(aensNames);

      const namesDelegationSigs = new Map(
        await Promise.all(
          aensNames.map(async (name) => [name, await aeSdk.createDelegationSignature(contractId, [name])])
        )
      );

      await expectNameOwnerProtocol(aensNames, aeSdk.selectedAddress);
      await expectNameOwnerContract(aensNames, undefined);
      await expectNameNftId(aensNames, undefined);

      const wrapAndMintTx = await contract.wrapAndMint(namesDelegationSigs);
      console.log(`Gas used (wrapAndMint): ${wrapAndMintTx.result.gasUsed} for ${aensNames.length} names`);

      await expectNameOwnerProtocol(aensNames, contractAccountAddress);
      await expectNameOwnerContract(aensNames, aeSdk.selectedAddress);
      await expectNameNftId(aensNames, 1);

      const nftMetadataDryRun = await contract.metadata(1);
      assert.equal(nftMetadataDryRun.decodedResult.MetadataMap[0].size, aensNames.length);
    });
  });
});
