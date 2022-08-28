<script>
  import Home from "./pages/Home.svelte";
  import Settings from "./pages/Settings.svelte";
  import Login from "./pages/Login.svelte";
  import Register from "./pages/Register.svelte";

  let openPage = 0;

  // TODO on startup run the sync function and check if logged in
</script>

<main>
  {#if openPage === 0}
    <Home />
  {:else if openPage === 1}
    <Settings />
  {:else if openPage === 2}
    <Login />
  {:else if openPage === 3}
    <Register />
  {/if}
</main>
