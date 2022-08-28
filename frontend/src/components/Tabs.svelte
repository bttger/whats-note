<script>
  export let tabs = [0, 1, 2, 3, 4];
  export let openTabId = 0;
</script>

<div class="tabs">
  {#each tabs as tabId}
    <div class="button tab" class:focused={openTabId === tabId}>
      {tabId}
    </div>
  {/each}
</div>