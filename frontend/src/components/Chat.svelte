<script>
  import MessageRow from "./MessageRow.svelte";
  import MessageInput from "./MessageInput.svelte";

  const displayerMessages = [
    {
      id: 38,
      text: "jhgdf",
      sentAt: 723894,
      checked: false,
      tag: { id: 2, name: "Read", color: "#713f12" },
    },
    {
      id: 28,
      text: "jhgdfmn sjh wih ihb wbiewb iwbf iebw ibe ihb ei beifbf",
      sentAt: 723894,
      checked: true,
      tag: { id: 5, name: "Buy", color: "#14532d" },
    },
    {
      id: 283,
      text: "jhgdfmn sjh wih ihb wbiewb iwbf iebw ibe ihb ei beifbf",
      sentAt: 723894,
      checked: true,
    },
    {
      id: 284,
      text: "jhgdfmn sjh wih ihb wbiewb iwbf iebw ibe ihb ei beifbf",
      sentAt: 723894,
      checked: false,
    },
  ];

  function checkMsg(detail) {
    console.log(detail);
  }

  function deleteMsg(message) {
    console.log(message);
  }

  function editMsg(message) {
    console.log(message);
  }

  function postMsg(message) {
    console.log(message);
  }
</script>

<div class="filler-container">
  {#each displayerMessages as message (message.id)}
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
