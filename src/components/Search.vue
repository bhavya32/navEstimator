<template>
    <div class="search-component">
      <input
        v-model="query"
        @input="fetchResults"
        placeholder="Select Fund"
        @focus="dropdownVisible = true"
        @blur="hideDropdown"
        spellcheck="false"
        autocomplete="false"
        ref="refInput"
      />
      <ul v-if="dropdownVisible && results.length" class="dropdown">
        <li v-for="result in results" :key="result.id" @mousedown.prevent="selectResult(result)">
          {{ result.title }}
        </li>
      </ul>
    </div>
  </template>
  
  <script>
  export default {
    computed: {
        br() {
            return (this.dropdownVisible && this.results.length)? "20px 20px 0px 0px" : "20px"
        }
    },
    data() {
      return {
        query: '', 
        results: [],
        dropdownVisible: false, 
        
      };
    },
    methods: {
      async fetchResults() {
        if (this.query.length < 3) {
          this.results = [];
          return;
        }
  
        try {
          let base_url = "https://navEstimator.bhavyasoftwares.com"
          const response = await fetch(`${base_url}/search?name=${this.query}`);
          if (response.ok) {
            this.results = (await response.json())["data"]["content"];
          } else {
            console.error('Failed to fetch results');
          }
        } catch (error) {
          console.error('Error:', error);
        }
      },
      hideDropdown() {
        setTimeout(() => {
          this.dropdownVisible = false;
        }, 200);
      },
      selectResult(result) {
        this.query = result.title;
        this.dropdownVisible = false;
        this.$emit('result-selected', result); 
        this.$refs.refInput.blur()
      }
    }
  };
  </script>
  
  <style>
  .search-component {
    position: relative;
    width: 80%;
  }
  
  input {
    width: 100%;
    
    box-sizing: border-box;
    border-bottom: none;
    border-radius: v-bind(br);
    border: 1px solid #ccc;
    padding: .375rem 1.15rem;
    outline: none;
    background-color: var(--color-container);
    color: var(--bs-body-color);

  }
  
  .dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    width: 100%;
    background: var(--color-container);
    border: 1px solid #ccc;
    margin:0;
    padding: 0px 10px;
    max-height: 204px;
    overflow: hidden;
    z-index: 1000;
    list-style-type: none; 
    border-radius: 0px 0px 10px 10px;
    
  }
  
  .dropdown li {
    padding: 8px;
    margin:0px;
    cursor: pointer;
    border-bottom: 1px solid #00000033;
  }
  
  
  </style>
  