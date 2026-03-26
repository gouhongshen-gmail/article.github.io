<script>
  import { syncNotebook } from '@lib/notebook-sync';

  // Plain variable (not $state) to avoid reactive loop in $effect
  let syncing = false;

  async function runSync(force = false) {
    if (syncing) return;
    syncing = true;
    try {
      await syncNotebook(force);
    } catch (error) {
      console.error('Notebook sync failed:', error);
    } finally {
      syncing = false;
    }
  }

  $effect(() => {
    runSync(false);

    const onOnline = () => runSync(true);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        runSync(false);
      }
    };

    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  });
</script>
