<script>
  import { createEventDispatcher } from "svelte";
  import { pasteAsPlainText, insertLineBreak } from "../lib/utils.js";
  import { computePosition } from "@floating-ui/dom";

  const dispatch = createEventDispatcher();

  let inputEl;
  let sendButtonEl;
  let tagSelectionEl;

  const tags = [
    { id: 2394, name: "To do", color: "#923" },
    { id: 8274, name: "Read", color: "#228" },
  ];
  // Keeps track of the selected tag (or no tag if selectedTag == 0)
  let selectedTag = 0;
  // Allow sending a message without a tag only on second click on the send button
  let sendClickCounter = 0;

  function postMsg() {
    if (!inputEl.innerHTML) {
      return;
    }
    dispatch("post-msg", {
      text: inputEl.innerHTML,
      tag: tags[tags.length - selectedTag],
    });
    inputEl.innerHTML = "";
  }

  function showTagSelection() {
    tagSelectionEl.style.display = "flex";
    computePosition(sendButtonEl, tagSelectionEl, {
      placement: "top-end",
    }).then(({ x, y }) => {
      Object.assign(tagSelectionEl.style, {
        left: `${x}px`,
        top: `${y - 8}px`,
      });
    });
  }

  function hideTagSelection() {
    tagSelectionEl.style.display = "";
  }

  function checkIfSendButtonFocused(event) {
    if (
      !event.relatedTarget ||
      !event.relatedTarget.className.split(" ").includes("send-button")
    ) {
      hideTagSelection();
      resetState();
    }
  }

  function moveSendButtonFocus(event) {
    // Move through the tags with arrow keys
    if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      if (selectedTag + 1 > tags.length) {
        selectedTag = 0;
      } else {
        selectedTag++;
      }
    }
    if (
      event.key === "ArrowDown" ||
      event.key === "ArrowRight" ||
      event.key === "Tab"
    ) {
      event.preventDefault();
      if (selectedTag - 1 < 0) {
        selectedTag = tags.length;
      } else {
        selectedTag--;
      }
    }

    // Focus the actual DOM element
    if (selectedTag !== 0) {
      document
        .getElementById("msg-tag-" + tags[tags.length - selectedTag].id)
        .focus();
    } else {
      sendButtonEl.focus();
    }

    // Focus the input field when user presses escape
    if (event.key === "Escape") {
      focusInputField();
    }
  }

  function focusInputField() {
    inputEl.focus();
    resetState();
  }

  function resetState() {
    selectedTag = 0;
    sendClickCounter = 0;
  }
</script>

<div class="message-input">
  <div
    bind:this={inputEl}
    class="input-div"
    contenteditable="true"
    on:paste={(e) => pasteAsPlainText(e)}
    on:keydown={(e) => {
      if (e.key === "Enter") {
        insertLineBreak();
      }
    }}
  />

  <div
    bind:this={sendButtonEl}
    class="button send-button"
    tabindex="0"
    on:click={() => {
      if (sendClickCounter === 1) {
        postMsg();
        focusInputField();
      } else {
        sendClickCounter++;
      }
    }}
    on:keyup={(e) => {
      if (e.key === "Enter") {
        postMsg();
        focusInputField();
      }
    }}
    on:focus={showTagSelection}
    on:focusout={checkIfSendButtonFocused}
    on:keydown={moveSendButtonFocus}
  >
    <span>&gt;</span>

    <div bind:this={tagSelectionEl} class="tag-selection">
      {#each tags as tag (tag.id)}
        <div
          id="msg-tag-{tag.id}"
          class="button btn-spacing send-button"
          tabindex="0"
          on:click={() => postMsg(tag)}
        >
          {tag.name}
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .message-input {
    display: flex;
    gap: 0.5rem;
    margin: 0.5rem;
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
    position: absolute;
    top: 0;
    left: 0;
    display: none;
    flex-direction: column;
    gap: 0.5rem;
  }

  .btn-spacing {
    padding: 0 0.5rem 0 0.5rem;
  }
</style>
