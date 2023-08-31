# Extend AENS names

## For free
```mermaid
sequenceDiagram
    actor Any user
    Any user ->> NFT Contract: 1) extend_all: nft_id
    Note left of NFT Contract: extends all wrapped AENS names of the given NFT
```

## For reward
```mermaid
sequenceDiagram
    actor Any user
    Any user ->> NFT Contract: 1) extend_all_for_reward: nft_id
    Note left of NFT Contract: extends all wrapped AENS names of the given NFT
    NFT Contract -->> Any user: 2) send AE
    Note left of NFT Contract: use amount of reward specified by NFT owner
```