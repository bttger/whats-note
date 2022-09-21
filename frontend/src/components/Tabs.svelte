<script>
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  export let tabs = [0, 1, 2, 3, 4]; // TODO outsource to custom store derived from LS for settings change
  export let openTab;
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
