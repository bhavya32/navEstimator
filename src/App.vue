<script setup>
import { ref } from "vue";

import Search from "./components/Search.vue"
var darkMode = ref(false)
var showOverlay = ref(false)
var holdDetails = ref([])
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
  darkMode.value = true
  document.body.classList.add("dark-mode")
}
async function getStockPrices(holdings) {
  
  mfDetails.value.newNav = `Fetching % change of ${holdings.length} stocks`
  let r = await(await fetch("http://localhost:3000/stockPrices", {
  headers: {
    "content-type": "application/json",
  },
  body: JSON.stringify(holdings),
  method: "POST",
  })).json()
  
  mfDetails.value.newNav = `Fetched Data. Calculating...`
  return r
}

async function calculateNav(holdings, changes) {
  console.log(holdings)
  console.log(changes)
  let tc = 0
  let eq = 0
  let xt = []
  for (var stock of holdings) {
    //total += holdings[i].weight * changes[i].change
    let change = changes[stock.stock_search_id]
    if (!change) {console.log(stock); continue }
    xt.push([stock.company_name, change.toFixed(2)])
    tc += 0.01*stock["corpus_per"]*change
    eq += stock["corpus_per"]
  }
  holdDetails.value = xt.sort((a,b) => b[1]-a[1])
  console.log(tc, eq)
  return [tc, eq]
}

async function getMFdetails(mf) {
  mfDetails.value.nav = "Fetching Data..."
  
  let url = "http://localhost:3000/mfHoldings?name=" + mf.search_id
  let x = await (await fetch(url)).json()
  mfDetails.value.nav = `₹${x.nav} as of ${x.nav_date}`
  //check if nav is of today
  if (new Date(x.nav_date).toDateString()  == new Date().toDateString()) {
    mfDetails.value.newNav = "Today's NAV already out"
    return
  }
  let holdings = []
  for (let i of x.holdings) {
    if (!i.stock_search_id) { continue}
    holdings.push(i.stock_search_id)
  }
  let changes = await getStockPrices(holdings)
  if ("lastTradeTime" in changes) {
    let ltr = new Date(changes.lastTradeTime)
    let now = new Date()
    if (ltr.toDateString() == now.toDateString()) {
      mfDetails.value.newNav = "Today's stock prices not out"
      return
    }
    //remove lastTradeTime
    delete changes.lastTradeTime
  }
  let [tc, eq] = await calculateNav(x.holdings, changes)
  let newNav = (1+(tc*0.01))*x.nav
  mfDetails.value.newNav = `~ ₹${newNav.toFixed(3)}`
  let ec = (tc > 0 ? "+" : "") + `${tc.toFixed(2)}%` + " considering " + eq.toFixed(2) + "% of the portfolio"
  mfDetails.value.expectedChange = ec
}

var mfDetails  = ref({
  nav:"-",
  expectedChange: "-",
  newNav:"-",
})
async function changeMode() {
  darkMode.value = !darkMode.value
  document.body.classList.toggle("dark-mode", darkMode.value)
}

</script>

<template>
  
    <div id="container">
      <div><h1 class="title">navEstimator</h1></div>
      <Search @result-selected="getMFdetails"/>
      <div class="details">
        <h2 style="text-align: center;">Fund Details</h2>
        <table class="table table-bordered  ">
          <tr><td>Last Nav</td><td>{{ mfDetails.nav }}</td></tr>
          <tr><td>Estimated Nav</td><td>{{ mfDetails.newNav }}</td></tr>
          <tr><td>% Change</td><td>{{ mfDetails.expectedChange }} <button v-show="holdDetails.length > 0" class="infoBtn" @click="showOverlay = true;">i</button></td></tr>
        </table>
        
      </div>
      <div id="footer">
      <a href="https://github.com/bhavya32/navEstimator" target="_blank">
        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" class="bi bi-github" viewBox="0 0 16 16">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8"/>
        </svg>
      </a><button @click="changeMode()">
        <svg v-if="!darkMode" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M144.7 98.7c-21 34.1-33.1 74.3-33.1 117.3c0 98 62.8 181.4 150.4 211.7c-12.4 2.8-25.3 4.3-38.6 4.3C126.6 432 48 353.3 48 256c0-68.9 39.4-128.4 96.8-157.3zm62.1-66C91.1 41.2 0 137.9 0 256C0 379.7 100 480 223.5 480c47.8 0 92-15 128.4-40.6c1.9-1.3 3.7-2.7 5.5-4c4.8-3.6 9.4-7.4 13.9-11.4c2.7-2.4 5.3-4.8 7.9-7.3c5-4.9 6.3-12.5 3.1-18.7s-10.1-9.7-17-8.5c-3.7 .6-7.4 1.2-11.1 1.6c-5 .5-10.1 .9-15.3 1c-1.2 0-2.5 0-3.7 0l-.3 0c-96.8-.2-175.2-78.9-175.2-176c0-54.8 24.9-103.7 64.1-136c1-.9 2.1-1.7 3.2-2.6c4-3.2 8.2-6.2 12.5-9c3.1-2 6.3-4 9.6-5.8c6.1-3.5 9.2-10.5 7.7-17.3s-7.3-11.9-14.3-12.5c-3.6-.3-7.1-.5-10.7-.6c-2.7-.1-5.5-.1-8.2-.1c-3.3 0-6.5 .1-9.8 .2c-2.3 .1-4.6 .2-6.9 .4z"/></svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M375.7 19.7c-1.5-8-6.9-14.7-14.4-17.8s-16.1-2.2-22.8 2.4L256 61.1 173.5 4.2c-6.7-4.6-15.3-5.5-22.8-2.4s-12.9 9.8-14.4 17.8l-18.1 98.5L19.7 136.3c-8 1.5-14.7 6.9-17.8 14.4s-2.2 16.1 2.4 22.8L61.1 256 4.2 338.5c-4.6 6.7-5.5 15.3-2.4 22.8s9.8 13 17.8 14.4l98.5 18.1 18.1 98.5c1.5 8 6.9 14.7 14.4 17.8s16.1 2.2 22.8-2.4L256 450.9l82.5 56.9c6.7 4.6 15.3 5.5 22.8 2.4s12.9-9.8 14.4-17.8l18.1-98.5 98.5-18.1c8-1.5 14.7-6.9 17.8-14.4s2.2-16.1-2.4-22.8L450.9 256l56.9-82.5c4.6-6.7 5.5-15.3 2.4-22.8s-9.8-12.9-17.8-14.4l-98.5-18.1L375.7 19.7zM269.6 110l65.6-45.2 14.4 78.3c1.8 9.8 9.5 17.5 19.3 19.3l78.3 14.4L402 242.4c-5.7 8.2-5.7 19 0 27.2l45.2 65.6-78.3 14.4c-9.8 1.8-17.5 9.5-19.3 19.3l-14.4 78.3L269.6 402c-8.2-5.7-19-5.7-27.2 0l-65.6 45.2-14.4-78.3c-1.8-9.8-9.5-17.5-19.3-19.3L64.8 335.2 110 269.6c5.7-8.2 5.7-19 0-27.2L64.8 176.8l78.3-14.4c9.8-1.8 17.5-9.5 19.3-19.3l14.4-78.3L242.4 110c8.2 5.7 19 5.7 27.2 0zM256 368a112 112 0 1 0 0-224 112 112 0 1 0 0 224zM192 256a64 64 0 1 1 128 0 64 64 0 1 1 -128 0z"/></svg>
      </button>
      
      </div>
    </div>
    <div class="overlay" v-show="showOverlay">
          <div class="overlay-content">
            <svg @click="showOverlay = false" style="position: absolute; top: 40px; right: 40px;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-lg" viewBox="0 0 16 16">
              <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z"/>
            </svg>
            <h2 class="mb-2">Holdings</h2>
            <div style="overflow-y: scroll; max-height: 80%; margin-top: 10px;  padding-right: 20px">
            <table style="width:100%;">
              <tr>
                <th>Stock</th>
                <th>% Change</th>
              </tr>
              <tr v-for="stock in holdDetails">
                <td>{{ stock[0] }}</td>
                <td :class="`${stock[1] > 0?'green':'red'}`">{{ stock[1] }} %</td>
              </tr>

            </table>
          </div>
          </div>
        </div>
</template>

<style scoped>
svg {
  fill: var(--bs-body-color);
}
.infoBtn {
  font-family: cursive;
  font-style: italic;
  font-weight: 900;
  border-radius: 50%;
  padding:0px;
  background-color: transparent;
  border: 1px solid;
  min-width: 23px;
  color: var(--bs-body-color)
}
.green {
  color: #00b386;
}
.red {
  color: #eb5b3c;
}
#footer {
  margin-left:10px;
  display:flex;
  flex-direction: row;
  justify-content: space-around;
  width:20%;
  margin-top: 20px;
  button {
    background-color: transparent;
    border: none;
    cursor: pointer;
    svg {
      width: 20px;
    }
  }
}
.details {
  margin-top:50px;
  width:60%;
  h2 {
    margin-bottom: 20px;
  }
}
#body {
  width: 100%;
  height:100%;
  background-color: rgb(225, 224, 224)
}
#container {
  width: 90%;
  height: 80%;
  background-color: var(--color-container);
  border-radius: 30px;
  
  font-family: 'Neo Sans Pro', sans-serif;
  padding: 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center
}



.title {
  text-align: center
}
.table {
  padding:20px;
  
  td {
    padding:10px 20px;
    text-align: right;
  }
  td:first-child {
    text-align: left;
  }
  
}


.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.overlay-content {
  background-color: var(--color-container);
  width:100%;
  height:100%;
  padding: 40px;
  border-radius: 10px;
  max-width: 70%;
  max-height: 70%;
  position: relative;
  
  table {
    text-align: right;
    td:first-child, th:first-child {
      text-align: left;
    }
  }
}

</style>
