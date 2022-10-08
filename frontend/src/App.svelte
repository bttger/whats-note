<script>
  import Home from "./pages/Home.svelte";
  import Settings from "./pages/Settings.svelte";
  import Login from "./pages/Login.svelte";
  import { store } from "./lib/store.js";
  import { onMount } from "svelte";

  let openPage = 0;
  let unhandledEvent = false;
  let isUploading = false;
  let eventSource;

  async function sync() {
    // Download updates from the server
    try {
      const response = await fetch(`/api/sync?lastSync=${store.getLastSync()}`);
      if (response.ok) {
        const json = await response.json();
        await store.syncEventsInClientDb(json, true);
        // Upload unsynced events
        await uploadEvents();
        store.finishSync();
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
  }

  async function uploadEvents() {
    if (isUploading) {
      unhandledEvent = true;
      return;
    }
    isUploading = true;

    const upload = async () => {
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
          if (response.ok) {
            await store.finishSendingEvents(unsyncedEvents);
          } else if (response.status === 401) {
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
      if (unhandledEvent) {
        // Recursively call the upload method if an event happened during upload
        unhandledEvent = false;
        await upload();
      }
    };

    await upload();
    isUploading = false;
  }

  function goOffline() {
    console.log("OFFLINE");
    // TODO stop SSE/remove listeners and notify user
  }

  function goOnline() {
    console.log("ONLINE");
    sync();
    eventSource = new EventSource("/api/listen");
    eventSource.addEventListener("sync", (event) => {
      store.syncEventsInClientDb([JSON.parse(event.data)]);
    });
    eventSource.addEventListener("ping", (event) => {
      store.finishSync(event.data);
    });
  }

  onMount(() => {
    if (navigator.onLine) {
      goOnline();
    }
  });
</script>

<svelte:window
  on:online={goOnline}
  on:offline={goOffline}
  on:unsynced-event-pushed={uploadEvents}
/>

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
        goOnline();
      }}
    />
  {/if}
</main>
