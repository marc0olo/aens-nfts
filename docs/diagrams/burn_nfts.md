# Explicit Burn of NFTs

Note:

- Burning NFTs is only possible if the wrapped AENS names are expired
- The burn entrypoint is part of the AEX-141 standard and can be called by any user

## Single

```mermaid
sequenceDiagram
    actor Any user
    Any user ->> NFT Contract: 1) burn: nft_id
    Note left of NFT Contract: default burn entrypoint of AEX-141
    Note left of NFT Contract: removes all data associated with the NFT
    Note left of NFT Contract: burns the NFT
```

## Multiple

```mermaid
sequenceDiagram
    actor Any user
    Any user ->> NFT Contract: 1) burnMultiple: Set(nft_id)
    Note left of NFT Contract: removes all data associated with the NFTs
    Note left of NFT Contract: burns the NFTs
```
