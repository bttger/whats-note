<script>
  import { createEventDispatcher } from "svelte";
  import { store } from "../lib/store.js";
  import InfoIcon from "../components/InfoIcon.svelte";

  const dispatch = createEventDispatcher();

  async function logout() {
    try {
      await fetch("/api/logout");
      await store.deleteClientData();
      location.reload();
    } catch (error) {
      console.error(error);
    }
  }

  let askForConfirmation = false;

  async function deleteAccount() {
    try {
      await fetch("/api/delete-account");
      await store.deleteClientData();
      location.reload();
    } catch (error) {
      console.error(error);
    }
  }
</script>

<div class="full-height-container">
  <button class="button block" on:click={() => dispatch("open-page", 0)}>
    &lt;- Go back
  </button>
  <h1>Settings</h1>
  <p class="info">
    <InfoIcon /> Do you have ideas on how to improve WhatsNote? Head over to the
    <a
      href="https://github.com/bttger/whats-note"
      target="_blank"
      rel="noopener noreferrer">GitHub repository</a
    > and create an issue.
  </p>
  <p>Message Tags</p>
  <p class="info-text">
    The tag and tab customization is an open feature. Head over to the <a
      href="https://github.com/bttger/whats-note"
      target="_blank"
      rel="noopener noreferrer">GitHub repository</a
    > and help implementing it.
  </p>
  <!-- Keep in mind that filtering works by the tag ID. If you change the title
  of a tag, the chat window will still show you older messages with the old tag
  name when you filter for the new tag name. -->
  <p>Number of Scratchpads</p>
  <hr />
  <button class="button block" style="margin-bottom: 0.5rem" on:click={logout}>
    Log out
  </button>
  <button class="button block" on:click={() => (askForConfirmation = true)}>
    Delete account and data
  </button>
  {#if askForConfirmation}
    <p class="info">
      <InfoIcon /> Are you sure you want to delete your account and all related data?
      The deletion can not be undone.
    </p>
    <button class="button block" on:click={deleteAccount}>
      I am sure, delete account
    </button>
  {/if}
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

  .info {
    border-radius: 0.5rem;
    background-color: rgb(50, 50, 50);
    padding: 0.5rem;
  }

  button {
    font-size: 1rem;
    width: 100%;
  }

  .info-text {
    color: rgb(147, 147, 147);
  }
</style>
