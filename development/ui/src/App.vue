<template>
    <div id="container">
        <img alt="Aeternity" src="./assets/logo.svg" style="width: 100px" />
        <h1>AENS Wrapping into AEX-141 NFTs</h1>
        <div id="nav">
            <router-link to="/">Home</router-link> |
            <router-link to="/contract-interaction">Contract Interaction</router-link>
        </div>
    </div>

    <router-view />
</template>

<script>
import { defineComponent, onMounted } from 'vue'
import { initConnection } from './utils/aeternity/aeternity'

export default defineComponent({
  name: 'App',

  setup () {
    onMounted(async () => {
      await initConnection()
    })
  }
})
</script>

<style>
#app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
}

#container {
  padding-top: 30px;
}
#nav {
    padding: 30px;
}

#nav a {
    font-weight: bold;
    color: #2c3e50;
}

#nav a.router-link-exact-active {
    color: #de3f6b;
}
</style>
