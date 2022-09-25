<script>
  import Home from "./pages/Home.svelte";
  import Settings from "./pages/Settings.svelte";
  import Login from "./pages/Login.svelte";
  import { store } from "./lib/store.js";
  import { onMount } from "svelte";

  let openPage = 0;

  async function sync() {
    try {
      const response = await fetch(`/api/sync?lastSync=${store.getLastSync()}`);
      if (response.ok) {
        const json = await response.json();
        await store.syncNotes(json.notes);
        await store.syncChatEvents(json.chatEvents);
      } else if (response.status === 401) {
        openPage = 2;
      } else {
        console.error(
          `Could not pull new updates. Status Code: ${response.status}`
        );
      }
    } catch (error) {
      console.error(error);
      console.error(
        "Could not pull new updates. Please check your connection."
      );
    }

    const unsyncedEvents = await store.getUnsyncedEvents();
    if (unsyncedEvents.length) {
      try {
        const response = await fetch("/api/events", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(unsyncedEvents),
        });
        if (!response.ok && response.status === 401) {
          openPage = 2;
        } else {
          console.error(
            `Could not push unsynced data. Status Code: ${response.status}`
          );
        }
      } catch (error) {
        console.error(error);
        console.error(
          "Could not push unsynced data. Please check your connection."
        );
      }
    }

    store.finishSync();
  }

  window.addEventListener("offline", () => {
    console.log("offline");
  });

  window.addEventListener("online", () => {
    console.log("online");
  });

  onMount(() => {
    if (navigator.onLine) sync();
  });
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
