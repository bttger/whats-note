<script>
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();
</script>

<div class="full-height-container">
  <div class="button block" on:click={() => dispatch("open-page", 0)}>
    &lt;- Go back
  </div>
  <h1>Settings</h1>
  <p>Message Tags</p>
  <p>Number of Scratchpads</p>
  <hr />
  <div class="button block" style="margin-bottom: 0.5rem">Log out</div>
  <div class="button block">Delete account and data</div>
</div>

<style>
  .full-height-container {
    margin: 0.5rem;
  }

  @media (min-width: 700px) {
    .full-height-container {
      margin: 0.5rem auto 0.5rem auto;
      width: 50%;
    }
  }
</style>
