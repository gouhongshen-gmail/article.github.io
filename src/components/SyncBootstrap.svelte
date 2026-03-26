<script>
  import { syncNotebook } from '@lib/notebook-sync';

  let syncing = $state(false);

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
    void runSync(false);

    const onOnline = () => void runSync(true);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void runSync(false);
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
