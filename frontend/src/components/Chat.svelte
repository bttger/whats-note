<script>
  import MessageRow from "./MessageRow.svelte";
  import MessageInput from "./MessageInput.svelte";
  import { store } from "../lib/store.js";
  import { onMount, tick } from "svelte";
  import { nanoid } from "nanoid";

  const DEFAULT_SHOWN_MESSAGES_COUNT = 50;
  let shownMessagesCount = DEFAULT_SHOWN_MESSAGES_COUNT;
  let shownMessages = [];

  async function checkMsg(detail) {
    console.log(detail);
  }

  async function deleteMsg(message) {
    console.log(message);
    // Should also work if not synced yet
  }

  async function editMsg(message) {
    console.log(message);
    // Should also work if not synced yet
  }

  async function postMsg(message) {
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

  async function loadMessages() {
    shownMessages = await store.getLastMessages(shownMessagesCount);
  }

  onMount(() => {
    loadMessages();
  });
</script>

<svelte:window on:messages-updated={loadMessages} />

<div class="filler-container">
  {#each shownMessages as message (message.id)}
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
