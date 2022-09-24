<script>
  import MessageRow from "./MessageRow.svelte";
  import MessageInput from "./MessageInput.svelte";
  import { store } from "../lib/store.js";
  import { onMount } from "svelte";

  function checkMsg(detail) {
    console.log(detail);
  }

  function deleteMsg(message) {
    console.log(message);
  }

  function editMsg(message) {
    console.log(message);
  }

  function postMsg(message) {
    console.log(message);
  }

  onMount(() => {
    store.loadShownMessages(50);
  });
</script>

<div class="filler-container">
  {#each $store.shownMessages as message (message.id)}
    <MessageRow
      {message}
      on:check-msg={(e) => checkMsg(e.detail)}
      on:edit-msg={(e) => editMsg(e.detail)}
      on:delete-msg={(e) => deleteMsg(e.detail)}
    />
  {/each}
  <div id="message-container-end" style="height: 1px; margin-top: -1px" />
</div>

<MessageInput on:post-msg={(e) => postMsg(e.detail)} />
