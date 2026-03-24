<script lang="ts">
	import { onMount } from 'svelte';

	let {
		storyTitle = '',
		wordCount = 0,
		readingTime = 5,
		nextStorySlug = '',
		nextStoryTitle = ''
	} = $props();

	let selectedRating: 'easy' | 'just-right' | 'challenging' | null = $state(null);

	onMount(() => {
		// Check localStorage for existing rating
		const savedRating = localStorage.getItem(`longlore_rating_${storyTitle}`);
		if (savedRating) {
			selectedRating = savedRating as 'easy' | 'just-right' | 'challenging';
		}
	});

	function handleRating(rating: 'easy' | 'just-right' | 'challenging') {
		selectedRating = rating;
		localStorage.setItem(`longlore_rating_${storyTitle}`, rating);
	}
</script>

<div class="story-completion">
	<!-- Decorative divider -->
	<div class="divider">· · ·</div>

	<!-- Completion message -->
	<h2 class="completion-message">故事完成！<br />Story Complete</h2>

	<!-- Stats row -->
	<div class="stats">
		<span>📖 {wordCount} words</span>
		<span>·</span>
		<span>⏱ {readingTime} min</span>
	</div>

	<!-- Rating section -->
	<div class="rating-section">
		<p class="rating-prompt">How was this story?</p>
		<div class="rating-buttons">
			<button
				class="emoji-button"
				class:selected={selectedRating === 'easy'}
				on:click={() => handleRating('easy')}
				title="Too Easy"
			>
				😐
			</button>
			<button
				class="emoji-button"
				class:selected={selectedRating === 'just-right'}
				on:click={() => handleRating('just-right')}
				title="Just Right"
			>
				🙂
			</button>
			<button
				class="emoji-button"
				class:selected={selectedRating === 'challenging'}
				on:click={() => handleRating('challenging')}
				title="Challenging"
			>
				🤩
			</button>
		</div>
	</div>

	<!-- Next story CTA -->
	{#if nextStorySlug && nextStoryTitle}
		<a href="/stories/{nextStorySlug}" class="cta-button">
			Continue your journey → {nextStoryTitle}
		</a>
	{/if}

	<!-- Bottom links -->
	<div class="bottom-links">
		<a href="/stories" class="link">Browse all stories</a>
		<span class="separator">·</span>
		<a href="/review" class="link">Review new words</a>
	</div>
</div>

<style>
	.story-completion {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 24px;
		max-width: 480px;
		margin: 0 auto;
		padding: 32px 24px;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		text-align: center;
	}

	.divider {
		font-size: 1.5rem;
		letter-spacing: 0.5em;
		color: #d9644f;
		line-height: 1;
	}

	.completion-message {
		font-family: var(--font-display-en);
		font-size: 1.5rem;
		color: var(--color-text-primary);
		margin: 0;
		line-height: 1.4;
		animation: celebrationPop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
	}

	@keyframes celebrationPop {
		0% {
			opacity: 0;
			transform: scale(0.8);
		}
		100% {
			opacity: 1;
			transform: scale(1);
		}
	}

	.stats {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: var(--text-small);
		color: var(--color-text-secondary);
	}

	.rating-section {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.rating-prompt {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		margin: 0;
	}

	.rating-buttons {
		display: flex;
		justify-content: center;
		gap: 12px;
	}

	.emoji-button {
		width: 48px;
		height: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: transparent;
		cursor: pointer;
		font-size: 1.5rem;
		transition: all 0.2s ease;

		&:hover {
			transform: scale(1.05);
		}

		&.selected {
			border-color: var(--color-jade);
			background: rgba(45, 138, 114, 0.08);
		}
	}

	.cta-button {
		display: block;
		width: 100%;
		height: 44px;
		padding: 0;
		background: var(--color-jade);
		color: white;
		text-decoration: none;
		border: none;
		border-radius: var(--radius-md);
		font-size: 0.95rem;
		font-weight: 500;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: opacity 0.2s ease;

		&:hover {
			opacity: 0.9;
		}

		&:active {
			opacity: 0.8;
		}
	}

	.bottom-links {
		display: flex;
		align-items: center;
		gap: 12px;
		font-size: 14px;
	}

	.link {
		color: var(--color-jade);
		text-decoration: none;
		cursor: pointer;
		transition: opacity 0.2s ease;

		&:hover {
			opacity: 0.8;
		}
	}

	.separator {
		color: var(--color-text-secondary);
	}
</style>
