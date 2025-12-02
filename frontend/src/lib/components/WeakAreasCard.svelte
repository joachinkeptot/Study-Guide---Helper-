<script>
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	/** @type {Array<{ topic: string; confidence: number; guide_id: number; guide_title: string; problems_count: number }>} */
	export let weakAreas;

	/** @type {number} */
	export let displayLimit = 5;

	/**
	 * @param {number} guideId
	 * @param {string} topic
	 */
	function handlePractice(guideId, topic) {
		dispatch('practice', { guideId, topic });
	}

	/**
	 * @param {number} confidence
	 */
	function getMotivationalMessage(confidence) {
		if (confidence < 30) return "You've got this! 💪";
		if (confidence < 50) return "Keep practicing! 📚";
		return "Almost there! 🌟";
	}

	$: displayedAreas = weakAreas.slice(0, displayLimit);
</script>

<div class="bg-linear-to-br from-red-50 to-orange-50 rounded-xl p-6 shadow-sm border border-red-100">
	<div class="flex items-center justify-between mb-6">
		<div>
			<h3 class="text-lg font-semibold text-gray-900">Focus Areas</h3>
			<p class="text-sm text-gray-600 mt-1">Topics that need more practice</p>
		</div>
		<span class="text-3xl">🎯</span>
	</div>

	{#if displayedAreas.length > 0}
		<div class="space-y-3">
			{#each displayedAreas as area (area.topic)}
				<div class="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-all">
					<div class="flex items-start justify-between gap-4">
						<div class="flex-1">
							<div class="flex items-center gap-2 mb-1">
								<span class="text-lg">💪</span>
								<h4 class="font-medium text-gray-900">{area.topic}</h4>
							</div>
							<div class="text-xs text-gray-500 mb-2">{area.guide_title}</div>
							
							<!-- Confidence Bar -->
							<div class="flex items-center gap-3 mb-2">
								<div class="flex-1">
									<div class="w-full bg-gray-200 rounded-full h-2">
										<div
											class="bg-red-500 h-2 rounded-full transition-all duration-300"
											style="width: {area.confidence}%"
										></div>
									</div>
								</div>
								<span class="text-sm font-medium text-gray-900 min-w-12 text-right">
									{area.confidence.toFixed(0)}%
								</span>
							</div>

							<div class="flex items-center justify-between">
								<span class="text-xs text-gray-600">
									{area.problems_count} {area.problems_count === 1 ? 'problem' : 'problems'}
								</span>
								<span class="text-xs font-medium text-orange-600">
									{getMotivationalMessage(area.confidence)}
								</span>
							</div>
						</div>

						<button
							on:click={() => handlePractice(area.guide_id, area.topic)}
							class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg
								hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 
								focus:ring-offset-2 transition-all shadow-sm hover:shadow shrink-0"
						>
							Practice
						</button>
					</div>
				</div>
			{/each}
		</div>

		{#if weakAreas.length > displayLimit}
			<div class="mt-4 text-center">
				<button
					on:click={() => dispatch('showMore')}
					class="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
				>
					View {weakAreas.length - displayLimit} more →
				</button>
			</div>
		{/if}
	{:else}
		<div class="bg-white rounded-lg p-8 text-center">
			<span class="text-4xl mb-3 block">🎉</span>
			<h4 class="font-medium text-gray-900 mb-2">Great Job!</h4>
			<p class="text-sm text-gray-600">
				You don't have any weak areas right now. Keep up the excellent work!
			</p>
		</div>
	{/if}
</div>

<style>
	/* Add hover effect to practice buttons */
	button:hover {
		transform: translateY(-1px);
	}
	
	button:active {
		transform: translateY(0);
	}
</style>
