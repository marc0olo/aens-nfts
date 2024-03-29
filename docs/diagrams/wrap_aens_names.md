# Wrap AENS names

## Wrap names by minting a new NFT
```mermaid
sequenceDiagram
    actor AENS owner
    AENS owner ->> NFT Contract: 1) wrap_and_mint: map(name, delegation_signature)
    Note left of NFT Contract: claims ownership of names
    Note left of NFT Contract: mints NFT
    Note left of NFT Contract: assigns names to NFT
    Note left of NFT Contract: extends all names
    NFT Contract -->> AENS owner: 1.1) assign ownership of NFT
```

### Iris protocol limitation

- Delegation signature needs to be created in advance for each AENS name.
    - With the future Ceres protocol upgrade, it will be possible to give a contract permission to handle all AENS names owned by an account, see: [https://github.com/aeternity/aeternity/issues/4080](https://github.com/aeternity/aeternity/issues/4080)

## Wrap name into existing NFT
```mermaid
sequenceDiagram
    actor AENS owner
    AENS owner ->> NFT Contract: 1) wrap_single: nft_id, name, delegation_signature
    Note left of NFT Contract: claims ownership of name
    Note left of NFT Contract: assigns name to NFT
    Note left of NFT Contract: updates expiry of name to wrap to match expiry of names in nft_id
```

## Wrap multiple names into existing NFT
```mermaid
sequenceDiagram
    actor AENS owner
    AENS owner ->> NFT Contract: 1) wrap_multiple: nft_id, map(name, delegation_signature)
    Note left of NFT Contract: claims ownership of names
    Note left of NFT Contract: assigns names to NFT
    Note left of NFT Contract: updates expiry of names to wrap to match expiry of names in nft_id
```