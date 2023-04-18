``` mermaid
mindmap
    root(Wrapping AENS names<br/>into AEX-141 NFTs)
        NFT contract logic
            Minting on transfer of AENS names to contract
                Requires delegation signature of AENS owner
                Allow to add AENS names to existing NFTs
                Limit the amount of AENS names per NFT
            Allow transfer of AENS names between NFTs
                Only if caller is owner of both NFTs?
            Burn the NFT
                All AENS names have been claimed
                All AENS names are expired
                    Requires a separate trigger from outside
            Show AENS names and their state
            Remove expired AENS names from NFT
            Allow anybody to extend AENS names of NFTs
                All names
                Set of names
                Specific names
        Payment & Rewards
            How to incentivize users to extend AENS names of others?
                AENS token
                Funding provided by NFT owner
                    Would need restriction, only allow extending X blocks before expiration
        AENS token
            Issuance
                Reward for wrapping AENS names
                Reward for extending AENS names
                    Depending on stake
                    Depending on amount of AENS names
                    Depending on expiration time of AENS names
            Utility
                DAO / Governance
                Staking on NFTs
                    Increase visibility in the UI
                    Increases AENS token reward
                        For staker
                        For user who extends AENS names
                    How to deal with the staked tokens if the NFT is burned?
                        Claim back by staker only?
                        Claim back by anybody after a certain time has passed?
                        Burn after a certain time has passed?
        Transferred or donated AENS names
            Sell
                Listing vs. Auction
                    Fixed vs. dynamic price
                What happens with sale proceeds?
            Make claimable by anybody
            Let expire
```