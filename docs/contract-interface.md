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

    datatype event
        // name, nft_id, owner, new_ttl
        = NameWrap(string, int, address, int)
        // name, nft_id, current_owner, recipient
        | NameUnwrap(string, int, address, address)
        // name, nft_id, new_ttl, caller
        | NameExtend(string, int, int, address)
        // name, nft_id_old, nft_id_new
        | NameTransfer(string, int, int)
        // nft_id, caller, reward
        | Reward(int, address, int)

    record nft_data =
        { id: int
        , owner: address
        , owner_config: option(config)
        , names: list(string)
        , expiration_height: int }

    record config =
        { reward: int
        , reward_block_window: int
        , emergency_reward: int
        , emergency_reward_block_window: int
        , can_receive_from_others: bool
        , burnable_if_empty: bool }

    /// @notice returns the account address of the real owner
    /// @param name the name to lookup
    /// @return real owner
    entrypoint resolve_owner : (string) => option(address)

    /// @notice returns the nft id where the AENS name is wrapped into
    /// @param name the name to lookup
    /// @return nft_id
    entrypoint resolve_nft_id : (string) => option(int)

    /// @notice returns the nft id where the AENS name is wrapped into as well as the real owner of the name
    /// @param name the name to lookup
    /// @return nft_id and owner
    entrypoint resolve_nft_id_and_owner : (string) => option(int * address)

    /// @notice returns the nft id where the AENS name is wrapped into as well as the real owner of the name
    /// @param nft_id the NFT id
    /// @return nft_data
    entrypoint get_nft_data : (string) => option(nft_data)

    /// @notice returns the expiration height of names that are wrapped into the provided nft id
    /// @param nft_id the NFT id
    /// @return the (fixed) height where all names wrapped into the nft will expire
    entrypoint get_expiration_by_nft_id : (int) => option(int)

    /// @notice returns the global config for an account
    /// @param account the account address to lookup the config for
    /// @return the global config for an account OR None if not set
    entrypoint get_global_config : (address) => option(config)

    /// @notice returns the balance included in the reward pool
    /// @param account the account where the reward pool balance should be looked up for
    /// @return the reward pool balance
    entrypoint get_reward_pool : (address) => int

    /// @notice wraps AENS names into a fresh minted NFT, adds NFT metadata, extends all names
    /// @param names_delegation_sigs a map (key = AENS name, value = delegation signature)
    /// @return the NFT id
    stateful entrypoint wrap_and_mint : (map(string, signature)) => int

    /// @notice wraps a single AENS name into an existing NFT, adds NFT metadata, updates expiry of name to match expiry of already wrapped names
    /// @param nft_id the id of the NFT to wrap the AENS name into
    /// @param name the AENS name to wrap
    /// @param delegation_sig the delegation signature for the name
    stateful entrypoint wrap_single : (int, string, signature) => unit

    /// @notice wraps multiple AENS names into an existing NFT, adds NFT metadata, updates expiry of names to match expiry of already wrapped names
    /// @param nft_id the id of the NFT to wrap the AENS name into
    /// @param names_delegation_sigs a map (key = AENS name, value = delegation signature)
    stateful entrypoint wrap_multiple : (int, map(string, signature)) => unit

    /// @notice adds / replaces a pointer of the AENS name while keeping existing pointers
    /// @param nft_id the id of the NFT where the AENS name is wrapped into
    /// @param name the AENS name where the pointer will be added / replaced
    /// @param pointer_key the key of the pointer
    /// @param pointer_value the object to point to (account, channel, contract, oracle)
    stateful entrypoint add_pointer : (int, string, string, AENS.pointee) => unit

    /// @notice adds / replaces a set of pointers of the AENS name
    /// @param nft_id the id of the NFT where the AENS name is wrapped into
    /// @param name the AENS name where the pointer will be added / replaced
    /// @param pointers a map of pointers to set
    /// @param keep_existing a bool indicating whether to keep existing pointers or not
    stateful entrypoint add_pointers : (int, string, map(string, AENS.pointee), bool) => unit

    /// @notice removes a pointer of the AENS name
    /// @param nft_id the id of the NFT where the AENS name is wrapped into
    /// @param name the AENS name where the pointer will be removed
    /// @param pointer_key the key of the pointer
    stateful entrypoint remove_pointer : (int, string, string) => unit

    /// @notice removes multiple pointers of the AENS name
    /// @param nft_id the id of the NFT where the AENS name is wrapped into
    /// @param name the AENS name where the pointers will be removed
    /// @param pointer_keys a set of pointer keys
    stateful entrypoint remove_pointers : (int, string, Set.set(string)) => unit

    /// @notice removes all pointers of the AENS name
    /// @param nft_id the id of the NFT where the AENS name is wrapped into
    /// @param name the AENS name where the pointers will be removed
    stateful entrypoint remove_all_pointers : (int, string) => unit

    /// @notice revokes a single AENS name wrapped in the NFT, removes metadata
    /// @param nft_id the id of the NFT where the AENS name is wrapped into
    /// @param name the AENS name to revoke
    stateful entrypoint revoke_single : (int, string) => unit

    /// @notice revokes multiple AENS names wrapped in the NFT, removes metadata
    /// @param nft_id the id of the NFT where the AENS name is wrapped into
    /// @param names the AENS names to revoke
    stateful entrypoint revoke_multiple : (int, Set.set(string)) => unit

    /// @notice revokes all AENS names wrapped in the NFT, removes metadata and burns the NFT
    /// @param nft_id the id of the NFT where the AENS name is wrapped into
    stateful entrypoint revoke_all : (int) => unit

    /// @notice transfers a single AENS name to another NFT by updating metadata of both NFTs, updates expiry of name to match expiry of already wrapped names
    /// @param nft_id_old the id of the NFT that currently wraps the AENS name
    /// @param nft_id_new the id of the NFT that will wrap the AENS name in the future
    /// @param name the AENS name to transfer
    stateful entrypoint transfer_single : (int, int, string) => unit

    /// @notice transfers multiple AENS names to another NFT by updating metadata of both NFTs, updates expiry of names to match expiry of already wrapped names
    /// @param nft_id_old the id of the NFT that currently wraps the AENS name
    /// @param nft_id_new the id of the NFT that will wrap the AENS name in the future
    /// @param names the AENS names to transfer
    stateful entrypoint transfer_multiple : (int, int, Set.set(string)) => unit

    /// @notice transfers a single AENS name to another NFT by updating metadata of both NFTs, updates expiry of names to match expiry of already wrapped names, burns the old NFT
    /// @param nft_id_old the id of the NFT that currently wraps the AENS name
    /// @param nft_id_new the id of the NFT that will wrap the AENS name in the future
    stateful entrypoint transfer_all : (int, int) => unit

    /// @notice transfers a single AENS name to another NFT by requiring explicit authorization of the recipient via delegation signature. can be used if can_receive_from_others is false
    /// @param nft_id_old the id of the NFT that currently wraps the AENS name
    /// @param nft_id_new the id of the NFT that will wrap the AENS name in the future
    /// @param name the AENS name to transfer
    /// @param delegation_sig the delegation signature for the name provided by the owner of nft_id_new
    stateful entrypoint transfer_single_authorized : (int, int, string, signature) => unit

    /// @notice transfers multiple AENS names to another NFT by requiring explicit authorization of the recipient via delegation signatures. can be used if can_receive_from_others is false
    /// @param nft_id_old the id of the NFT that currently wraps the AENS name
    /// @param nft_id_new the id of the NFT that will wrap the AENS name in the future
    /// @param names_delegation_sigs a map (key = AENS name, value = delegation signature)
    stateful entrypoint transfer_multiple_authorized : (int, int, map(string, signature)) => unit

    /// @notice transfers the AENS name back to the owner or to another defined recipient, updates metadata
    /// @param nft_id the id of the NFT that currently wraps the AENS name
    /// @param name the AENS name to transfer
    /// @param recipient the address that should receive the AENS name
    stateful entrypoint unwrap_single : (int, string, option(address)) => unit

    /// @notice transfers the AENS names back to the owner or to another defined recipient, updates metadata
    /// @param nft_id the id of the NFT that currently wraps the AENS name
    /// @param names the AENS names to transfer
    /// @param recipient the address that should receive the AENS name
    stateful entrypoint unwrap_multiple : (int, Set.set(string), option(address)) => unit

    /// @notice transfers all AENS names back to the owner or to another defined recipient, updates metadata, burns the NFT
    /// @param nft_id the id of the NFT that currently wraps the AENS name
    /// @param recipient the address that should receive the AENS name
    stateful entrypoint unwrap_all : (int, option(address)) => unit

    /// @notice caller sets global config for NFTs owned by the caller
    /// @param config the global config
    stateful entrypoint set_global_config : (config) => unit

    /// @notice caller removes global config for NFTs owned by the caller
    stateful entrypoint remove_global_config : () => unit

    /// @notice caller sets NFT specific config
    /// @param nft_id the id of the NFT to set the config
    /// @param config the nft specific config
    stateful entrypoint set_nft_config : (int, config) => unit

    /// @notice caller removes NFT specific config
    /// @param nft_id the id of the NFT to remove the config from
    stateful entrypoint remove_nft_config : (int) => unit

    /// @notice caller deposits AE to his reward pool
    stateful payable entrypoint deposit_to_reward_pool : () => unit

    /// @notice caller withdraws all AE or a specific amount from his reward pool
    /// @param amount the optional amount of AE to withdraw
    stateful entrypoint withdraw_from_reward_pool : (option(int)) => unit

    /// @notice calculates the reward based on the expiration date of the names wrapped in an NFT, considering the global config (or the NFT specific config if set) and the amount of Æ deposited by the NFT owner
    /// @param nft_id the id of the NFT to extend
    /// @return the estimated reward
    entrypoint estimate_reward : (int) => int

    /// @notice extends all AENS names wrapped in the NFT without getting a reward
    /// @param nft_id the id of the NFT that wraps the AENS names to extend
    stateful entrypoint extend_all : (int) => unit

    /// @notice extends all AENS names wrapped in the NFT and distributes a reward to the caller
    /// @param nft_id the id of the NFT that wraps the AENS names to extend
    stateful entrypoint extend_all_for_reward : (int) => unit

    /// @notice transfers a set of NFTs to the desired recipient
    /// @param recipient the address to become new owner of the NFTs
    /// @param nft_ids the ids of the NFTs to transfer
    /// @param data optional data to be provided to a contract receiver
    stateful entrypoint transfer_multiple_nfts : (address, Set.set(int), option(string)) => unit

    /// @notice burns a set of NFTs (only possible if AENS names are expired)
    /// @param nft_ids the ids of the NFTs to burn
    stateful entrypoint burn_multiple_nfts : (Set.set(int)) => unit
```