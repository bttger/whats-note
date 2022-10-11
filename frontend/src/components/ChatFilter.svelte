<script>
  import { createEventDispatcher, onMount } from "svelte";
  import { store } from "../lib/store.js";

  const dispatch = createEventDispatcher();

  export let filter;
  let tags = [];

  onMount(() => {
    tags = [
      { id: "undefined", name: "U", color: "#2c2c2c" },
      ...store.getTags(),
    ];
  });

  function clickTag(tagId) {
    if (filter.tagId === tagId) {
      filter.tagId = undefined;
    } else {
      filter.tagId = tagId;
    }
  }

  function emitUpdate() {
    dispatch("update");
  }
</script>

<div class="container">
  <label>
    <input
      aria-label="hide checked messages"
      type="checkbox"
      bind:checked={filter.hideChecked}
      on:input={emitUpdate}
    />
    Hide Checked
  </label>

  <input
    aria-label="filter for messages with the search input"
    type="search"
    placeholder="Search..."
    bind:value={filter.search}
    on:input={emitUpdate}
  />
</div>

<div class="container" style="justify-content: flex-end;">
  {#each tags as tag, index (tag.id)}
    <button
      class="button tag-button"
      style="background-color: {tag.color}; filter: brightness({filter.tagId
        ? filter.tagId === tag.id
          ? 1
          : 0.3
        : 1})"
      on:click={() => {
        clickTag(tag.id);
        emitUpdate();
      }}
    >
      {tag.name}
    </button>
  {/each}
</div>

<style>
  .container {
    display: flex;
    gap: 0.5rem;
    margin: 0 0.5rem 0.5rem 0.5rem;
  }

  label {
    white-space: nowrap;
    font-size: 0.9rem;
    flex: 0 1 auto;
  }

  input[type="search"] {
    color: #1a1a1a;
    background: white;
    border-radius: 0;
    box-shadow: inset -1px -1px #fff, inset 1px 1px grey,
      inset -2px -2px #dfdfdf, inset 2px 2px #434343;
    flex: 1 1 0;
    width: 10px;
  }
</style>
