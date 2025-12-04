<script>
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	/** @type {{ id: number; question_text: string; problem_type: string; options?: any; hint_count?: number; }} */
	export let problem;
	export let disabled = false;
	/** @type {string[]} */
	export let revealedHints = [];
	export let isLoadingHint = false;

	let answer = '';
	/** @type {string | null} */
	let selectedOption = null;

	/**
	 * @param {string} option
	 */
	function selectOption(option) {
		if (disabled) return;
		selectedOption = option;
		answer = option;
	}

	function handleSubmit() {
		if (!canSubmit) return;
		
		dispatch('submit', {
			problemId: problem.id,
			answer: answer
		});
	}

	function handleHintRequest() {
		dispatch('requestHint', { problemId: problem.id });
	}

	/**
	 * @param {KeyboardEvent} e
	 */
	function handleKeydown(e) {
		if (disabled) return;
		
		// Enter to submit
		if (e.key === 'Enter' && !e.shiftKey && canSubmit) {
			if (problem.problem_type !== 'free_response') {
				e.preventDefault();
				handleSubmit();
			}
		}
		
		// Number keys for multiple choice (1-4)
		if (problem.problem_type === 'multiple_choice' && problem.options) {
			const num = parseInt(e.key);
			if (num >= 1 && num <= problem.options.length) {
				e.preventDefault();
				selectOption(problem.options[num - 1]);
			}
		}
	}

	// Normalize type and parse options safely
	$: normalizedType = (() => {
		const raw = String(problem?.problem_type || '').trim().toLowerCase();
		// Map common variants to canonical types
		if (['mcq','multiplechoice','multiple_choice','choice','choices'].includes(raw)) return 'multiple_choice';
		if (['short','shortanswer','short_answer'].includes(raw)) return 'short_answer';
		if (['free','free_response','long','essay'].includes(raw)) return 'free_response';
		return raw || 'short_answer';
	})();
	$: parsedOptions = (() => {
		const raw = problem.options && typeof problem.options === 'string'
			? (() => { try { return JSON.parse(problem.options); } catch { return []; } })()
			: (problem.options || []);
		// Deduplicate and normalize options to avoid identical choices
		const seen = new Set();
		const result = [];
		for (const opt of raw) {
			const norm = String(opt ?? '').trim().toLowerCase();
			if (!seen.has(norm) && norm.length > 0) {
				seen.add(norm);
				result.push(String(opt ?? '').trim());
			}
		}
		return result;
	})();

	$: canSubmit = answer.trim().length > 0;

	// Reset when problem changes - watch the entire problem object
	$: if (problem) {
		answer = '';
		selectedOption = null;
	}

	// Always reset disabled when not actually disabled from parent
	$: if (!disabled && problem) {
		// Force re-enable inputs when parent says we're not disabled
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
	<!-- Question -->
	<div class="mb-6">
		<div class="flex items-start gap-3 mb-4">
			<div class="text-2xl shrink-0">❓</div>
			<div class="flex-1">
				<p class="text-lg text-gray-900 leading-relaxed">{problem.question_text}</p>
			</div>
		</div>
	</div>

	<!-- Answer Input -->
	<div class="mb-6">
		{@debug disabled, isSubmitting: disabled, answer, problem.id}
		{#if normalizedType === 'multiple_choice' && parsedOptions.length > 0}
			<div class="space-y-3">
				{#each parsedOptions as option, index}
					<button
						on:click={() => selectOption(option)}
						disabled={disabled}
						class="w-full text-left p-4 rounded-lg border-2 transition-all
							{selectedOption === option
								? 'border-indigo-500 bg-indigo-50'
								: 'border-gray-200 bg-white hover:border-indigo-300'}
							{disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
							focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
					>
						<div class="flex items-center gap-3">
							<div class="shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center
								{selectedOption === option
									? 'border-indigo-500 bg-indigo-500'
									: 'border-gray-300'}">
								{#if selectedOption === option}
									<div class="w-2 h-2 rounded-full bg-white"></div>
								{/if}
							</div>
							<span class="text-sm text-gray-500 font-medium w-6">{index + 1}.</span>
							<span class="flex-1 text-gray-900">{option}</span>
						</div>
					</button>
				{/each}
			</div>
			<p class="text-xs text-gray-500 mt-3">💡 Tip: Press 1-{parsedOptions.length} to select</p>

		{:else if normalizedType === 'short_answer'}
			<div>
				<input
					type="text"
					bind:value={answer}
					disabled={disabled}
					placeholder="Type your answer..."
					class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg
						focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
						transition-all text-gray-900 placeholder-gray-400
						disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-gray-50"
				/>
				<p class="text-xs text-gray-500 mt-2">💡 Tip: Press Enter to submit</p>
			</div>

		{:else if normalizedType === 'free_response'}
			<div>
				<textarea
					bind:value={answer}
					disabled={disabled}
					placeholder="Type your detailed answer..."
					rows="6"
					class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg resize-y
						focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
						transition-all text-gray-900 placeholder-gray-400
						disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-gray-50"
				></textarea>
				<p class="text-xs text-gray-500 mt-2">💡 Tip: Use Shift+Enter for new lines</p>
			</div>
		{:else}
			<div>
				<input
					type="text"
					bind:value={answer}
					disabled={disabled}
					placeholder="Type your answer..."
					class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg
						focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
						transition-all text-gray-900 placeholder-gray-400
						disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-gray-50"
				/>
				<p class="text-xs text-gray-500 mt-2">Unknown problem type; using short answer.</p>
			</div>
		{/if}
	</div>

	<!-- Hints Section -->
	{#if problem.hint_count && problem.hint_count > 0}
		<div class="mb-6">
			<div class="bg-amber-50 border border-amber-200 rounded-lg p-4">
				<div class="flex items-start gap-3 mb-3">
					<span class="text-xl">💡</span>
					<div class="flex-1">
						<h4 class="text-sm font-medium text-amber-900 mb-1">Need a hint?</h4>
						<p class="text-xs text-amber-700">
							{revealedHints.length} of {problem.hint_count} hints used
							{#if revealedHints.length > 0}
								(reduces confidence score)
							{/if}
						</p>
					</div>
				</div>

				<!-- Revealed Hints -->
				{#if revealedHints.length > 0}
					<div class="space-y-2 mb-3">
						{#each revealedHints as hint, index}
							<div class="bg-white rounded p-3 border border-amber-200">
								<p class="text-xs font-medium text-amber-700 mb-1">Hint {index + 1}:</p>
								<p class="text-sm text-gray-700">{hint}</p>
							</div>
						{/each}
					</div>
				{/if}

				<!-- Hint Button -->
				{#if revealedHints.length < problem.hint_count}
					<button
						on:click={handleHintRequest}
						disabled={disabled || isLoadingHint}
						class="w-full px-4 py-2 bg-amber-100 text-amber-900 font-medium rounded-lg
							hover:bg-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 
							focus:ring-offset-2 transition-all border border-amber-300
							disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-amber-100"
					>
						{isLoadingHint ? 'Loading...' : `Show Hint ${revealedHints.length + 1}`}
					</button>
				{:else}
					<p class="text-xs text-amber-700 text-center italic">All hints used</p>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Submit Button -->
	<button
		on:click={handleSubmit}
		disabled={!canSubmit || disabled}
		class="w-full px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg
			hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 
			focus:ring-offset-2 transition-all
			disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-600"
	>
		{disabled ? 'Submitting...' : 'Submit Answer'}
	</button>
</div>
