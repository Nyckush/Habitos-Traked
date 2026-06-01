<style>
    .mrh-root {
       
        --mrh-surface: #ffffff;
        --mrh-surface-soft: #f4f6ff;
        --mrh-surface-variant: #dae2fd;
       
        --mrh-text: #131b2e;
        --mrh-muted: #3d4947;
        --mrh-primary: #00685f;
        --mrh-primary-strong: #008378;
        --mrh-danger: #ba1a1a;
        --mrh-danger-soft: #ffdad6;
        --mrh-secondary: #4648d4;
        --mrh-tertiary: #825100;
        color: var(--mrh-text);
        background: var(--mrh-bg);
        border-radius: 1rem;
        overflow: hidden;
        border: 1px solid var(--mrh-border);
    }

    .dark .mrh-root {
        
        --mrh-surface: #1f2937;
        --mrh-surface-soft: #111827;
        --mrh-surface-variant: #283044;
      
        --mrh-text: #eef0ff;
        --mrh-muted: #9ca3af;
        --mrh-primary: #6bd8cb;
        --mrh-primary-strong: #89f5e7;
        --mrh-danger: #ff9b9b;
        --mrh-danger-soft: #462225;
        --mrh-secondary: #c0c1ff;
        --mrh-tertiary: #ffddb8;
    }

    .mrh-topbar {
        position: sticky;
        top: 0;
        z-index: 20;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.5rem;
        padding: 0.625rem 1rem;
        background: var(--mrh-surface);
        border-bottom: 1px solid var(--mrh-border);
    }

    .mrh-topbar-title {
        font-size: 1.125rem;
        font-weight: 700;
        color: var(--mrh-primary);
    }

    .mrh-topbar-tools {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .mrh-icon-btn {
        width: 2rem;
        height: 2rem;
        border-radius: 9999px;
        border: 0;
        background: transparent;
        color: var(--mrh-muted);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
    }

    .mrh-avatar {
        width: 2rem;
        height: 2rem;
        border-radius: 9999px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: var(--mrh-surface-variant);
        color: var(--mrh-primary);
        font-weight: 700;
        font-size: 0.75rem;
    }

    .mrh-page {
        max-width: 30rem;
        margin: 0 auto;
        padding: 1.5rem 1rem;
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
    }

    .mrh-center {
        text-align: center;
    }

    .mrh-date-title {
        font-size: 1.75rem;
        line-height: 2.1rem;
        font-weight: 700;
    }

    .mrh-date-sub {
        margin-top: 0.2rem;
        color: var(--mrh-muted);
        font-size: 0.95rem;
    }

    .mrh-ring {
        position: relative;
        width: 8rem;
        height: 8rem;
        margin: 1rem auto 0;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .mrh-ring-svg {
        width: 100%;
        height: 100%;
        position: absolute;
        inset: 0;
    }

    .mrh-ring-bg {
        stroke: var(--mrh-surface-variant);
    }

    .mrh-ring-progress {
        stroke: var(--mrh-primary);
        transition: stroke-dashoffset 0.35s;
        transform: rotate(-90deg);
        transform-origin: 50% 50%;
    }

    .mrh-ring-value {
        font-size: 2rem;
        font-weight: 800;
        color: var(--mrh-primary);
        z-index: 1;
    }

    .mrh-card {
        background: var(--mrh-surface);
        border: 1px solid var(--mrh-border);
        border-radius: 0.9rem;
        padding: 1rem;
        box-shadow: 0 4px 10px rgb(15 23 42 / 0.06);
    }

    .mrh-card-overdue {
        border-color: #f3a7a7;
        background: linear-gradient(180deg, color-mix(in oklab, var(--mrh-danger-soft) 65%, transparent), var(--mrh-surface));
        position: relative;
    }

    .mrh-card-overdue::before {
        content: "";
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        width: 0.25rem;
        border-radius: 0.9rem 0 0 0.9rem;
        background: var(--mrh-danger);
    }

    .mrh-pill {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.2rem 0.55rem;
        border-radius: 9999px;
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        font-weight: 700;
    }

    .mrh-pill-danger {
        background: var(--mrh-danger-soft);
        color: var(--mrh-danger);
    }

    .mrh-pill-primary {
        background: color-mix(in oklab, var(--mrh-primary) 16%, transparent);
        color: var(--mrh-primary);
    }

    .mrh-card-title {
        margin-top: 0.6rem;
        font-size: 1.45rem;
        line-height: 1.8rem;
        font-weight: 700;
    }

    .mrh-meta {
        margin-top: 0.35rem;
        display: flex;
        align-items: center;
        gap: 0.35rem;
        color: var(--mrh-muted);
        font-size: 0.86rem;
    }

    .mrh-full-btn {
        width: 100%;
        margin-top: 0.9rem;
    }

    .mrh-next {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.75rem;
        background: var(--mrh-surface-soft);
    }

    .mrh-next-kicker {
        font-size: 0.72rem;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--mrh-muted);
        margin-bottom: 0.25rem;
    }

    .mrh-next-title {
        font-size: 1.02rem;
        font-weight: 700;
    }

    .mrh-next-time {
        font-size: 1.4rem;
        font-weight: 800;
        color: var(--mrh-secondary);
    }

    .mrh-routines {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .mrh-routine-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.8rem;
    }

    .mrh-routine-title {
        font-size: 1.1rem;
        font-weight: 700;
    }

    .mrh-routine-progress {
        font-size: 0.72rem;
        font-weight: 700;
        padding: 0.22rem 0.5rem;
        border-radius: 9999px;
        background: var(--mrh-surface-soft);
    }

    .mrh-routine-habits {
        display: flex;
        flex-direction: column;
        gap: 0.45rem;
    }

    .mrh-habit-row {
        border: 1px solid transparent;
        border-radius: 0.65rem;
        padding: 0.5rem 0.55rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.7rem;
        background: transparent;
    }

    .mrh-habit-row-overdue {
        border-color: #f3a7a7;
        background: color-mix(in oklab, var(--mrh-danger-soft) 70%, transparent);
    }

    .mrh-habit-left {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        min-width: 0;
    }

    .mrh-check {
        width: 1.5rem;
        height: 1.5rem;
        border-radius: 9999px;
        border: 2px solid var(--mrh-border);
        background: var(--mrh-surface);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    .mrh-check-done {
        border-color: var(--mrh-primary);
        background: var(--mrh-primary);
        color: #ffffff;
    }

    .mrh-habit-name {
        font-size: 0.94rem;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .mrh-habit-name-done {
        text-decoration: line-through;
        color: var(--mrh-muted);
    }

    .mrh-habit-note {
        font-size: 0.72rem;
        color: var(--mrh-muted);
    }

    .mrh-habit-note-danger {
        color: var(--mrh-danger);
        font-weight: 600;
    }

    .mrh-observation {
        width: 100%;
        margin-top: 0.5rem;
        border-radius: 0.55rem;
        border: 1px solid var(--mrh-border);
        font-size: 0.86rem;
        background: var(--mrh-surface);
        color: var(--mrh-text);
    }

    .mrh-observation:focus {
        outline: none;
        border-color: var(--mrh-primary);
        box-shadow: 0 0 0 1px var(--mrh-primary);
    }

    .mrh-stats {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.75rem;
    }

    .mrh-stat {
        background: var(--mrh-surface-soft);
        border: 1px solid var(--mrh-border);
        border-radius: 0.85rem;
        padding: 0.9rem;
        text-align: center;
    }

    .mrh-stat-value {
        margin-top: 0.2rem;
        font-size: 1.75rem;
        line-height: 1.9rem;
        font-weight: 800;
    }

    .mrh-stat-label {
        margin-top: 0.1rem;
        font-size: 0.72rem;
        color: var(--mrh-muted);
        text-transform: uppercase;
        letter-spacing: 0.04em;
    }

    .mrh-week {
        grid-column: 1 / -1;
        display: flex;
        align-items: center;
        justify-content: space-between;
        text-align: left;
    }

    .mrh-muted {
        color: var(--mrh-muted);
        font-size: 0.9rem;
    }
</style>
