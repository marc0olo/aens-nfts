# Explicit Burn of NFTs

Note:

- Burning NFTs is only possible if the wrapped AENS names are expired OR if the NFT is empty, meaning it does not wrap an AENS name
- The burn entrypoint is part of the AEX-141 standard and can be called by any user
- If the config of the NFT owner allows it, anybody can burn the NFT

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
    Any user ->> NFT Contract: 1) burn_multiple_nfts: Set(nft_id)
    Note left of NFT Contract: removes all data associated with the NFTs
    Note left of NFT Contract: burns the NFTs
```
