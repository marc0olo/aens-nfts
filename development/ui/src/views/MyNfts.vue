<template>
  <div>
    <p v-if="isWaiting">Waiting for wallet connection ...</p>
    <div v-if="tokensOwned.length > 0">
      <div class="my-nfts-container">
        <ul>
          <li v-for="id in tokensOwned" :key="id">
            <router-link
              :to="{
                name: 'NftDetails',
                params: {
                  id: id
                }
              }">
              {{ id }}
            </router-link>
          </li>
        </ul>
      </div>
    </div>
    <div v-else-if="!isWaiting">
      You don't own an NFT.
    </div>
    <div>
      <NftDetails />
    </div>
    <p v-if="txExecuting">Waiting for tx to be mined ...</p>
    <p v-if="txHash">
      Transaction mined:
      <a :href="`${state.aeScanUrl}/transactions/${txHash}`"
        target="_blank"
        rel="noreferrer">
       {{ txHash }}
      </a>
    </p>
  </div>
</template>

<script setup>
  import { ref } from 'vue'
  import { state } from '../utils/aeternity/aeternity'

  let tokensOwned = ref([])
  let isWaiting = ref(true)
  let txExecuting = ref(false)
  let txHash = ref()

  const loadNftsOwned = async () => {
    while(isWaiting.value) {
      if(state.status === 'connected') {
        tokensOwned.value = (await state.contract.get_owned_tokens(state.aeSdk.address)).decodedResult
        isWaiting.value = false
      }
      await delay(1000)
    }
  }

  const delay = (millisec) => {
    return new Promise(resolve => {
        setTimeout(() => { resolve() }, millisec);
    })
  }

  loadNftsOwned()
</script>

<style scoped>
.my-nfts-container {
  margin: 0 auto;
  max-width: 720px;

  display: flex;
  justify-content: center;
  border: 2px solid #de3f6b;
  border-radius: 15px;
  padding: 10px;
}
</style>