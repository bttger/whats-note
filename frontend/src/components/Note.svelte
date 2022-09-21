<script>
  import { pasteAsPlainText, insertLineBreak } from "../lib/utils.js";

  export let openTab;
  let note = {};

  function editNote(text) {
    console.log(text);
  }
</script>

<div class="filler-container">
  <div
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
    <div
      class="button inline-block"
      style="margin-right: 0.3rem"
      on:click={() => document.execCommand("undo")}
    >
      ↶
    </div>
    <div
      class="button inline-block"
      on:click={() => document.execCommand("redo")}
    >
      ↷
    </div>
  </div>
  <div class="note-info">
    <div>Last edit: {new Date(note.lastEdit).toLocaleString()}</div>
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
