<script>
	import { onMount, onDestroy } from 'svelte';
	import { createEventDispatcher } from 'svelte';
	import ProblemDisplay from './ProblemDisplay.svelte';
	import FeedbackDisplay from './FeedbackDisplay.svelte';

	const dispatch = createEventDispatcher();

	/** @type {string} */
	export let currentTopic = 'General';
	/** @type {number} */
	export let totalProblems = 0;
	/** @type {number} */
	export let currentProblemIndex = 0;

	let elapsedSeconds = 0;
	/** @type {ReturnType<typeof setInterval> | null} */
	let timerInterval = null;

	/** @type {'question' | 'feedback'} */
	let state = 'question';

	/** @type {any} */
	let currentProblem = null;
	/** @type {any} */
	let currentFeedback = null;

	let isSubmitting = false;
	/** @type {string[]} */
	let revealedHints = [];
	let isLoadingHint = false;

	onMount(() => {
		// Start timer
		timerInterval = setInterval(() => {
			elapsedSeconds++;
		}, 1000);
	});

	onDestroy(() => {
		if (timerInterval) {
			clearInterval(timerInterval);
		}
	});

	/**
	 * @param {number} seconds
	 */
	function formatTime(seconds) {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

	/**
	 * @param {CustomEvent<{ problemId: number; answer: string }>} event
	 */
	function handleSubmit(event) {
		isSubmitting = true;
		dispatch('submitAnswer', { ...event.detail, hintsUsed: revealedHints.length });
	}

	let isLoadingNext = false;

	/**
	 * @param {CustomEvent<{ confidence: number }>} event
	 */
	function handleNext(event) {
		if (isLoadingNext) return; // Prevent duplicate clicks
		isLoadingNext = true;
		dispatch('nextProblem', event.detail);
		state = 'question';
		revealedHints = []; // Reset hints for next problem
	}

	/**
	 * @param {CustomEvent<{ problemId: number }>} event
	 */
	function handleHintRequest(event) {
		dispatch('requestHint', event.detail);
	}

	function handleEndSession() {
		if (confirm('Are you sure you want to end this practice session?')) {
			dispatch('endSession');
		}
	}

	/**
	 * @param {any} problem
	 */
	export function showProblem(problem) {
		console.log('PracticeSession.showProblem called with:', problem);
		currentProblem = problem;
		currentFeedback = null;
		state = 'question';
		isSubmitting = false;
		isLoadingNext = false; // Reset loading state
		console.log('Set isSubmitting to false, state:', state);
		if (!currentProblem || currentProblem.id !== problem.id) {
			revealedHints = []; // Reset hints when showing new problem
		}
	}

	/**
	 * @param {any} feedback
	 */
	export function showFeedback(feedback) {
		currentFeedback = feedback;
		state = 'feedback';
		isSubmitting = false;
	}

	/**
	 * @param {string} hint
	 */
	export function addHint(hint) {
		revealedHints = [...revealedHints, hint];
		isLoadingHint = false;
	}

	/**
	 * @param {boolean} loading
	 */
	export function setHintLoading(loading) {
		isLoadingHint = loading;
	}

	/**
	 * Get the number of hints used for the current problem
	 */
	export function getHintsUsed() {
		return revealedHints.length;
	}

	/**
	 * Set loading state for next button
	 * @param {boolean} loading
	 */
	export function setNextLoading(loading) {
		isLoadingNext = loading;
	}

	$: progress = totalProblems > 0 ? (currentProblemIndex / totalProblems) * 100 : 0;
</script>

<div class="min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
	<!-- Header Bar -->
	<div class="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
		<div class="max-w-4xl mx-auto px-4 py-4">
			<div class="flex items-center justify-between mb-3">
				<div class="flex items-center gap-4">
					<div class="flex items-center gap-2">
						<span class="text-2xl">📚</span>
						<div>
							<h2 class="text-lg font-semibold text-gray-900">{currentTopic}</h2>
							<p class="text-xs text-gray-500">Practice Session</p>
						</div>
					</div>
				</div>
				<button
					on:click={handleEndSession}
					class="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg
						hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 
						focus:ring-offset-2 transition-all"
				>
					End Session
				</button>
			</div>

			<div class="flex items-center gap-6 text-sm">
				<!-- Problem Counter -->
				<div class="flex items-center gap-2">
					<span class="text-xl">📝</span>
					<span class="font-medium text-gray-900">
						Problem {currentProblemIndex} of {totalProblems}
					</span>
				</div>

				<!-- Timer -->
				<div class="flex items-center gap-2">
					<span class="text-xl">⏱️</span>
					<span class="font-medium text-gray-900">{formatTime(elapsedSeconds)}</span>
				</div>

				<!-- Progress -->
				<div class="flex-1 max-w-xs">
					<div class="w-full bg-gray-200 rounded-full h-2">
						<div
							class="bg-indigo-600 h-2 rounded-full transition-all duration-300"
							style="width: {progress}%"
						></div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Chat-style Content -->
	<div class="max-w-4xl mx-auto px-4 py-8">
		<div class="space-y-6">
			{#if state === 'question' && currentProblem}
				<div class="animate-slideIn">
					{@debug isSubmitting, state, currentProblem}
					<ProblemDisplay
						problem={currentProblem}
						disabled={isSubmitting}
						revealedHints={revealedHints}
						isLoadingHint={isLoadingHint}
						on:submit={handleSubmit}
						on:requestHint={handleHintRequest}
					/>
				</div>
			{:else if state === 'feedback' && currentFeedback}
				<div class="animate-slideIn">
					<FeedbackDisplay
						feedback={currentFeedback}
						disabled={isLoadingNext}
						on:next={handleNext}
					/>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-slideIn {
		animation: slideIn 0.3s ease-out;
	}
</style>
