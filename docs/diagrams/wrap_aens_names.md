# Wrap AENS names

## Wrap names by minting a new NFT
```mermaid
sequenceDiagram
    actor AENS owner
    AENS owner ->> NFT Contract: 1) wrapAndMint: map(name, delegation_signature)
    Note left of NFT Contract: claims ownership of names
    Note left of NFT Contract: mints NFT
    Note left of NFT Contract: assigns names to NFT
    Note left of NFT Contract: extends all names
    NFT Contract -->> AENS owner: 1.1) assign ownership of NFT
```

**Considerations**

- Delegation signature needs to be created in advance for each AENS name.
    - In the future it will be possible to give a contract permission to handle all AENS names owned by an account, see: [https://github.com/aeternity/aeternity/issues/4080](https://github.com/aeternity/aeternity/issues/4080)

## Wrap name into existing NFT
```mermaid
sequenceDiagram
    actor AENS owner
    AENS owner ->> NFT Contract: 1) wrapSingle: nft_id, name, delegation_signature
    Note left of NFT Contract: claims ownership of name
    Note left of NFT Contract: assigns name to NFT
    Note left of NFT Contract: extends all names
```

## Wrap multiple names into existing NFT
```mermaid
sequenceDiagram
    actor AENS owner
    AENS owner ->> NFT Contract: 1) wrapMultiple: nft_id, map(name, delegation_signature)
    Note left of NFT Contract: claims ownership of names
    Note left of NFT Contract: assigns names to NFT
    Note left of NFT Contract: extends all names
```