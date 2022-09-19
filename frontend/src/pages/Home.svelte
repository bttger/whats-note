<script>
  import Tabs from "../components/Tabs.svelte";
  import Note from "../components/Note.svelte";
  import Chat from "../components/Chat.svelte";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  export let openTab = 0;
</script>

<div class="full-height-container">
  <Tabs bind:openTab on:change-tab={(e) => (openTab = e.detail)}>
    <div class="button block" on:click={() => dispatch("open-page", 1)}>⚙</div>
  </Tabs>

  {#if openTab === 0}
    <Chat />
  {:else}
    <Note {openTab} />
  {/if}
</div>

<style>
  .full-height-container {
    display: flex;
    flex-flow: column;
    height: 100vh;
  }
</style>
