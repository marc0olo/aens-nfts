<template>
    <div class="contract">
        <h2>Contract Interaction</h2>
        <div class="details">
            <span>
              <strong>Contract ID: </strong>
              <a :href="`${state.aeScanUrl}/contracts/${state.contractId}`"
                target="_blank"
                rel="noreferrer">
                {{ state.contractId }}
              </a>
            </span>
            <br /><br />
            <span>
              <strong>Connected Address: </strong>
              <a :href="`${state.aeScanUrl}/accounts/${state.aeSdk.address}`"
                target="_blank"
                rel="noreferrer">
                {{ state.aeSdk.address }}
              </a>
            </span>
            <br /><br />
            <span>
              <strong>Meta Info: </strong>
              {{ metaInfo }}
              <button @click="getMetaInfo()">
                meta_info
              </button>
            </span>
            <br /><br />
            <span>
              <strong>AEX-141 extensions: </strong>
              {{ aex141Extensions }}
              <button @click="getAex141Extensions()">
                aex141_extensions
              </button>
            </span>
            <br /><br />
            <span>
              <strong>Total NFT Supply: </strong>
              {{ totalSupply }}
              <button @click="getTotalSupply()">
                total_supply
              </button>
            </span>
            <br /><br />
            <span>
              <strong>Owned NFT IDs: </strong>
              {{ ownedNfts }}
              <button @click="getOwnedNfts()">
                get_owned_tokens
              </button>
            </span>
            <br /><br />
            <span>
              <strong>NFT ID: </strong>
              <input v-model="nftId" placeholder="nftId" @input="resetNftIdResults()" />
            </span>
            <br /><br />
            <span>
              <strong>NFT metadata for ID '{{ nftId }}': </strong>
              {{ nftMetadata }}
              <button @click="getNftMetadata(nftId)">
                metadata
              </button>
            </span>
            <br /><br />
            <span>
              <strong>NFT data for ID '{{ nftId }}': </strong>
              {{ nftData }}
              <button @click="getNftData(nftId)">
                get_nft_data
              </button>
            </span>
            <br /><br />
            <span>
              <strong>Owner of NFT with ID '{{ nftId }}': </strong>
              <a v-if="nftOwner.startsWith('ak_')" :href="`${state.aeScanUrl}/accounts/${nftOwner}`"
                target="_blank"
                rel="noreferrer">
                {{ nftOwner }}
              </a>
              <p v-else>{{ nftOwner }}</p>
              <button @click="getNftOwner(nftId)">
                owner
              </button>
            </span>
            <br /><br />
            <span>
              <strong>AENS name: </strong>
              <input v-model="aensName" placeholder="AENS name (e.g. abc.chain)" @input="resetAensNameResults()" />
            </span>
            <br /><br />
            <span>
              <strong>Owner & NFT ID of name '{{ aensName }}': </strong>
              <p v-if="Array.isArray(aensOwnerNftId)">
                <a :href="`${state.aeScanUrl}/accounts/${aensOwnerNftId[1]}`"
                  target="_blank"
                  rel="noreferrer">
                  {{ aensOwnerNftId[1] }}
                </a> (ID: {{ aensOwnerNftId[0] }})
              </p>
              <p v-else>{{ aensOwnerNftId }}</p>
              <button @click="getOwnerAndNftId(aensName)">
                resolve_nft_id_and_owner
              </button>
            </span>
        </div>
    </div>
</template>

<script setup>
  import { ref } from 'vue'
  import { state } from '../utils/aeternity/aeternity'

  const toString = (value) => (
    typeof value === 'string'
      ? value
      : JSON.stringify(value, (k, v) => (typeof v === 'bigint' ? `${v}` : v), 2)
  )

  let nftId = ref()
  let aensName = ref()

  let metaInfo = ref()
  let aex141Extensions = ref()
  let totalSupply = ref()
  let ownedNfts = ref()
  let nftOwner = ref('')
  let nftMetadata = ref()
  let nftData = ref()
  let aensOwnerNftId = ref('')

  async function resetNftIdResults() {
    nftOwner.value = ''
    nftMetadata.value = undefined
    nftData.value = undefined
  }

  async function resetAensNameResults() {
    aensOwnerNftId.value = undefined
  }

  async function getMetaInfo() {
    metaInfo.value = 'loading...'
    try {
      metaInfo.value = toString((await state.contract.meta_info()).decodedResult)
    } catch (error) {
      metaInfo.value = 'error loading'
      throw error
    }
  }

  async function getAex141Extensions() {
    aex141Extensions.value = 'loading...'
    try {
      aex141Extensions.value = toString((await state.contract.aex141_extensions()).decodedResult)
    } catch (error) {
      aex141Extensions.value = 'error loading'
      throw error
    }
  }

  async function getTotalSupply() {
    totalSupply.value = 'loading...'
    try {
      totalSupply.value = (await state.contract.total_supply()).decodedResult
    } catch (error) {
      totalSupply.value = 'error loading'
      throw error
    }
  }

  async function getOwnedNfts() {
    ownedNfts.value = 'loading...'
    try {
      ownedNfts.value = (await state.contract.get_owned_tokens(state.aeSdk.address)).decodedResult
    } catch (error) {
      ownedNfts.value = 'error loading'
      throw error
    }
  }

  async function getNftOwner(nftId) {
    if(!nftId) {
      nftOwner.value = 'input for nftId missing'
      return
    }
    nftOwner.value = 'loading...'
    try {
      const owner = (await state.contract.owner(nftId)).decodedResult
      nftOwner.value = owner ? owner : 'nft does not exist'
    } catch (error) {
      nftOwner.value = 'error loading'
      throw error
    }
  }

  async function getNftMetadata(nftId) {
    if(!nftId) {
      nftMetadata.value = 'input for nftId missing'
      return
    }
    nftMetadata.value = 'loading...'
    try {
      const metadata = (await state.contract.metadata(nftId)).decodedResult
      nftMetadata.value = metadata ? metadata : 'nft does not exist'
    } catch (error) {
      nftMetadata.value = 'error loading'
      throw error
    }
  }

  async function getNftData(nftId) {
    if(!nftId) {
      nftData.value = 'input for nftId missing'
      return
    }
    nftData.value = 'loading...'
    try {
      const data = (await state.contract.get_nft_data(nftId)).decodedResult
      nftData.value = data ? toString(data) : 'nft does not exist'
    } catch (error) {
      nftData.value = 'error loading'
      throw error
    }
  }

  async function getOwnerAndNftId(aensName) {
    if(!aensName) {
      aensOwnerNftId.value = 'input for aensName missing'
      return
    }
    aensOwnerNftId.value = 'loading...'
    try {
      const result = (await state.contract.resolve_nft_id_and_owner(aensName)).decodedResult
      aensOwnerNftId.value = result ? result : 'AENS name not wrapped'
    } catch (error) {
      aensOwnerNftId.value = 'error loading'
      throw error
    }
  }
</script>

<style scoped>
  .contract .details {
    margin: 0 auto;
    max-width: 720px;

    border: 2px solid #de3f6b;
    border-radius: 15px;
    padding: 0 20px;
    text-align: left;
    word-break: break-all;
    font-size: 16px;
  }

  .contract .details > * {
    margin: 20px 0;
  }

  .contract .details > strong {
    display: block;
  }

  .contract .details strong {
    color: #de3f6b;
  }

  .contract .details pre {
    overflow: hidden;
  }

  .contract .details button {
    display: block;
    border: 2px solid #de3f6b;
    border-radius: 15px;
    background: none;
    font-size: 16px;
    padding: 2px 8px;
  }
</style>