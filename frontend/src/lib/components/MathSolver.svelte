<script>
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	let input = '';
	let loading = false;
	/** @type {any} */
	let result = null;
	let error = '';

	import supabaseAPI from '$lib/supabase-api.js';

	/**
	 * Solve math/statistics problem with step-by-step solution
	 */
	async function solveProblem() {
		if (!input.trim()) return;

		loading = true;
		error = '';
		result = null;

		try {
			const data = await supabaseAPI.mathSolver.solve(input, true);
			result = data;
			dispatch('solved', { problem: input, solution: data });
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to solve problem';
		} finally {
			loading = false;
		}
	}

	function clearInput() {
		input = '';
		result = null;
		error = '';
	}

	/**
	 * @param {KeyboardEvent} e
	 */
	function handleKeydown(e) {
		if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			solveProblem();
		}
	}
</script>

<div class="bg-white rounded-lg shadow-md border border-gray-200 p-6">
	<!-- Header -->
	<div class="flex items-center gap-3 mb-4">
		<span class="text-3xl">🧮</span>
		<div>
			<h3 class="text-xl font-semibold text-gray-900">Math Problem Solver</h3>
			<p class="text-sm text-gray-500">Get step-by-step solutions to math and statistics problems</p>
		</div>
	</div>

	<!-- Input Area -->
	<div class="mb-4">
		<label for="problem-input" class="block text-sm font-medium text-gray-700 mb-2">
			Enter your problem:
		</label>
		<textarea
			id="problem-input"
			bind:value={input}
			on:keydown={handleKeydown}
			placeholder="Example: Calculate the standard deviation of [5, 10, 15, 20, 25]

Or: Solve the quadratic equation 2x² + 5x - 3 = 0

Or: Find the derivative of f(x) = 3x² + 2x + 1"
			rows="4"
			class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg resize-y
				focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
				transition-all text-gray-900 placeholder-gray-400 text-sm"
		></textarea>
		<p class="text-xs text-gray-500 mt-2">💡 Tip: Press Cmd/Ctrl + Enter to solve</p>
	</div>

	<!-- Action Buttons -->
	<div class="flex gap-3 mb-6">
		<button
			on:click={solveProblem}
			disabled={!input.trim() || loading}
			class="flex-1 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg
				hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 
				focus:ring-offset-2 transition-all
				disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-600"
		>
			{loading ? 'Solving...' : 'Solve Problem'}
		</button>
		{#if input || result}
			<button
				on:click={clearInput}
				class="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg
					hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 
					focus:ring-offset-2 transition-all"
			>
				Clear
			</button>
		{/if}
	</div>

	<!-- Error Display -->
	{#if error}
		<div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
			<div class="flex items-start gap-3">
				<span class="text-xl">⚠️</span>
				<div class="flex-1">
					<p class="text-sm font-medium text-red-800">Error</p>
					<p class="text-sm text-red-700 mt-1">{error}</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Loading State -->
	{#if loading}
		<div class="flex items-center justify-center py-8">
			<div class="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600"></div>
		</div>
	{/if}

	<!-- Result Display -->
	{#if result && !loading}
		<div class="space-y-4">
			<!-- Final Answer -->
			{#if result.answer}
				<div class="bg-green-50 border-2 border-green-300 rounded-lg p-4">
					<div class="flex items-start gap-3">
						<span class="text-2xl">✓</span>
						<div class="flex-1">
							<h4 class="text-sm font-semibold text-green-900 mb-2">Answer:</h4>
							<p class="text-lg font-medium text-green-800">{result.answer}</p>
						</div>
					</div>
				</div>
			{/if}

			<!-- Step-by-Step Solution -->
			{#if result.steps && result.steps.length > 0}
				<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
					<h4 class="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
						<span class="text-xl">📝</span>
						Step-by-Step Solution:
					</h4>
					<ol class="space-y-3">
						{#each result.steps as step, index}
							<li class="bg-white rounded p-3 border border-blue-100">
								<div class="flex gap-3">
									<span class="shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
										{index + 1}
									</span>
									<div class="flex-1">
										<p class="text-sm text-gray-900">{step.description}</p>
										{#if step.calculation}
											<div class="mt-2 p-2 bg-gray-50 rounded font-mono text-sm text-gray-700">
												{step.calculation}
											</div>
										{/if}
										{#if step.result}
											<p class="mt-2 text-sm font-medium text-blue-700">
												Result: {step.result}
											</p>
										{/if}
									</div>
								</div>
							</li>
						{/each}
					</ol>
				</div>
			{/if}

			<!-- Explanation -->
			{#if result.explanation}
				<div class="bg-amber-50 border border-amber-200 rounded-lg p-4">
					<h4 class="text-sm font-semibold text-amber-900 mb-2 flex items-center gap-2">
						<span class="text-xl">💡</span>
						Explanation:
					</h4>
					<p class="text-sm text-gray-700 leading-relaxed">{result.explanation}</p>
				</div>
			{/if}

			<!-- Related Concepts -->
			{#if result.concepts && result.concepts.length > 0}
				<div class="border-t border-gray-200 pt-4">
					<h4 class="text-sm font-medium text-gray-700 mb-2">Related Concepts:</h4>
					<div class="flex flex-wrap gap-2">
						{#each result.concepts as concept}
							<span class="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
								{concept}
							</span>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Formulas Used -->
			{#if result.formulas && result.formulas.length > 0}
				<div class="border-t border-gray-200 pt-4">
					<h4 class="text-sm font-medium text-gray-700 mb-2">Formulas Used:</h4>
					<div class="space-y-2">
						{#each result.formulas as formula}
							<div class="bg-gray-50 rounded p-3 font-mono text-sm text-gray-700">
								{formula}
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Help Section -->
	{#if !result && !loading}
		<div class="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
			<h4 class="text-sm font-medium text-gray-700 mb-2">Supported Problem Types:</h4>
			<ul class="text-xs text-gray-600 space-y-1 list-disc list-inside">
				<li>Algebra: Equations, inequalities, systems of equations</li>
				<li>Calculus: Derivatives, integrals, limits</li>
				<li>Statistics: Mean, median, standard deviation, confidence intervals</li>
				<li>Probability: Combinations, permutations, distributions</li>
				<li>Linear Algebra: Matrices, vectors, eigenvalues</li>
				<li>Trigonometry: Identities, equations, unit circle</li>
				<li>Geometry: Area, volume, perimeter calculations</li>
			</ul>
		</div>
	{/if}
</div>

<style>
	/* Custom scrollbar for textarea */
	textarea::-webkit-scrollbar {
		width: 8px;
	}

	textarea::-webkit-scrollbar-track {
		background: #f1f1f1;
		border-radius: 4px;
	}

	textarea::-webkit-scrollbar-thumb {
		background: #888;
		border-radius: 4px;
	}

	textarea::-webkit-scrollbar-thumb:hover {
		background: #555;
	}
</style>
