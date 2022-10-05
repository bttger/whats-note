<script>
  import MessageRow from "./MessageRow.svelte";
  import MessageInput from "./MessageInput.svelte";
  import { store } from "../lib/store.js";
  import { onMount, tick } from "svelte";
  import { nanoid } from "nanoid";

  async function checkMsg(detail) {
    console.log(detail);
  }

  async function deleteMsg(message) {
    console.log(message);
  }

  async function editMsg(message) {
    console.log(message);
  }

  async function postMsg(message) {
    console.log(message);
    await store.sendEvent({
      id: nanoid(12),
      itemId: nanoid(10),
      emittedAt: Date.now(),
      type: "postMsg",
      data: JSON.stringify(message),
    });
    await tick();
    document.getElementById("message-container-end").scrollIntoView();
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
