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
    <!-- Settings tab -->
    <button
      class="button"
      style="flex: 1 1 0"
      on:click={() => dispatch("open-page", 1)}>⚙</button
    >
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
