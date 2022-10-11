<script>
  import MessageRow from "./MessageRow.svelte";
  import MessageInput from "./MessageInput.svelte";
  import { store } from "../lib/store.js";
  import { onMount, tick } from "svelte";
  import { nanoid } from "nanoid";
  import ChatFilter from "./ChatFilter.svelte";

  const DEFAULT_SHOWN_MESSAGES_COUNT = 100;
  let shownMessagesCount = DEFAULT_SHOWN_MESSAGES_COUNT;
  let shownMessages = [];

  let messageBeingEdited = null;
  let editMessageChild;

  let filter = { hideChecked: true, search: "", tagId: undefined };

  async function checkMsg(detail) {
    await store.sendEvent({
      id: nanoid(12),
      itemId: detail.message.id,
      emittedAt: Date.now(),
      type: detail.checked ? "checkMsg" : "uncheckMsg",
    });
  }

  async function deleteMsg(message) {
    await store.sendEvent({
      id: nanoid(12),
      itemId: message.id,
      emittedAt: Date.now(),
      type: "deleteMsg",
    });
  }

  async function editMsg(message) {
    messageBeingEdited = message;
    editMessageChild(message.data.text);
  }

  async function postMsg(msgData) {
    if (messageBeingEdited) {
      await store.sendEvent({
        id: nanoid(12),
        itemId: messageBeingEdited.id,
        emittedAt: Date.now(),
        type: "editMsg",
        data: JSON.stringify(msgData),
      });
      messageBeingEdited = null;
    } else {
      await store.sendEvent({
        id: nanoid(12),
        itemId: nanoid(10),
        emittedAt: Date.now(),
        type: "postMsg",
        data: JSON.stringify(msgData),
      });
    }
  }

  async function loadMessages(scrollToBottom = false) {
    shownMessages = await store.getLastMessages(shownMessagesCount, filter);
    if (scrollToBottom) {
      await scrollToLastMessage();
    }
  }

  async function scrollToLastMessage() {
    await tick();
    const el = document.getElementById("message-container-end");
    if (el) el.scrollIntoView();
  }

  onMount(() => {
    loadMessages(true);
  });
</script>

<svelte:window
  on:messages-updated={(e) => loadMessages(e.detail.containsNewMsg)}
/>

<ChatFilter bind:filter on:update={() => loadMessages()} />

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

<MessageInput
  {messageBeingEdited}
  bind:editMessage={editMessageChild}
  on:post-msg={(e) => postMsg(e.detail)}
/>
