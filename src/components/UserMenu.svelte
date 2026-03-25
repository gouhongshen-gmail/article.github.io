<script>
  import { logout, isLoggedIn } from '@lib/api';

  let loggedIn = $state(false);
  let dropdownOpen = $state(false);

  $effect(() => {
    loggedIn = isLoggedIn();
  });

  function toggleDropdown() {
    dropdownOpen = !dropdownOpen;
  }

  function closeDropdown(e) {
    if (e.target.closest('.user-menu')) return;
    dropdownOpen = false;
  }

  async function handleSignOut() {
    try {
      await logout();
    } catch {
      // If API call fails, still clear cookie locally
      document.cookie = 'll_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    }
    window.location.href = '/';
  }

  $effect(() => {
    if (dropdownOpen) {
      document.addEventListener('click', closeDropdown);
      return () => document.removeEventListener('click', closeDropdown);
    }
  });
</script>

{#if loggedIn}
  <div class="user-menu">
    <button class="avatar" onclick={toggleDropdown} aria-label="User menu">
      U
    </button>
    {#if dropdownOpen}
      <div class="dropdown">
        <a href="/dashboard" class="dropdown-item">Dashboard</a>
        <a href="/vocabulary" class="dropdown-item">My Vocabulary</a>
        <a href="/settings" class="dropdown-item">Settings</a>
        <button class="dropdown-item sign-out" onclick={handleSignOut}>Sign Out</button>
      </div>
    {/if}
  </div>
{:else}
  <a href="/login" class="login-link">Log In</a>
{/if}

<style>
  .user-menu {
    position: relative;
  }

  .avatar {
    width: 36px;
    height: 36px;
    border-radius: var(--radius-full);
    background: var(--color-accent);
    color: #fff;
    border: none;
    font-family: var(--font-body-en);
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity 0.15s ease;
  }

  .avatar:hover {
    opacity: 0.85;
  }

  .dropdown {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    min-width: 180px;
    background: var(--color-parchment, #f5f0e6);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-md);
    padding: var(--radius-md);
    z-index: 100;
    display: flex;
    flex-direction: column;
  }

  .dropdown-item {
    display: block;
    padding: 8px 12px;
    font-family: var(--font-body-en);
    font-size: 0.875rem;
    color: var(--color-text-primary);
    text-decoration: none;
    border-radius: var(--radius-sm);
    border: none;
    background: none;
    cursor: pointer;
    text-align: left;
    width: 100%;
    transition: background 0.12s ease;
  }

  .dropdown-item:hover {
    background: var(--color-surface);
  }

  .sign-out {
    color: var(--color-brand, #c4392a);
    border-top: 1px solid var(--color-border-subtle, #d6d1c7);
    margin-top: 4px;
    padding-top: 12px;
    border-radius: 0 0 var(--radius-sm) var(--radius-sm);
  }

  .login-link {
    font-family: var(--font-body-en);
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-primary);
    text-decoration: none;
    padding: 6px 16px;
    border: 1px solid var(--color-border-subtle, #d6d1c7);
    border-radius: var(--radius-md);
    transition: background 0.12s ease, border-color 0.12s ease;
  }

  .login-link:hover {
    background: var(--color-surface);
    border-color: var(--color-border-strong, #b8b3a9);
  }
</style>
