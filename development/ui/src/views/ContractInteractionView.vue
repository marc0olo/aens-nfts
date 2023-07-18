<template>
    <div class="contract">
        <h2>Contract Interaction</h2>
        <div class="details">
            <span>
              <strong>Contract ID:</strong>
              {{ state.contractId }}
            </span>
            <br /><br />
            <span>
              <strong>Total Supply:</strong>
              {{ totalSupply }}
              <button @click="getTotalSupply()">
                call total_supply
              </button>
            </span>
        </div>
    </div>
</template>

<script setup>
  import { ref } from 'vue'
  import { state } from '../utils/aeternity/aeternity'

  // const toString = (value) => (
  //   typeof value === 'string'
  //     ? value
  //     : JSON.stringify(value, (k, v) => (typeof v === 'bigint' ? `${v} (as BigInt)` : v), 2)
  // )

  let totalSupply = ref()

  async function getTotalSupply() {
    totalSupply.value = '???'
    try {
      console.log(state.contract)
      console.log(await state.contract.total_supply())
    } catch (error) {
      totalSupply.value = 'error loading'
      throw error
    }
  }
</script>

<style scoped>
  .contract .details {
    margin: 0 auto;
    max-width: 620px;

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