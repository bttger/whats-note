<script>
  import { createEventDispatcher } from "svelte";
  import { store } from "../lib/store.js";

  const dispatch = createEventDispatcher();

  let isLoading = false;
  let email = "";
  let password = "";
  let errorMsg = "";

  async function ensureNoStaleDataInClient(email) {
    if (window.localStorage.getItem("email") !== email) {
      await store.deleteClientData();
    }
    window.localStorage.setItem("email", email);
  }

  async function loginOrRegisterFetch(login = true) {
    if (!email || !password) {
      return "Please enter an email and password";
    }

    const url = login ? "/api/login" : "/api/register";
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        redirect: "follow",
      });

      if (response.ok) {
        return "";
      } else {
        const json = await response.json();
        return json.message;
      }
    } catch (error) {
      console.error("Error:", error);
      return "Please check your internet connection";
    }
  }

  async function login() {
    if (isLoading) {
      return;
    }
    isLoading = true;
    errorMsg = await loginOrRegisterFetch();
    if (errorMsg) {
      isLoading = false;
      return;
    }
    await ensureNoStaleDataInClient(email);
    dispatch("refresh");
  }

  async function register() {
    if (isLoading) {
      return;
    }
    isLoading = true;
    errorMsg = await loginOrRegisterFetch(false);
    if (errorMsg) {
      isLoading = false;
      return;
    }
    errorMsg = await loginOrRegisterFetch();
    if (errorMsg) {
      isLoading = false;
      return;
    }
    await ensureNoStaleDataInClient(email);
    dispatch("refresh");
  }
</script>

<div>
  <h1>Login and Registration</h1>
  {#if isLoading}
    loading...
  {:else}
    <label class="block">
      Email
      <input type="text" required bind:value={email} />
    </label>
    <label class="block">
      Password
      <input
        type="password"
        required
        bind:value={password}
        on:keyup={(e) => {
          if (e.key === "Enter") login();
        }}
      />
    </label>
    <p class="error-msg">{errorMsg}</p>
  {/if}

  <button class="button" on:click={login}>Log In</button>

  <p>
    You don't have an account yet? Fill out the above form and click the below
    button.
  </p>
  <button class="button" on:click={register}>Create Account</button>
</div>

<style>
  div {
    margin: 0.5rem;
    display: flex;
    gap: 0.5rem;
    flex-direction: column;
  }

  p {
    margin-bottom: 0;
  }

  .error-msg {
    color: red;
  }
</style>
