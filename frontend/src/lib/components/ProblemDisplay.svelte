<script>
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	/** @type {{ id: number; question_text: string; problem_type: string; options?: any; }} */
	export let problem;
	export let disabled = false;

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

	$: parsedOptions = problem.options && typeof problem.options === 'string' 
		? JSON.parse(problem.options) 
		: problem.options || [];

	$: canSubmit = answer.trim().length > 0;

	// Reset when problem changes
	$: if (problem.id) {
		answer = '';
		selectedOption = null;
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
	<!-- Question -->
	<div class="mb-6">
		<div class="flex items-start gap-3 mb-4">
			<div class="text-2xl flex-shrink-0">❓</div>
			<div class="flex-1">
				<p class="text-lg text-gray-900 leading-relaxed">{problem.question_text}</p>
			</div>
		</div>
	</div>

	<!-- Answer Input -->
	<div class="mb-6">
		{#if problem.problem_type === 'multiple_choice'}
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
							<div class="flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center
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

		{:else if problem.problem_type === 'short_answer'}
			<div>
				<input
					type="text"
					bind:value={answer}
					disabled={disabled}
					placeholder="Type your answer..."
					class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg
						focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
						disabled:opacity-60 disabled:cursor-not-allowed
						transition-all text-gray-900 placeholder-gray-400"
				/>
				<p class="text-xs text-gray-500 mt-2">💡 Tip: Press Enter to submit</p>
			</div>

		{:else if problem.problem_type === 'free_response'}
			<div>
				<textarea
					bind:value={answer}
					disabled={disabled}
					placeholder="Type your detailed answer..."
					rows="6"
					class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg resize-y
						focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
						disabled:opacity-60 disabled:cursor-not-allowed
						transition-all text-gray-900 placeholder-gray-400"
				></textarea>
				<p class="text-xs text-gray-500 mt-2">💡 Tip: Use Shift+Enter for new lines</p>
			</div>
		{/if}
	</div>

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
