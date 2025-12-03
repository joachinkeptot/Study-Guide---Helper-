<script>
	import { createEventDispatcher } from 'svelte';
	import api from '$lib/api.js';

	/** @type {number} */
	export let guideId;
	export let show = false;

	const dispatch = createEventDispatcher();

	let topicName = '';
	let description = '';
	let generateProblems = true;
	let numProblems = 5;
	let difficulty = 'intermediate';
	let loading = false;
	let error = '';

	async function handleSubmit() {
		if (!topicName.trim()) {
			error = 'Topic name is required';
			return;
		}

		loading = true;
		error = '';

		try {
			const response = await api.post(`/api/guides/${guideId}/topics`, {
				name: topicName.trim(),
				description: description.trim(),
				generate_problems: generateProblems,
				num_problems: numProblems,
				difficulty: difficulty
			});

			dispatch('topicAdded', response.topic);
			close();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to add topic';
		} finally {
			loading = false;
		}
	}

	function close() {
		show = false;
		topicName = '';
		description = '';
		generateProblems = true;
		numProblems = 5;
		difficulty = 'intermediate';
		error = '';
		dispatch('close');
	}

	/**
	 * @param {MouseEvent} event
	 */
	function handleBackdropClick(event) {
		if (event.target === event.currentTarget) {
			close();
		}
	}
</script>

{#if show}
	<!-- Modal backdrop -->
	<div
		class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-40"
		on:click={handleBackdropClick}
		on:keydown={(e) => e.key === 'Escape' && close()}
		role="button"
		tabindex="0"
		aria-label="Close modal"
	></div>

	<!-- Modal -->
	<div class="fixed inset-0 z-50 overflow-y-auto">
		<div class="flex min-h-full items-center justify-center p-4">
			<div class="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
				<!-- Header -->
				<div class="flex justify-between items-center mb-4">
					<h3 class="text-lg font-semibold text-gray-900">Add New Topic</h3>
					<button
						on:click={close}
						class="text-gray-400 hover:text-gray-600 transition-colors"
						aria-label="Close"
					>
						<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>

				{#if error}
					<div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
						<p class="text-sm text-red-800">{error}</p>
					</div>
				{/if}

				<!-- Form -->
				<form on:submit|preventDefault={handleSubmit} class="space-y-4">
					<!-- Topic Name -->
					<div>
						<label for="topic-name" class="block text-sm font-medium text-gray-700 mb-1">
							Topic Name <span class="text-red-500">*</span>
						</label>
						<input
							id="topic-name"
							type="text"
							bind:value={topicName}
							placeholder="e.g., Probability Basics, Calculus Review"
							required
							class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
								focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
						/>
					</div>

					<!-- Description -->
					<div>
						<label for="description" class="block text-sm font-medium text-gray-700 mb-1">
							Description (Optional)
						</label>
						<textarea
							id="description"
							bind:value={description}
							placeholder="Brief description of what this topic covers..."
							rows="3"
							class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
								focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
						></textarea>
					</div>

					<!-- Generate Problems Toggle -->
					<div class="flex items-start">
						<div class="flex items-center h-5">
							<input
								id="generate-problems"
								type="checkbox"
								bind:checked={generateProblems}
								class="w-4 h-4 text-indigo-600 border-gray-300 rounded 
									focus:ring-indigo-500 focus:ring-2"
							/>
						</div>
						<div class="ml-3">
							<label for="generate-problems" class="font-medium text-gray-700">
								Auto-generate practice problems
							</label>
							<p class="text-sm text-gray-500">
								Use AI to create practice problems for this topic
							</p>
						</div>
					</div>

					{#if generateProblems}
						<div class="ml-7 space-y-4 pl-4 border-l-2 border-indigo-100">
							<!-- Number of Problems -->
							<div>
								<label for="num-problems" class="block text-sm font-medium text-gray-700 mb-1">
									Number of Problems
								</label>
								<select
									id="num-problems"
									bind:value={numProblems}
									class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
										focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
								>
									<option value={3}>3 problems</option>
									<option value={5}>5 problems</option>
									<option value={10}>10 problems</option>
								</select>
							</div>

							<!-- Difficulty -->
							<div>
								<label for="difficulty" class="block text-sm font-medium text-gray-700 mb-1">
									Difficulty Level
								</label>
								<select
									id="difficulty"
									bind:value={difficulty}
									class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
										focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
								>
									<option value="beginner">Beginner</option>
									<option value="intermediate">Intermediate</option>
									<option value="advanced">Advanced</option>
								</select>
							</div>
						</div>
					{/if}

					<!-- Actions -->
					<div class="flex justify-end gap-3 pt-4">
						<button
							type="button"
							on:click={close}
							disabled={loading}
							class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border 
								border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none 
								focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 
								disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={loading || !topicName.trim()}
							class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 
								rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 
								focus:ring-offset-2 focus:ring-indigo-500 
								disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{loading ? 'Adding...' : 'Add Topic'}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}
