<template>
  <div>
    <h2>Reward Pool</h2>
    <p v-if="isWaiting">Waiting for wallet connection ...</p>
    <div v-else>
      Currently: {{ toAe(rewardPool) }} AE
      <br /><br />
      <button @click="withdraw(true)">
          withdraw all
      </button>
      <br /><br />
      <div>
          <span>
            <strong>Amount to add/withdraw: </strong>
            <input v-model="amount" />
          </span>
          <button @click="deposit()">
            deposit
          </button>
          <button @click="withdraw(false)">
            withdraw
          </button>
      </div>
    </div>
    <h2>Config</h2>
    <p v-if="isWaiting">Waiting for wallet connection ...</p>
    <div v-if="globalConfig">
      <div class="my-config-container">
        <ul>
          <li>Reward: {{ toAe(globalConfig.reward) }} AE</li>
          <li>Reward Block Window: {{ globalConfig.reward_block_window }}</li>
          <li>Emergency Reward: {{ toAe(globalConfig.emergency_reward) }} AE</li>
          <li>Emergency Reward Block Window: {{ globalConfig.emergency_reward_block_window }}</li>
          <li>NFTs can receive AENS names from others: {{ globalConfig.can_receive_from_others }}</li>
          <li>NFTs burnable if expired or empty: {{ globalConfig.burnable_if_expired_or_empty }}</li>
        </ul>
      </div>
      <br /><br />
    </div>
    <div v-else-if="!isWaiting">
      You haven't set a config yet. <br /><br />
    </div>
    <div v-if="!isWaiting">
      <span>
        <strong>Reward (AE): </strong>
        <input v-model="reward" />
      </span>
      <br />
      <span>
        <strong>Reward Block Window: </strong>
        <input v-model="rewardBlockWindow" />
      </span>
      <br />
      <span>
        <strong>Emergency Reward (AE): </strong>
        <input v-model="emergencyReward" />
      </span>
      <br />
      <span>
        <strong>Emergency Reward Block Window: </strong>
        <input v-model="emergencyRewardBlockWindow" />
      </span>
      <br />
      <span>
        <strong>NFTs can receive AENS names: </strong>
        <input v-model="canReceive" type="checkbox"/>
      </span>
      <br />
      <span>
        <strong>NFTs burnable if expired or empty: </strong>
        <input v-model="burnable" type="checkbox" />
      </span>
      <br /><br />
      <button @click="setConfig()">
          set/update config
      </button>
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
  import { toAe, toAettos } from '@aeternity/aepp-sdk'
  import { ref } from 'vue'
  import { state } from '../utils/aeternity/aeternity'

  let globalConfig = ref()
  let rewardPool = ref()

  let amount = ref()

  let reward = ref(0)
  let rewardBlockWindow = ref(0)
  let emergencyReward = ref(0)
  let emergencyRewardBlockWindow = ref(0)
  let canReceive = ref(false)
  let burnable = ref(false)

  let isWaiting = ref(true)
  let txExecuting = ref(false)
  let txHash = ref()

  const loadData = async () => {
    while(isWaiting.value) {
      if(state.status === 'connected') {
        globalConfig.value = (await state.contract.get_global_config(state.aeSdk.address)).decodedResult
        rewardPool.value = (await state.contract.get_reward_pool(state.aeSdk.address)).decodedResult
        isWaiting.value = false
      }
      await delay(1000)
    }
  }

  const deposit = async () => {
    if(!amount.value || amount.value <= 0 || isNaN(amount.value)) {
      alert("amount must be a number > 0")
      return
    }
    txExecuting.value = true
    try {
      const tx = await state.contract.deposit_to_reward_pool({ amount: toAettos(amount.value) })
      txHash.value = tx.hash
      console.log(tx)
    } catch(e) {
      alert(e)
    }
    txExecuting.value = false
  }

  const withdraw = async (all) => {
    let aettos
    if(all) {
      if(rewardPool.value == 0) {
        alert("nothing to withdraw")
        return
      }
    } else {
      if(!amount.value || amount.value <= 0 || isNaN(amount.value)) {
        alert("amount must be a number > 0")
        return
      }
      aettos = toAettos(amount.value)
      if(aettos > rewardPool.value) {
        alert("can't withdraw more AE than in pool")
        return
      }
    }
    txExecuting.value = true
    try {
      const tx = all
        ? await state.contract.withdraw_from_reward_pool()
        : await state.contract.withdraw_from_reward_pool(aettos)
      txHash.value = tx.hash
      console.log(tx)
    } catch(e) {
      alert(e)
    }
    txExecuting.value = false
  }

  const setConfig = async () => {
    txExecuting.value = true
    try {
      const config = {
        reward: toAettos(reward.value),
        reward_block_window: rewardBlockWindow.value,
        emergency_reward: toAettos(emergencyReward.value),
        emergency_reward_block_window: emergencyRewardBlockWindow.value,
        can_receive_from_others: canReceive.value,
        burnable_if_expired_or_empty: burnable.value
      }
      const tx = await state.contract.set_global_config(config)
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

  loadData()
</script>

<style scoped>
.my-config-container {
  margin: 0 auto;
  max-width: 720px;

  display: flex;
  justify-content: center;
  border: 2px solid #de3f6b;
  border-radius: 15px;
  padding: 10px;
}
</style>