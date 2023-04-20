# Update pointers of AENS names

## Add a single pointer
```mermaid
sequenceDiagram
    actor NFT owner
    NFT owner ->> NFT Contract: 1) addPointer: nft_id, name, pointer_key, pointer_object
    Note left of NFT Contract: keeps other existing pointers
    Note left of NFT Contract: adds (replaces) a single pointer of the provided name
```

## Add a set of pointers
```mermaid
sequenceDiagram
    actor NFT owner
    NFT owner ->> NFT Contract: 1) setPointers: nft_id, name, map(pointer_key, pointer_object), keepExisting
    Note left of NFT Contract: keeps other existing pointers only if keepExisting=true
    Note left of NFT Contract: sets (replaces) pointers of the provided name
```

## Remove a single pointer
```mermaid
sequenceDiagram
    actor NFT owner
    NFT owner ->> NFT Contract: 1) removePointer: nft_id, name, pointer_key
    Note left of NFT Contract: keeps other existing pointers
    Note left of NFT Contract: removes the provided pointer of the provided name
```

## Remove multiple pointers
```mermaid
sequenceDiagram
    actor NFT owner
    NFT owner ->> NFT Contract: 1) removePointers: nft_id, name, Set(pointer_key)
    Note left of NFT Contract: keeps other existing pointers
    Note left of NFT Contract: removes the provided pointers of the provided name
```

## Remove all pointers
```mermaid
sequenceDiagram
    actor NFT owner
    NFT owner ->> NFT Contract: 1) removeAllPointers: nft_id, name
    Note left of NFT Contract: removes the provided pointer of the provided name
```