<script>
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	/** @type {{ id: number; title: string; topics?: any[]; sessions?: any[]; }} */
	export let guide;
	export let loading = false;

	/** @type {Set<number>} */
	let selectedTopics = new Set();
	let selectAll = false;

	/**
	 * @param {string} dateString
	 */
	function formatDate(dateString) {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	/**
	 * @param {number} correct
	 * @param {number} total
	 */
	function calculateAccuracy(correct, total) {
		if (!total) return 0;
		return Math.round((correct / total) * 100);
	}

	/**
	 * @param {number} topicId
	 */
	function toggleTopic(topicId) {
		if (selectedTopics.has(topicId)) {
			selectedTopics.delete(topicId);
		} else {
			selectedTopics.add(topicId);
		}
		selectedTopics = selectedTopics;
		selectAll = selectedTopics.size === (guide.topics?.length || 0);
	}

	function toggleSelectAll() {
		selectAll = !selectAll;
		if (selectAll) {
			selectedTopics = new Set(guide.topics?.map(t => t.id) || []);
		} else {
			selectedTopics.clear();
		}
		selectedTopics = selectedTopics;
	}

	function startPractice() {
		if (selectAll || selectedTopics.size === 0) {
			dispatch('startPractice', { guideId: guide.id, topicIds: [] });
		} else {
			dispatch('startPractice', { guideId: guide.id, topicIds: Array.from(selectedTopics) });
		}
	}

	function handleBack() {
		dispatch('back');
	}

	$: topics = guide.topics || [];
	$: sessions = guide.sessions || [];
</script>

<div class="bg-white rounded-lg shadow-sm border border-gray-200">
	<!-- Header -->
	<div class="px-6 py-4 border-b border-gray-200">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-3">
				<button
					on:click={handleBack}
					class="text-gray-400 hover:text-gray-600 transition-colors"
					title="Back to guides"
				>
					<span class="text-2xl">←</span>
				</button>
				<div>
					<h2 class="text-2xl font-bold text-gray-900">{guide.title}</h2>
					<p class="text-sm text-gray-500 mt-1">
						{topics.length} {topics.length === 1 ? 'topic' : 'topics'} available
					</p>
				</div>
			</div>
			<div class="text-4xl">📚</div>
		</div>
	</div>

	{#if loading}
		<div class="px-6 py-12 flex justify-center">
			<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
		</div>
	{:else}
		<div class="p-6 space-y-6">
			<!-- Topics Section -->
			<div>
				<div class="flex items-center justify-between mb-4">
					<h3 class="text-lg font-semibold text-gray-900">Topics</h3>
					<label class="flex items-center gap-2 cursor-pointer">
						<input
							type="checkbox"
							checked={selectAll}
							on:change={toggleSelectAll}
							class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
						/>
						<span class="text-sm text-gray-700">Select all</span>
					</label>
				</div>

				{#if topics.length === 0}
					<div class="text-center py-8 text-gray-500">
						<div class="text-4xl mb-2">📝</div>
						<p>No topics found for this guide</p>
					</div>
				{:else}
					<div class="space-y-2 mb-6">
						{#each topics as topic}
							<div
								class="flex items-center justify-between p-4 border border-gray-200 rounded-lg 
									hover:bg-gray-50 transition-colors cursor-pointer"
								on:click={() => toggleTopic(topic.id)}
								on:keypress={(e) => e.key === 'Enter' && toggleTopic(topic.id)}
								role="button"
								tabindex="0"
							>
								<div class="flex items-center gap-3 flex-1">
									<input
										type="checkbox"
										checked={selectedTopics.has(topic.id)}
										on:change={() => toggleTopic(topic.id)}
										class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
										on:click={(e) => e.stopPropagation()}
									/>
									<div class="flex-1">
										<h4 class="font-medium text-gray-900">{topic.name}</h4>
										{#if topic.mastery_level !== undefined}
											<div class="flex items-center gap-2 mt-1">
												<div class="flex-1 max-w-xs bg-gray-200 rounded-full h-1.5">
													<div
														class="h-1.5 rounded-full {topic.mastery_level >= 80
															? 'bg-green-500'
															: topic.mastery_level >= 50
																? 'bg-yellow-500'
																: 'bg-indigo-600'}"
														style="width: {topic.mastery_level}%"
													></div>
												</div>
												<span class="text-xs text-gray-600">{topic.mastery_level}%</span>
											</div>
										{/if}
									</div>
								</div>
								<div class="text-sm text-gray-500">
									{topic.problem_count || 0} {topic.problem_count === 1 ? 'problem' : 'problems'}
								</div>
							</div>
						{/each}
					</div>

					<!-- Start Practice Button -->
					<button
						on:click={startPractice}
						disabled={!selectAll && selectedTopics.size === 0}
						class="w-full px-6 py-3 bg-indigo-600 text-white font-medium rounded-md 
							hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 
							focus:ring-offset-2 transition-colors disabled:opacity-50 
							disabled:cursor-not-allowed disabled:hover:bg-indigo-600"
					>
						{selectAll || selectedTopics.size === 0
							? 'Start Practice - All Topics'
							: `Start Practice - ${selectedTopics.size} ${selectedTopics.size === 1 ? 'Topic' : 'Topics'}`}
					</button>
				{/if}
			</div>

			<!-- Recent Sessions Section -->
			<div>
				<h3 class="text-lg font-semibold text-gray-900 mb-4">Recent Sessions</h3>
				
				{#if sessions.length === 0}
					<div class="text-center py-8 border border-gray-200 rounded-lg bg-gray-50">
						<div class="text-4xl mb-2">🎯</div>
						<p class="text-gray-600">No practice sessions yet</p>
						<p class="text-sm text-gray-500 mt-1">Start your first session above</p>
					</div>
				{:else}
					<div class="space-y-2">
						{#each sessions.slice(0, 5) as session}
							<div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
								<div class="flex-1">
									<p class="text-sm font-medium text-gray-900">
										{formatDate(session.started_at)}
									</p>
									{#if session.completed_at}
										<p class="text-xs text-gray-500 mt-1">
											{session.correct_count || 0} / {session.total_count || 0} correct
											({calculateAccuracy(session.correct_count, session.total_count)}%)
										</p>
									{/if}
								</div>
								<div>
									{#if session.completed_at}
										<span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
											Completed
										</span>
									{:else}
										<a
											href="/practice/{session.id}"
											class="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium 
												hover:bg-yellow-200 transition-colors"
										>
											Continue
										</a>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
