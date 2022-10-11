<script>
  import { pasteAsPlainText, insertLineBreak } from "../lib/utils.js";
  import { store } from "../lib/store.js";
  import { nanoid } from "nanoid";

  export let openTab;
  let lastEdit;
  let debounceTimer;
  let inputEl;

  function editNote(text) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      lastEdit = Date.now();
      await store.sendEvent({
        id: nanoid(12),
        itemId: openTab,
        emittedAt: lastEdit,
        type: "editNote",
        data: JSON.stringify({ text }),
      });
    }, 600);
  }

  async function getNote(noteId) {
    const note = await store.getNote(noteId);
    inputEl.innerHTML = note.data.text;
    lastEdit = note.lastEdit;
  }

  $: {
    getNote(openTab);
  }
</script>

<svelte:window on:note-updated={() => getNote(openTab)} />

<div class="filler-container">
  <div
    bind:this={inputEl}
    class="note"
    contenteditable="true"
    on:input={(e) => {
      editNote(e.target.innerText);
    }}
    on:paste={pasteAsPlainText}
    on:keydown={(e) => {
      if (e.key === "Enter") insertLineBreak();
    }}
  />
</div>
<div class="note-info-container">
  <div>
    <button
      class="button inline-block"
      style="margin-right: 0.3rem"
      on:click={() => document.execCommand("undo")}
    >
      ↶
    </button>
    <button
      class="button inline-block"
      on:click={() => document.execCommand("redo")}
    >
      ↷
    </button>
  </div>
  <div class="note-info">
    <div>Last edit: {new Date(lastEdit).toLocaleString()}</div>
  </div>
</div>

<style>
  .note {
    height: 100%;
    color: #e3e3e3;
    box-sizing: border-box;
    padding: 0 0.5rem 0.5rem 0.5rem;
    overflow: auto;
    white-space: pre-wrap;
    outline: none;
  }

  .note-info-container {
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
    background: #2c2c2c;
    padding: 0.5rem;
  }

  .note-info {
    font-size: 0.7rem;
    color: #e3e3e3;
  }
</style>
