<script lang="ts">
  /** Mark for Magic Arrow and Visions: air, fire, earth and water quarters with their signs. */
  interface Props {
    label: string;
  }

  let { label }: Props = $props();
</script>

<svg class="badge" viewBox="0 0 24 24" role="img" aria-label={label}>
  <title>{label}</title>
  <path d="M1 12V5a4 4 0 0 1 4-4h7v11z" fill="#3f7fbf" />
  <path d="M12 1h7a4 4 0 0 1 4 4v7H12z" fill="#c8402a" />
  <path d="M1 12h11v11H5a4 4 0 0 1-4-4z" fill="#7a5a26" />
  <path d="M12 12h11v7a4 4 0 0 1-4 4h-7z" fill="#23827d" />
  <path
    d="M3 5.2h4.6a1.5 1.5 0 1 0-1.5-1.5M3 8h6.2a1.5 1.5 0 1 1-1.5 1.5"
    fill="none"
    stroke="#fff"
    stroke-width="1.4"
    stroke-linecap="round"
  />
  <path
    d="M17.5 2.6c.8 2 2.8 3 2.8 5.2a2.8 2.8 0 0 1-5.6 0c0-1.2.6-2 1.2-2.5 0 1 .6 1.5 1.1 1.5 0-1.6-.4-2.6.5-4.2z"
    fill="#fff"
  />
  <path d="M2.4 20.6l3.3-6 1.9 3.2 1.3-2 2.6 4.8z" fill="#fff" />
  <path d="M17.5 13.6s-2.8 3.1-2.8 4.9a2.8 2.8 0 0 0 5.6 0c0-1.8-2.8-4.9-2.8-4.9z" fill="#fff" />
  <path d="M12 1v22M1 12h22" stroke="#3a2608" stroke-width=".8" />
  <rect x="1" y="1" width="22" height="22" rx="4" fill="none" stroke="#b8922f" stroke-width="1.4" />
</svg>

<style>
  .badge {
    flex: none;
    width: 20px;
    height: 20px;
  }
</style>
