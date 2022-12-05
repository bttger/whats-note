<script>
  import { createEventDispatcher, onMount } from "svelte";
  import { pasteAsPlainText, insertLineBreak } from "../lib/utils.js";
  import { store } from "../lib/store.js";

  const dispatch = createEventDispatcher();

  let inputEl;
  let sendButtonEl;
  let tagSelectionEl;

  let tags = [];
  // Keeps track of the focused tag (or no tag if focusedTag == 0)
  let focusedTag = 0;

  function showTagSelection() {
    tagSelectionEl.style.display = "flex";
  }

  function hideTagSelection() {
    tagSelectionEl.style.display = "";
    focusedTag = 0;
  }

  function checkHidingTagButtons(event) {
    if (
      !event.relatedTarget ||
      !event.relatedTarget.className.split(" ").includes("show-tag-buttons")
    ) {
      hideTagSelection();
    }
  }

  function focusInputField() {
    inputEl.focus();
    focusedTag = 0;
  }

  function moveSendButtonFocus(event) {
    // Move through the tags with arrow keys
    if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      if (focusedTag + 1 > tags.length) {
        focusedTag = 0;
      } else {
        focusedTag++;
      }
    }
    if (
      event.key === "ArrowDown" ||
      event.key === "ArrowRight" ||
      event.key === "Tab"
    ) {
      event.preventDefault(); // For the tab key
      if (focusedTag - 1 < 0) {
        focusedTag = tags.length;
      } else {
        focusedTag--;
      }
    }

    // Focus the actual DOM element
    if (focusedTag !== 0) {
      document
        .getElementById("msg-tag-" + tags[tags.length - focusedTag].id)
        .focus();
    } else {
      sendButtonEl.focus();
    }

    // Focus the input field when user presses escape
    if (event.key === "Escape") {
      focusInputField();
    }
  }

  function postMessage(event) {
    if (!inputEl.innerHTML.trim()) {
      return;
    }

    const emitEvent = (tagIndex) => {
      dispatch("post-msg", {
        text: inputEl.innerHTML.trim(),
        tag: tags[tagIndex],
        checked: false,
      });
    };

    if (event.target.attributes["data-tag-index"]) {
      emitEvent(parseInt(event.target.attributes["data-tag-index"].value));
    } else {
      emitEvent();
    }
    inputEl.innerHTML = "";
    focusInputField();
  }

  // MESSAGE EDITING
  export let messageBeingEdited;

  export const editMessage = (text) => {
    inputEl.innerHTML = text;
    focusInputField();
  };

  onMount(() => {
    tags = store.getTags();
  });
</script>

<svelte:window
  on:keydown={(e) => {
    if (!document.activeElement.classList.contains("input-div")) {
      if (e.key.length === 1 && e.key.match(/[a-z0-9öäü]/i) && !e.ctrlKey) {
        focusInputField();
      }
      if (e.code === "Space" && e.ctrlKey) {
        focusInputField();
      }
    }
  }}
/>

<div class="message-input" on:focusout={checkHidingTagButtons}>
  <div bind:this={tagSelectionEl} class="tag-selection">
    {#each tags as tag, index (tag.id)}
      <button
        id="msg-tag-{tag.id}"
        data-tag-index={index}
        class="button tag-button show-tag-buttons"
        style="background-color: {tag.color}"
        on:keydown={moveSendButtonFocus}
        on:keyup={(e) => {
          if (e.key === "Enter") {
            postMessage(e);
          }
        }}
        on:click={(e) => {
          postMessage(e);
        }}
      >
        {tag.name}
      </button>
    {/each}
  </div>
  <div class="input-row">
    <div
      bind:this={inputEl}
      class="input-div show-tag-buttons"
      contenteditable="true"
      on:paste={(e) => pasteAsPlainText(e)}
      on:keydown={(e) => {
        if (e.key === "Enter") {
          insertLineBreak();
        }
      }}
      on:focus={showTagSelection}
    />

    <button
      bind:this={sendButtonEl}
      class="button show-tag-buttons"
      on:keydown={moveSendButtonFocus}
      on:keyup={(e) => {
        if (e.key === "Enter") {
          postMessage(e);
        }
      }}
      on:click={(e) => {
        postMessage(e);
      }}
    >
      <span>
        {#if messageBeingEdited}
          ed.
        {:else}
          &gt;
        {/if}
      </span>
    </button>
  </div>
</div>

<style>
  .message-input {
    margin: 0.5rem;
  }

  .input-row {
    display: flex;
    gap: 0.5rem;
  }

  .input-div {
    color: #1a1a1a;
    flex: 1;
    max-height: 10rem;
    overflow: auto;
    background: white;
    border-radius: 0;
    box-shadow: inset -1px -1px #fff, inset 1px 1px grey,
      inset -2px -2px #dfdfdf, inset 2px 2px #434343;
    box-sizing: border-box;
    padding: 3px 4px;
    white-space: pre-wrap;
  }

  .button:focus {
    background: grey;
  }

  .tag-selection {
    display: none;
    gap: 0.5rem;
    justify-content: flex-end;
    margin-bottom: 0.5rem;
  }
</style>
