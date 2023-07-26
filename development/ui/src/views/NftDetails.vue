<template>
  <div>
    <h2>NFT ID: {{ nftId }}</h2>
    <p v-if="isLoading">Loading NFT data ...</p>
    <div class="nft-details">
      <div v-if="!isLoading && !nftData">NFT does not exist!</div>
      <div v-if="!isLoading && nftData">
        <ul>
          <li>Owner: {{ nftData.owner }}</li>
          <li>Expiration height: {{ nftData.expiration_height }}</li>
          <li v-if="nftData.names.length > 0">Names:</li>
          <ul v-if="nftData.names.length > 0">
            <li v-for="name in nftData?.names" :key="name">
              {{ name }}
            </li>
          </ul>
          <li v-else>Names: n/a</li>
          <li v-if="nftData.config">Config:</li>
          <ul v-if="nftData.config">
            <li>Reward: {{ nftData.config.reward }}</li>
            <li>Reward block window: {{ nftData.config.reward_block_window }}</li>
            <li>Emergency reward: {{ nftData.config.emergency_reward }}</li>
            <li>Emergency reward block window: {{ nftData.config.emergency_reward_block_window }}</li>
            <li>Can receive from others: {{ nftData.config.can_receive_from_others }}</li>
            <li>Burnable if expired or empty: {{ nftData.config.burnable_if_expired_or_empty }}</li>
          </ul>
          <li v-else>Config: n/a</li>
          <li>Estimated reward: {{ estimatedReward }}</li>
        </ul>
      </div>
    </div>
    <div v-if="!isLoading && nftData">
      <div v-if="nftData.names.length > 0">
        <span>
          <strong>Recipient (optional): </strong>
          <input v-model="recipient" placeholder="ak_..." />
        </span>
        <div>
          <button @click="unwrapAll()">
            unwrap_all
          </button>
        </div>
        <div>
          <span>
          <strong>Name(s) to unwrap (comma separated): </strong>
            <input v-model="namesToUnwrap" placeholder="xyz.chain" />
          </span>
          <button @click="unwrapSingle()">
            unwrap_single
          </button>
          <button @click="unwrapMultiple()">
            unwrap_multiple
          </button>
        </div>
      </div>
      <div v-else-if="!nftData.config || nftData.config.burnable_if_expired_or_empty">
        <button @click="burn()">
          burn_nft
        </button>
      </div>
      <div v-if="nftData">
        <button @click="extendAll(false)">
          extend_all
        </button>
      </div>
      <div v-if="nftData && estimatedReward > 0">
        <button @click="extendAll(true)">
          extend_all_for_reward
        </button>
      </div>
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
  import { ref } from 'vue';
  import { useRoute } from 'vue-router'
  import { state } from '../utils/aeternity/aeternity'

  const route = useRoute();  
  const nftId = route.params.id; // read parameter id (it is reactive)

  let isLoading = ref(true)
  let nftData = ref()
  let estimatedReward = ref()
  let recipient = ref()
  let namesToUnwrap = ref()
  let txExecuting = ref(false)
  let txHash = ref()

  const loadNftData = async () => {
    while(isLoading.value) {
      if(state.status === 'connected') {
        try {
          nftData.value = (await state.contract.get_nft_data(nftId)).decodedResult
          estimatedReward.value = (await state.contract.estimate_reward(nftId)).decodedResult
        } catch (e) {
          console.error(e)
        }
        isLoading.value = false
      }
      await delay(1000)
    }
  }

  const unwrapAll = async () => {
    txExecuting.value = true
    try {
      const tx = await state.contract.unwrap_all(nftId, recipient.value)
      txHash.value = tx.hash
      console.log(tx)
    } catch(e) {
      alert(e)
    }
    txExecuting.value = false
  }

  const unwrapSingle = async () => {
    if(!namesToUnwrap.value) {
      alert("please provide a name")
      return
    }
    const names = namesToUnwrap.value.split(",")
    if(names.length != 1) {
      alert("provide exactly one name")
      return
    }
    if(!nftData.value.names.includes(names[0])) {
      alert("provided name is not wrapped")
      return
    }
    txExecuting.value = true
    try {
      const tx = await state.contract.unwrap_single(nftId, names[0], recipient.value)
      txHash.value = tx.hash
      console.log(tx)
    } catch(e) {
      alert(e)
    }
    txExecuting.value = false
  }

  const unwrapMultiple = async () => {
    if(!namesToUnwrap.value) {
      alert("please provide multiple names")
      return
    }
    const names = namesToUnwrap.value.split(",")
    if(names.length < 2) {
      alert("provide more than 1 name")
      return
    }
    for(let i=0; i<names.length; i++) {
      console.log(names[i])
      console.log(nftData.value.names.includes(names[i]))
      if(!nftData.value.names.includes(names[i])) {
        alert("one of the provided names is not wrapped")
        return
      }
    }
    txExecuting.value = true
    try {
      const tx = await state.contract.unwrap_multiple(nftId, names, recipient.value)
      txHash.value = tx.hash
      console.log(tx)
    } catch(e) {
      alert(e)
    }
    txExecuting.value = false
  }

  const burn = async () => {
    txExecuting.value = true
    try {
      const tx = await state.contract.burn(nftId)
      txHash.value = tx.hash
      console.log(tx)
    } catch(e) {
      alert(e)
    }
    txExecuting.value = false
  }

  const extendAll = async (forReward) => {
    txExecuting.value = true
    try {
      let tx
      if(forReward) {
        tx = await state.contract.extend_all_for_reward(nftId)
      } else {
        tx = await state.contract.extend_all(nftId)
      }
      txHash.value = tx.hash
      console.log(tx)
    } catch(e) {
      alert(e)
    }
    txExecuting.value = false
  }

  const delay = (millisec) => {
    return new Promise(resolve => {
        setTimeout(() => { resolve() }, millisec);
    })
  }

  loadNftData()
</script>
  
<style scoped>
  .nft-details {
    margin: 0 auto;
    max-width: 620px;
  
    border: 2px solid #de3f6b;
    border-radius: 15px;
    padding: 20px;
    text-align: left;
  }
  
  .nft-details strong {
    color: #de3f6b;
  }
</style>
  