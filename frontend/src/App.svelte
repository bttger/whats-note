<script>
  import Home from "./pages/Home.svelte";
  import Settings from "./pages/Settings.svelte";
  import Login from "./pages/Login.svelte";

  let openPage = 2;

  function sync() {
    // TODO on startup run the sync function and check if logged in
  }
</script>

<main>
  {#if openPage === 0}
    <Home on:open-page={(e) => (openPage = e.detail)} />
  {:else if openPage === 1}
    <Settings on:open-page={(e) => (openPage = e.detail)} />
  {:else if openPage === 2}
    <Login
      on:open-page={(e) => (openPage = e.detail)}
      on:refresh={() => {
        openPage = 0;
        sync();
      }}
    />
  {/if}
</main>
