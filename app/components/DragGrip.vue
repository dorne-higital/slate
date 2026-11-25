<template>
    <!-- Mouse only: keyboard users move items with the arrow buttons beside it -->
    <span class="grip" draggable="true" title="Drag to move" aria-hidden="true">
        <svg width="12" height="16" viewBox="0 0 12 16"><g fill="currentColor"><circle cx="3" cy="3" r="1.4" /><circle cx="9" cy="3" r="1.4" /><circle cx="3" cy="8" r="1.4" /><circle cx="9" cy="8" r="1.4" /><circle cx="3" cy="13" r="1.4" /><circle cx="9" cy="13" r="1.4" /></g></svg>
    </span>
</template>

<style scoped>
.grip { align-items: center; color: var(--text-muted); cursor: grab; display: inline-flex; flex: none; justify-content: center; min-height: 28px; user-select: none; width: 22px; }
.grip:hover { color: var(--quarry); }
.grip:active { cursor: grabbing; }
@media (hover: none) { .grip { display: none; } }
</style>
