<script>
  import { createEventDispatcher } from "svelte";
  import { computePosition, flip } from "@floating-ui/dom";

  const dispatch = createEventDispatcher();

  export let message;
  export let isLast;
  let messageEl;
  let actionsEl;

  function checkOffMsg(event) {
    dispatch("check-msg", { message, checked: event.target.checked });
  }

  async function showMessageActions() {
    actionsEl.style.display = "flex";
    computePosition(messageEl, actionsEl, {
      placement: "bottom",
      middleware: [flip()],
    }).then(({ x, y }) => {
      Object.assign(actionsEl.style, {
        left: `${x}px`,
        top: `${y}px`,
      });
    });

    await new Promise((r) => setTimeout(r, 50));
    window.addEventListener("click", hideMessageActions);
  }

  function hideMessageActions() {
    actionsEl.style.display = "";
    window.removeEventListener("click", hideMessageActions);
  }
</script>

<div class="message-row" style="margin-bottom: {isLast ? '0' : '0.5rem'};">
  <input
    aria-label="Check off the message"
    type="checkbox"
    checked={message.data.checked}
    on:change={(e) => checkOffMsg(e)}
  />
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div
    bind:this={messageEl}
    class="message"
    style={message.data.tag
      ? message.data.checked
        ? "filter: brightness(0.5); background-color: " +
          message.data.tag.color +
          ";"
        : "background-color: " + message.data.tag.color + ";"
      : message.data.checked
      ? "filter: brightness(0.5);"
      : ""}
    on:click={showMessageActions}
  >
    <div class="break-content">
      {@html message.data.text}
    </div>
    <span class="message-info">
      {new Date(message.sentAt).toLocaleString() +
        (message.unsynced ? " ▴" : " ✓")}
    </span>
  </div>
  <div
    bind:this={actionsEl}
    class="message-actions"
    style={message.data.tag
      ? "background-color: " + message.data.tag.color
      : "background-color: #2c2c2c"}
  >
    <button
      class="button"
      on:click={() => {
        dispatch("edit-msg", message);
      }}
    >
      Edit
    </button>
    <button
      class="button"
      on:click={() => {
        dispatch("delete-msg", message);
      }}
    >
      Delete
    </button>
  </div>
</div>

<style>
  .message-row {
    display: flex;
    margin-left: 0.5rem;
    margin-right: 0.5rem;
    gap: 1rem;
    justify-content: space-between;
  }

  .message {
    background: #2c2c2c;
    padding: 0.2rem 0.4rem 0.2rem 0.4rem;
    border-radius: 0.2rem;
    display: flex;
    flex-direction: column;
    font-size: 0.9rem;
  }

  .break-content {
    white-space: pre-wrap;
    word-break: break-word;
  }

  .message-info {
    color: #a2a2a2;
    font-size: 0.7rem;
    align-self: end;
  }

  .message-actions {
    position: absolute;
    display: none;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.5rem;
    z-index: 50;
    box-shadow: 0 20px 20px -5px rgb(0 0 0 / 0.35);
    border-radius: 0.2rem;
  }
</style>
