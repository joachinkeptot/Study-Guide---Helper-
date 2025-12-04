<script>
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	/** @type {{ is_correct: boolean; explanation?: string; correct_answer?: string; user_answer?: string; hints_used?: number; }} */
	export let feedback;
	export let disabled = false;

	let confidence = 0;

	const confidenceLevels = [
		{ value: 1, emoji: '😰', label: 'Not Confident', description: 'Need more practice' },
		{ value: 2, emoji: '😐', label: 'Somewhat Confident', description: 'Getting there' },
		{ value: 3, emoji: '😊', label: 'Very Confident', description: 'I know this!' }
	];

	/**
	 * @param {number} level
	 */
	function setConfidence(level) {
		if (disabled) return;
		confidence = level;
	}

	function handleNext() {
		if (disabled) return; // Prevent duplicate submissions
		dispatch('next', { confidence });
		// Reset for next problem
		confidence = 0;
	}

	/**
	 * @param {KeyboardEvent} e
	 */
	function handleKeydown(e) {
		if (disabled) return;

		// Number keys 1-3 for confidence
		const num = parseInt(e.key);
		if (num >= 1 && num <= 3) {
			e.preventDefault();
			setConfidence(num);
		}

		// Enter to go to next (only if confidence is set)
		if (e.key === 'Enter' && confidence > 0) {
			e.preventDefault();
			handleNext();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="bg-white rounded-lg shadow-sm border-2 {feedback.is_correct ? 'border-green-300' : 'border-red-300'} p-6">
	<!-- Result Header -->
	<div class="flex items-center gap-3 mb-4">
		<div class="text-3xl">
			{feedback.is_correct ? '✅' : '❌'}
		</div>
		<div class="flex-1">
			<h3 class="text-xl font-semibold {feedback.is_correct ? 'text-green-700' : 'text-red-700'}">
				{feedback.is_correct ? 'Correct!' : 'Not Quite'}
			</h3>
			<p class="text-sm text-gray-600">
				{feedback.is_correct 
					? 'Great job! Keep it up.' 
					: 'Don\'t worry, this is how we learn.'}
			</p>
		</div>
	</div>

	<!-- Answer Comparison -->
	{#if !feedback.is_correct && feedback.correct_answer}
		<div class="mb-4 p-4 bg-gray-50 rounded-lg space-y-2">
			{#if feedback.user_answer}
				<div>
					<p class="text-xs font-medium text-gray-500 mb-1">Your Answer:</p>
					<p class="text-sm text-gray-900">{feedback.user_answer}</p>
				</div>
			{/if}
			<div>
				<p class="text-xs font-medium text-gray-500 mb-1">Correct Answer:</p>
				<p class="text-sm text-green-700 font-medium">{feedback.correct_answer}</p>
			</div>
		</div>
	{/if}

	<!-- Hints Used Indicator -->
	{#if feedback.hints_used && feedback.hints_used > 0}
		<div class="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
			<div class="flex items-center gap-2">
				<div class="text-lg shrink-0">💡</div>
				<div class="flex-1">
					<p class="text-xs font-medium text-amber-900">
						{feedback.hints_used} {feedback.hints_used === 1 ? 'hint' : 'hints'} used
					</p>
					<p class="text-xs text-amber-700">Confidence score adjusted accordingly</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Explanation -->
	{#if feedback.explanation}
		<div class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
			<div class="flex items-start gap-2">
				<div class="text-xl shrink-0">💡</div>
				<div class="flex-1">
					<p class="text-sm font-medium text-blue-900 mb-1">Explanation</p>
					<p class="text-sm text-blue-800 leading-relaxed">{feedback.explanation}</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Confidence Rating -->
	<div class="mb-6">
		<p class="text-sm font-medium text-gray-700 mb-3">
			How confident do you feel about this topic?
		</p>
		<div class="grid grid-cols-3 gap-3">
			{#each confidenceLevels as level}
				<button
					on:click={() => setConfidence(level.value)}
					disabled={disabled}
					class="flex flex-col items-center p-4 rounded-lg border-2 transition-all
						{confidence === level.value
							? 'border-indigo-500 bg-indigo-50'
							: 'border-gray-200 bg-white hover:border-indigo-300'}
						{disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
						focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
				>
					<div class="text-3xl mb-2">{level.emoji}</div>
					<div class="text-xs font-medium text-gray-900 mb-1 text-center">
						{level.label}
					</div>
					<div class="text-xs text-gray-500 text-center">
						{level.description}
					</div>
				</button>
			{/each}
		</div>
		<p class="text-xs text-gray-500 mt-3 text-center">💡 Tip: Press 1, 2, or 3 to rate confidence</p>
	</div>

	<!-- Next Button -->
	<button
		on:click={handleNext}
		disabled={confidence === 0 || disabled}
		class="w-full px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg
			hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 
			focus:ring-offset-2 transition-all
			disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-600"
	>
		{#if disabled && confidence > 0}
			<span class="inline-flex items-center gap-2">
				<div class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
				Loading next problem...
			</span>
		{:else if confidence === 0}
			Rate your confidence to continue
		{:else}
			Next Problem →
		{/if}
	</button>
	{#if confidence > 0}
		<p class="text-xs text-gray-500 mt-2 text-center">💡 Tip: Press Enter to continue</p>
	{/if}
</div>
