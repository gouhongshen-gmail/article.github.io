<script lang="ts">
	import { onMount } from 'svelte';

	interface Section {
		id: string;
		text: string;
		level: 2 | 3;
		element: HTMLElement;
	}

	let sections: Section[] = [];
	let activeSectionId: string | null = null;
	let isMobileOpen = false;

	// Slugify text to create IDs
	function slugify(text: string): string {
		return text
			.toLowerCase()
			.trim()
			.replace(/[^\w\s-]/g, '')
			.replace(/\s+/g, '-')
			.replace(/-+/g, '-');
	}

	onMount(() => {
		const storyContent = document.querySelector('.story-content');
		if (!storyContent) return;

		// Find all h2 and h3 elements
		const headings = Array.from(storyContent.querySelectorAll('h2, h3')) as HTMLElement[];

		if (headings.length === 0) {
			// No headings, hide the nav
			return;
		}

		// Build sections and assign IDs
		sections = headings.map((heading) => {
			const level = parseInt(heading.tagName[1]) as 2 | 3;
			let id = heading.id;

			if (!id) {
				id = slugify(heading.textContent || '');
				heading.id = id;
			}

			return {
				id,
				text: heading.textContent || '',
				level,
				element: heading,
			};
		});

		// Set up IntersectionObserver
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						activeSectionId = entry.target.id;
					}
				});
			},
			{ rootMargin: '-72px 0px -50% 0px', threshold: 0 }
		);

		headings.forEach((heading) => {
			observer.observe(heading);
		});

		return () => {
			observer.disconnect();
		};
	});

	function handleSectionClick(event: MouseEvent, targetId: string) {
		event.preventDefault();
		const element = document.getElementById(targetId);
		if (element) {
			element.scrollIntoView({ behavior: 'smooth' });
			isMobileOpen = false;
			activeSectionId = targetId;
		}
	}

	function toggleMobileNav() {
		isMobileOpen = !isMobileOpen;
	}
</script>

<div class="section-nav-container">
	<!-- Desktop sidebar -->
	<nav class="section-nav-desktop">
		{#if sections.length > 0}
			<div class="section-list">
				{#each sections as section (section.id)}
					<a
						href="#{section.id}"
						class="section-item"
						class:active={activeSectionId === section.id}
						class:level-h3={section.level === 3}
						on:click={(e) => handleSectionClick(e, section.id)}
					>
						{section.text}
					</a>
				{/each}
			</div>
		{/if}
	</nav>

	<!-- Mobile button -->
	<button class="mobile-toc-button" on:click={toggleMobileNav} aria-label="Show table of contents">
		📑
	</button>

	<!-- Mobile sheet -->
	{#if isMobileOpen}
		<div class="mobile-backdrop" on:click={() => (isMobileOpen = false)} role="presentation" />
		<div class="mobile-sheet">
			<div class="sheet-handle" />
			<div class="section-list">
				{#each sections as section (section.id)}
					<a
						href="#{section.id}"
						class="section-item"
						class:active={activeSectionId === section.id}
						class:level-h3={section.level === 3}
						on:click={(e) => handleSectionClick(e, section.id)}
					>
						{section.text}
					</a>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.section-nav-container {
		/* Container for positioning context */
	}

	/* Desktop sidebar styles */
	.section-nav-desktop {
		display: none;
	}

	@media (min-width: 1024px) {
		.section-nav-desktop {
			display: block;
			position: sticky;
			top: 72px;
			width: 200px;
			flex-shrink: 0;
			max-height: calc(100vh - 72px);
			overflow-y: auto;
		}

		.section-list {
			display: flex;
			flex-direction: column;
			gap: 8px;
		}

		.section-item {
			display: block;
			padding: 8px 12px;
			padding-left: 12px;
			font-size: 13px;
			line-height: 1.4;
			text-decoration: none;
			color: var(--color-text-secondary);
			font-weight: 400;
			transition: color 0.2s ease;
			border-left: 2px solid transparent;
			position: relative;

			&:hover {
				color: var(--color-text);
			}

			&.level-h3 {
				padding-left: 28px;
			}

			&.active {
				color: var(--color-vermillion);
				font-weight: 600;
				border-left-color: var(--color-vermillion);
			}
		}
	}

	/* Mobile button */
	.mobile-toc-button {
		display: flex;
		align-items: center;
		justify-content: center;
		position: fixed;
		bottom: 80px;
		left: 16px;
		width: 44px;
		height: 44px;
		border: none;
		background: var(--color-elevated);
		border-radius: 8px;
		font-size: 20px;
		cursor: pointer;
		z-index: 40;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		transition: transform 0.2s ease;

		&:active {
			transform: scale(0.95);
		}
	}

	@media (min-width: 1024px) {
		.mobile-toc-button {
			display: none;
		}
	}

	/* Mobile sheet */
	.mobile-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.3);
		z-index: 39;
		animation: fadeIn 0.2s ease;
	}

	.mobile-sheet {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background: var(--color-elevated);
		border-radius: 16px 16px 0 0;
		max-height: 60vh;
		overflow-y: auto;
		z-index: 41;
		animation: slideUp 0.3s ease;
		padding-bottom: 16px;
	}

	.sheet-handle {
		width: 40px;
		height: 4px;
		background: var(--color-border);
		border-radius: 2px;
		margin: 8px auto;
	}

	.mobile-sheet .section-list {
		display: flex;
		flex-direction: column;
	}

	.mobile-sheet .section-item {
		padding: 12px 16px;
		min-height: 44px;
		display: flex;
		align-items: center;
		font-size: 14px;
		text-decoration: none;
		color: var(--color-text);
		font-weight: 400;
		transition: background 0.2s ease;

		&:active {
			background: rgba(0, 0, 0, 0.05);
		}

		&.active {
			color: var(--color-vermillion);
			font-weight: 600;
		}

		&.level-h3 {
			padding-left: 32px;
			font-size: 13px;
		}
	}

	@media (min-width: 1024px) {
		.mobile-backdrop,
		.mobile-sheet {
			display: none;
		}
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes slideUp {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
		}
	}
</style>
