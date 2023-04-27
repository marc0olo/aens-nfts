# Transfer AENS names

## Single name

```mermaid
sequenceDiagram
    actor NFT owner
    NFT owner ->> NFT Contract: 1) transferSingle: nft_id_old, nft_id_new, name
    Note left of NFT Contract: requires caller to be owner of both NFTs
    Note left of NFT Contract: changes association of name from one NFT to another NFT
    Note left of NFT Contract: updates expiry of transferred name to match expiry of names in nft_id_new
```

## Multiple names

```mermaid
sequenceDiagram
    actor NFT owner
    NFT owner ->> NFT Contract: 1) transferMultiple: nft_id_old, nft_id_new, Set(names)
    Note left of NFT Contract: requires caller to be owner of both NFTs
    Note left of NFT Contract: changes association of names from one NFT to another NFT
    Note left of NFT Contract: updates expiry of transferred names to match expiry of names in nft_id_new
```

## All names

```mermaid
sequenceDiagram
    actor NFT owner
    NFT owner ->> NFT Contract: 1) transferAll: nft_id_old, nft_id_new
    Note left of NFT Contract: requires caller to be owner of both NFTs
    Note left of NFT Contract: changes association of name from one NFT to another NFT
    Note left of NFT Contract: updates expiry of transferred names to match expiry of names in nft_id_new
    Note left of NFT Contract: burns the old NFT
```

**Considerations**

- Allow to transfer AENS names to NFTs owned by other accounts?
    - Users could define per NFT if they want to allow this
    - By default this would not be allowed to prevent spamming NFTs with (unwanted) AENS names