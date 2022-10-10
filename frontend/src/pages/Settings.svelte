<script>
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  async function logout() {
    try {
      await fetch("/api/logout");
      dispatch("open-page", 2);
    } catch (error) {
      console.error(error);
    }
  }
</script>

<div class="full-height-container">
  <div class="button block" on:click={() => dispatch("open-page", 0)}>
    &lt;- Go back
  </div>
  <h1>Settings</h1>
  <p>Message Tags</p>
  <!-- Keep in mind that filtering works by the tag ID. If you change the title
  of a tag, the chat window will still show you older messages with the old tag
  name when you filter for the new tag name. -->
  <p>Number of Scratchpads</p>
  <hr />
  <!-- TODO insert links to github repo and how to involve in the project or suggest improvements -->
  <div class="button block" style="margin-bottom: 0.5rem" on:click={logout}>
    Log out
  </div>
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
