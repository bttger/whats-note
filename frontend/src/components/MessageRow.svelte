<script>
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  export let message;

  function checkOffMsg(event) {
    dispatch("check-off-msg", { message, checked: event.target.checked });
  }
</script>

<div class="message-row">
  <input
    :id="'msg-checkbox-' + message.id"
    aria-label="Check off the message"
    type="checkbox"
    checked={message.checked}
    on:change={(e) => checkOffMsg(e)}
  />
  <div class="message" class:checked={message.checked}>
    <div>
      {message.text}
    </div>
    <span class="message-info">
      {new Date(message.sentAt).toLocaleString() +
        (message.unsynced ? " ▴" : " ✓")}
    </span>
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
  }

  .message-info {
    color: #ababab;
    font-size: 0.7rem;
    align-self: end;
  }

  .checked {
    background: #1a1a1a;
    color: #ababab;
  }

  input[type="checkbox"] {
    padding: 0;
    margin: 0;
    cursor: pointer;
  }
</style>
