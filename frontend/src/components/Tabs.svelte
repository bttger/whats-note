<script>
  import { createEventDispatcher, onMount } from "svelte";
  import { store } from "../lib/store.js";

  const dispatch = createEventDispatcher();

  export let openTab;
  let tabs = [];

  onMount(() => {
    tabs = store.getTabs();
  });
</script>

<div class="tabs">
  {#each tabs as tab}
    <div
      class="button tab"
      class:focused={openTab === tab}
      on:click={() => dispatch("change-tab", tab)}
    >
      {tab}
    </div>
  {/each}
  <div class="tab">
    <slot />
  </div>
</div>

<style>
  .tabs {
    display: flex;
    overflow-x: auto;
    gap: 0.5rem;
    margin: 0.5rem;
  }

  .tab {
    flex: 1 1 0;
  }

  .focused {
    background: grey;
  }
</style>
