<template>
  <div>
    <p v-if="isWaiting">Waiting for wallet connection ...</p>
    <div v-if="namesOwned.length > 0">
      <div class="wrap-names-container">
        <table class="custom-table">
          <thead>
            <tr>
              <th>
                <input type="checkbox" v-model="selectAll" @change="toggleSelectAll" />
              </th>
              <th>Name</th>
              <th>Expiration Height</th>
              <th>Expiration Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in namesOwned" :key="item.name">
              <td>
                <input
                  type="checkbox"
                  v-model="selectedNames"
                  :value="item.name"
                  :checked="isSelected(item.name)" />
              </td>
              <td>{{ item.name }}</td>
              <td>{{ item.info.expire_height }}</td>
              <td>{{ new Date(item.info.approximate_expire_time).toLocaleString() }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div>
        <span>
          <strong>NFT ID: </strong>
          <input v-model="nftId" placeholder="nftId" />
        </span>
        <button @click="wrapAndMint()">
          wrap_and_mint
        </button>
        <button @click="wrapSingle()">
          wrap_single
        </button>
        <button @click="wrapMultiple()">
          wrap_multiple
        </button>
      </div>
    </div>
    <div v-else-if="!isWaiting">
      You don't own an AENS name. Please claim a name first.
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
  import { ref, watch } from 'vue'
  import { state } from '../utils/aeternity/aeternity'

  let nftId = ref()

  let selectAll = ref()
  let selectedNames = ref([])
  let namesOwned = ref([])
  let isWaiting = ref(true)
  let txExecuting = ref(false)
  let txHash = ref()

  const toggleSelectAll = () => {
    if (selectAll.value) {
      selectedNames.value = namesOwned.value.map((item) => item.name);
    } else {
      selectedNames.value = [];
    }
  }

  const isSelected = (itemName) => {
    return selectedNames.value.includes(itemName);
  }

  watch(selectedNames, () => {
    console.log(selectedNames.value)
  });

  const wrapAndMint = async () => {
    if(selectedNames.value.length == 0) {
      alert("no name selected")
      return
    }
    txExecuting.value = true
    const delegationSignatureMap = new Map()
    console.log(selectedNames.value)
    for(let i=0; i < selectedNames.value.length; i++) {
      const delegationSig = await state.aeSdk.createDelegationSignature(state.contractId, [selectedNames.value[i]])
      delegationSignatureMap.set(selectedNames.value[i], delegationSig)
    }
    try {
      const tx = await state.contract.wrap_and_mint(delegationSignatureMap)
      txHash.value = tx.hash
      console.log(tx)
    } catch(e) {
      alert(e)
    }
    txExecuting.value = false
  }

  const wrapSingle = async () => {
    if(selectedNames.value.length !== 1) {
      alert("select exactly one name!")
      return
    }
    if(!nftId.value || isNaN(nftId.value)) {
      alert("valid nftId must be provided")
      return
    }
    txExecuting.value = true
    const name = selectedNames.value[0]
    const delegationSig = await state.aeSdk.createDelegationSignature(state.contractId, [name])
    try {
      const tx = await state.contract.wrap_single(nftId.value, name, delegationSig)
      txHash.value = tx.hash
      console.log(tx)
    } catch(e) {
      alert(e)
    }
    txExecuting.value = false
  }

  const wrapMultiple = async () => {
    if(selectedNames.value.length < 2) {
      alert("select more than one name!")
      return
    }
    if(!nftId.value || isNaN(nftId.value)) {
      alert("valid nftId must be provided")
      return
    }
    txExecuting.value = true
    const delegationSignatureMap = new Map()
    console.log(selectedNames.value)
    for(let i=0; i < selectedNames.value.length; i++) {
      const delegationSig = await state.aeSdk.createDelegationSignature(state.contractId, [selectedNames.value[i]])
      delegationSignatureMap.set(selectedNames.value[i], delegationSig)
    }
    console.log(delegationSignatureMap)
    try {
      const tx = await state.contract.wrap_multiple(nftId.value, delegationSignatureMap)
      txHash.value = tx.hash
      console.log(tx)
    } catch(e) {
      alert(e)
    }
    txExecuting.value = false
  }

  const loadNamesOwned = async () => {
    while(isWaiting.value) {
      if(state.status === 'connected') {
        let path = `v2/names?owned_by=${state.aeSdk.address}&direction=forward&state=active&limit=100`
        while(path) {
          const response = await fetch(`${state.nodeUrl}/mdw/${path}`)
          const json = (await response.json())
          namesOwned.value = namesOwned.value.concat(json.data)
          path = json.next
        }
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

  loadNamesOwned()
</script>

<style scoped>
.wrap-names-container {
  display: flex;
  justify-content: center;
  border: 2px solid #de3f6b;
  border-radius: 15px;
  padding: 10px;
}

.custom-table {
  border-collapse: collapse;
  width: 100%;
}

.custom-table th,
.custom-table td {
  border: 1px solid #ccc;
  padding: 8px;
  text-align: center;
}

.custom-table th {
  background-color: #f2f2f2;
}

.custom-table tr:hover {
  background-color: #f5f5f5;
}

.custom-table input[type="checkbox"] {
  margin-right: 5px;
}
.custom-table th:nth-child(1),
.custom-table td:nth-child(1) {
  width: 20px; /* Adjust as needed */
}

.custom-table th:nth-child(2),
.custom-table td:nth-child(2) {
  width: 200px; /* Adjust as needed */
}

.custom-table th:nth-child(3),
.custom-table td:nth-child(3) {
  width: 100px; /* Adjust as needed */
}

.custom-table th:nth-child(4),
.custom-table td:nth-child(4) {
  width: 120px; /* Adjust as needed */
}
</style>