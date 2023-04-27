# Contract Interface

## AEX-141

```sophia
contract interface IAEX141 =
    datatype metadata_type = URL | OBJECT_ID | MAP
    datatype metadata = MetadataIdentifier(string) | MetadataMap(map(string, string))

    record meta_info = 
        { name: string
        , symbol: string
        , base_url: option(string)
        , metadata_type : metadata_type }

    datatype event
        = Transfer(address, address, int)
        | Approval(address, address, int, string)
        | ApprovalForAll(address, address, string)
        // extension "mintable"
        | Mint(address, int)
        // extension "burnable"
        | Burn(address, int)

    entrypoint aex141_extensions : () => list(string)
    entrypoint meta_info : () => meta_info
    entrypoint metadata : (int) => option(metadata)
    entrypoint total_supply : () => int
    entrypoint balance : (address) => option(int)
    entrypoint owner : (int) => option(address)  
    stateful entrypoint transfer : (address, int, option(string)) => unit
    stateful entrypoint transfer_to_contract : (int) => unit
    stateful entrypoint approve : (address, int, bool) => unit
    stateful entrypoint approve_all : (address, bool) => unit
    entrypoint get_approved : (int) => option(address)
    entrypoint is_approved : (int, address) => bool
    entrypoint is_approved_for_all : (address, address) => bool

    // extension "mintable"
    stateful entrypoint mint : (address, option(metadata), option(string)) => int

    // extension "burnable"
    stateful entrypoint burn : (int) => unit
```

## AENS Wrapping

```sophia
contract interface IAENSWrapping : IAEX141 =

    record config = 
        { reward: int
        , reward_block_window: int
        , emergency_reward: int
        , emergency_reward_block_window : int
        , can_receive_from_others : bool }

    /// @notice wraps AENS names into a fresh minted NFT, adds NFT metadata, extends all names
    /// @param names_delegation_sigs a map (key = AENS name, value = delegation signature)
    /// @return the NFT id
    stateful entrypoint wrapAndMint : (map(string, signature)) => int

    /// @notice wraps a single AENS name into an existing NFT, adds NFT metadata, updates expiry of name to match expiry of already wrapped names
    /// @param nft_id the id of the NFT to wrap the AENS name into
    /// @param name the AENS name to wrap
    /// @param delegation_sig the delegation signature for the name
    stateful entrypoint wrapSingle : (int, string, signature) => unit

    /// @notice wraps multiple AENS names into an existing NFT, adds NFT metadata, updates expiry of names to match expiry of already wrapped names
    /// @param nft_id the id of the NFT to wrap the AENS name into
    /// @param names_delegation_sigs a map (key = AENS name, value = delegation signature)
    stateful entrypoint wrapMultiple : (int, map(string, signature)) => unit

    /// @notice adds / replaces a pointer of the AENS name while keeping existing pointers
    /// @param nft_id the id of the NFT where the AENS name is wrapped into
    /// @param name the AENS name where the pointer will be added / replaced
    /// @param pointer_key the key of the pointer
    /// @param pointer_value the object to point to (account, channel, contract, oracle)
    stateful entrypoint addPointer : (int, string, string, pointee) => unit

    /// @notice adds / replaces a set of pointers of the AENS name
    /// @param nft_id the id of the NFT where the AENS name is wrapped into
    /// @param name the AENS name where the pointer will be added / replaced
    /// @param pointers a map of pointers to set
    /// @param keep_existing a bool indicating whether to keep existing pointers or not
    stateful entrypoint addPointers : (int, string, map(string, pointee), bool) => unit

    /// @notice removes a pointer of the AENS name
    /// @param nft_id the id of the NFT where the AENS name is wrapped into
    /// @param name the AENS name where the pointer will be removed
    /// @param pointer_key the key of the pointer
    stateful entrypoint removePointer : (int, string, string) => unit

    /// @notice removes multiple pointers of the AENS name
    /// @param nft_id the id of the NFT where the AENS name is wrapped into
    /// @param name the AENS name where the pointers will be removed
    /// @param pointer_keys a set of pointer keys
    stateful entrypoint removePointers : (int, string, Set.set(string)) => unit

    /// @notice removes all pointers of the AENS name
    /// @param nft_id the id of the NFT where the AENS name is wrapped into
    /// @param name the AENS name where the pointers will be removed
    stateful entrypoint removeAllPointers : (int, string) => unit

    /// @notice revokes a single AENS name wrapped in the NFT, removes metadata
    /// @param nft_id the id of the NFT where the AENS name is wrapped into
    /// @param name the AENS name to revoke
    stateful entrypoint revokeSingle : (int, string) => unit

    /// @notice revokes multiple AENS names wrapped in the NFT, removes metadata
    /// @param nft_id the id of the NFT where the AENS name is wrapped into
    /// @param names the AENS names to revoke
    stateful entrypoint revokeMultiple : (int, Set.set(string)) => unit

    /// @notice revokes all AENS names wrapped in the NFT, removes metadata and burns the NFT
    /// @param nft_id the id of the NFT where the AENS name is wrapped into
    stateful entrypoint revokeAll : (int) => unit

    /// @notice transfers a single AENS name to another NFT by updating metadata of both NFTs, updates expiry of name to match expiry of already wrapped names
    /// @param nft_id_old the id of the NFT that currently wraps the AENS name
    /// @param nft_id_new the id of the NFT that will wrap the AENS name in the future
    /// @param name the AENS name to transfer
    stateful entrypoint transferSingle : (int, int, string) => unit

    /// @notice transfers multiple AENS names to another NFT by updating metadata of both NFTs, updates expiry of names to match expiry of already wrapped names
    /// @param nft_id_old the id of the NFT that currently wraps the AENS name
    /// @param nft_id_new the id of the NFT that will wrap the AENS name in the future
    /// @param names the AENS names to transfer
    stateful entrypoint transferMultiple : (int, int, Set.set(string)) => unit

    /// @notice transfers a single AENS name to another NFT by updating metadata of both NFTs, updates expiry of names to match expiry of already wrapped names, burns the old NFT
    /// @param nft_id_old the id of the NFT that currently wraps the AENS name
    /// @param nft_id_new the id of the NFT that will wrap the AENS name in the future
    stateful entrypoint transferAll : (int, int) => unit

    /// @notice claims the transfer of a single AENS name to another NFT, requires the current owner to provide the delegation signature off-chain to the owner of the target NFT, updates expiry of name to match expiry of already wrapped names
    /// @param nft_id_old the id of the NFT that currently wraps the AENS name
    /// @param nft_id_new the id of the NFT that will wrap the AENS name in the future
    /// @param name the AENS name to transfer
    /// @param delegation_sig the delegation signature for the name provided by the owner of nft_id_old
    stateful entrypoint claimSingleTransfer : (int, int, string, signature) => unit

    /// @notice claims the transfer of a single AENS name to another NFT, requires the current owner to provide the delegation signatures off-chain to the owner of the target NFT, updates expiry of names to match expiry of already wrapped names
    /// @param nft_id_old the id of the NFT that currently wraps the AENS name
    /// @param nft_id_new the id of the NFT that will wrap the AENS name in the future
    /// @param names_delegation_sigs a map (key = AENS name, value = delegation signature)
    stateful entrypoint claimMultipleTransfer : (int, int, map(string, signature)) => unit

    /// @notice transfers the AENS name back to the owner or to another defined recipient, updates metadata
    /// @param nft_id the id of the NFT that currently wraps the AENS name
    /// @param name the AENS name to transfer
    /// @param recipient the address that should receive the AENS name
    stateful entrypoint unwrapSingle : (int, string, option(address)) => unit

    /// @notice transfers the AENS names back to the owner or to another defined recipient, updates metadata
    /// @param nft_id the id of the NFT that currently wraps the AENS name
    /// @param names the AENS names to transfer
    /// @param recipient the address that should receive the AENS name
    stateful entrypoint unwrapMultiple : (int, Set.set(string), option(address)) => unit

    /// @notice transfers all AENS names back to the owner or to another defined recipient, updates metadata, burns the NFT
    /// @param nft_id the id of the NFT that currently wraps the AENS name
    /// @param recipient the address that should receive the AENS name
    stateful entrypoint unwrapAll : (int, option(address)) => unit

    /// @notice caller sets global config for NFTs owned by the caller
    /// @param config the global config
    stateful entrypoint setGlobalConfig : (config) => unit

    /// @notice caller removes global config for NFTs owned by the caller
    stateful entrypoint removeGlobalConfig : () => unit

    /// @notice caller sets NFT specific config
    /// @param nft_id the id of the NFT to set the config
    /// @param config the nft specific config
    stateful entrypoint setNftConfig : (int, config) => unit

    /// @notice caller removes NFT specific config
    /// @param nft_id the id of the NFT to remove the config from
    stateful entrypoint removeNftConfig : (int) => unit

    /// @notice caller deposits AE to his reward pool
    stateful entrypoint depositToRewardPool : () => unit

    /// @notice caller withdraws all AE or a specific amount from his reward pool
    /// @param amount the optional amount of AE to withdraw
    stateful entrypoint withdrawFromRewardPool : (option(int)) => unit

    /// @notice calculates the reward based on the expiration date of the names wrapped in an NFT, considering the global config (or the NFT specific config if set) and the amount of Æ deposited by the NFT owner
    /// @param nft_id the id of the NFT to extend
    /// @return the estimated reward
    entrypoint estimateReward : (int) => int

    /// @notice extends all AENS names wrapped in the NFT without getting a reward
    /// @param nft_id the id of the NFT that wraps the AENS names to extend
    stateful entrypoint extendAll : (int) => unit

    /// @notice extends all AENS names wrapped in the NFT and distributes a reward to the caller
    /// @param nft_id the id of the NFT that wraps the AENS names to extend
    stateful entrypoint extendAllForReward : (int) => unit

    /// @notice transfers a set of NFTs to the desired recipient
    /// @param recipient the address to become new owner of the NFTs
    /// @param nft_ids the ids of the NFTs to transfer
    stateful entrypoint transferMultiple : (address, Set.set(int)) => unit

    /// @notice burns a set of NFTs (only possible if AENS names are expired)
    /// @param nft_ids the ids of the NFTs to burn
    stateful entrypoint burnMultiple : (Set.set(int)) => unit
```