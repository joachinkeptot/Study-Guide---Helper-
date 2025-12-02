<script>
	/** @type {Array<{ topic: string; confidence: number; problems_count: number }>} */
	export let topics;

	/**
	 * @param {number} confidence
	 */
	function getConfidenceColor(confidence) {
		if (confidence >= 75) return 'bg-green-500';
		if (confidence >= 50) return 'bg-yellow-500';
		return 'bg-red-500';
	}

	/**
	 * @param {number} confidence
	 */
	function getConfidenceLabel(confidence) {
		if (confidence >= 75) return 'Mastered';
		if (confidence >= 50) return 'Learning';
		return 'Needs Work';
	}

	/**
	 * @param {number} confidence
	 */
	function getConfidenceEmoji(confidence) {
		if (confidence >= 75) return '🌟';
		if (confidence >= 50) return '📚';
		return '💪';
	}

	// Sort topics by confidence (ascending) to show areas needing work first
	$: sortedTopics = [...topics].sort((a, b) => a.confidence - b.confidence);
</script>

<div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
	<div class="flex items-center justify-between mb-6">
		<div>
			<h3 class="text-lg font-semibold text-gray-900">Topic Mastery</h3>
			<p class="text-sm text-gray-600 mt-1">Your progress across all topics</p>
		</div>
		<span class="text-3xl">📊</span>
	</div>

	<div class="space-y-4">
		{#each sortedTopics as topic (topic.topic)}
			<div class="group">
				<div class="flex items-center justify-between mb-2">
					<div class="flex items-center gap-2">
						<span class="text-lg">{getConfidenceEmoji(topic.confidence)}</span>
						<div>
							<div class="font-medium text-gray-900">{topic.topic}</div>
							<div class="text-xs text-gray-500">
								{topic.problems_count} {topic.problems_count === 1 ? 'problem' : 'problems'}
							</div>
						</div>
					</div>
					<div class="text-right">
						<div class="text-sm font-semibold text-gray-900">{topic.confidence.toFixed(0)}%</div>
						<div class="text-xs text-gray-500">{getConfidenceLabel(topic.confidence)}</div>
					</div>
				</div>
				<div class="relative w-full bg-gray-200 rounded-full h-3 overflow-hidden">
					<div
						class="{getConfidenceColor(topic.confidence)} h-3 rounded-full transition-all duration-500 ease-out group-hover:opacity-90"
						style="width: {topic.confidence}%"
					></div>
				</div>
			</div>
		{/each}

		{#if sortedTopics.length === 0}
			<div class="text-center py-8">
				<span class="text-4xl mb-3 block">📚</span>
				<p class="text-gray-600">Start practicing to see your topic mastery!</p>
			</div>
		{/if}
	</div>

	<!-- Legend -->
	{#if sortedTopics.length > 0}
		<div class="mt-6 pt-6 border-t border-gray-200">
			<div class="flex items-center justify-center gap-6 text-sm">
				<div class="flex items-center gap-2">
					<div class="w-3 h-3 rounded-full bg-red-500"></div>
					<span class="text-gray-600">Needs Work (&lt;50%)</span>
				</div>
				<div class="flex items-center gap-2">
					<div class="w-3 h-3 rounded-full bg-yellow-500"></div>
					<span class="text-gray-600">Learning (50-74%)</span>
				</div>
				<div class="flex items-center gap-2">
					<div class="w-3 h-3 rounded-full bg-green-500"></div>
					<span class="text-gray-600">Mastered (≥75%)</span>
				</div>
			</div>
		</div>
	{/if}
</div>
