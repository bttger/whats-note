<script>
  import { createEventDispatcher } from "svelte";
  import { computePosition, flip } from "@floating-ui/dom";

  const dispatch = createEventDispatcher();

  export let message;
  let links = message.data.text.match(/https?:\/\/\S+/g) || [];
  let messageEl;
  let actionsEl;

  function checkOffMsg(event) {
    dispatch("check-msg", { message, checked: event.target.checked });
  }

  function showMessageActions() {
    actionsEl.style.display = "flex";
    computePosition(messageEl, actionsEl, {
      placement: "top",
      middleware: [flip()],
    }).then(({ x, y }) => {
      Object.assign(actionsEl.style, {
        left: `${x}px`,
        top: `${y}px`,
      });
    });
  }

  function hideMessageActions() {
    actionsEl.style.display = "";
  }
</script>

<div class="message-row">
  <input
    :id="'msg-checkbox-' + message.id"
    aria-label="Check off the message"
    type="checkbox"
    checked={message.data.checked}
    on:change={(e) => checkOffMsg(e)}
  />
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
    on:click={() =>
      actionsEl.style.display === "flex"
        ? hideMessageActions()
        : showMessageActions()}
  >
    <div>
      {#each links as link}
        <a href={link} target="_blank" class="block">{link}</a>
      {/each}{message.data.text}
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
        hideMessageActions();
        dispatch("edit-msg", message);
      }}
    >
      Edit
    </button>
    <button
      class="button"
      on:click={() => {
        hideMessageActions();
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
    margin: 0 0.5rem 0.5rem 0.5rem;
    gap: 1rem;
    justify-content: space-between;
  }

  .message {
    background: #2c2c2c;
    color: #e3e3e3;
    padding: 0.2rem 0.4rem 0.2rem 0.4rem;
    border-radius: 0.2rem;
    white-space: pre-wrap;
    display: flex;
    flex-direction: column;
    font-size: 0.9rem;
  }

  .message-info {
    color: #ababab;
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
  }
</style>
