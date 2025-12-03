<script>
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	/** @type {{ id: number; title: string; created_at: string; topic_count?: number; mastery_percentage?: number; }} */
	export let guide;

	/**
	 * @param {string} dateString
	 */
	function formatDate(dateString) {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function handleStudy() {
		dispatch('study', { guideId: guide.id });
	}

	function handleViewDetails() {
		dispatch('viewDetails', { guideId: guide.id });
	}

	function handleDelete() {
		if (confirm(`Are you sure you want to delete "${guide.title}"?`)) {
			dispatch('delete', { guideId: guide.id });
		}
	}

	function handleProcess() {
		dispatch('process', { guideId: guide.id });
	}

	$: masteryPercentage = guide.mastery_percentage || 0;
	$: topicCount = guide.topic_count || 0;
	$: needsProcessing = topicCount === 0;
</script>

<div class="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
	<div class="p-6">
		<!-- Header -->
		<div class="flex items-start justify-between mb-4">
			<div class="flex-1">
				<h3 class="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
					{guide.title}
				</h3>
				<p class="text-sm text-gray-500">
					Uploaded {formatDate(guide.created_at)}
				</p>
			</div>
			<div class="text-3xl ml-2">📚</div>
		</div>

		<!-- Stats -->
		<div class="flex items-center gap-4 mb-4">
			<div class="flex items-center text-sm text-gray-600">
				<span class="mr-1">📝</span>
				<span>{topicCount} {topicCount === 1 ? 'topic' : 'topics'}</span>
			</div>
			<div class="flex items-center text-sm text-gray-600">
				<span class="mr-1">🎯</span>
				<span>{masteryPercentage}% mastery</span>
			</div>
		</div>

		<!-- Progress bar -->
		<div class="mb-6">
			<div class="flex items-center justify-between mb-1">
				<span class="text-xs font-medium text-gray-700">Overall Progress</span>
				<span class="text-xs font-medium text-gray-700">{masteryPercentage}%</span>
			</div>
			<div class="w-full bg-gray-200 rounded-full h-2">
				<div
					class="h-2 rounded-full transition-all duration-500 {masteryPercentage >= 80
						? 'bg-green-500'
						: masteryPercentage >= 50
							? 'bg-yellow-500'
							: 'bg-indigo-600'}"
					style="width: {masteryPercentage}%"
				></div>
			</div>
		</div>

		<!-- Actions -->
		<div class="flex flex-wrap gap-2">
			{#if needsProcessing}
				<button
					on:click={handleProcess}
					class="flex-1 px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-md 
						hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 
						focus:ring-offset-2 transition-colors"
				>
					🤖 Generate Topics
				</button>
			{:else}
				<button
					on:click={handleStudy}
					class="flex-1 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md 
						hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 
						focus:ring-offset-2 transition-colors"
				>
					Study Now
				</button>
			{/if}
			<button
				on:click={handleViewDetails}
				class="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md 
					hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 
					focus:ring-offset-2 transition-colors"
				title="View Details"
			>
				<span class="text-lg">👁️</span>
			</button>
			<button
				on:click={handleDelete}
				class="px-4 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-md 
					hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 
					focus:ring-offset-2 transition-colors"
				title="Delete"
			>
				<span class="text-lg">🗑️</span>
			</button>
		</div>
	</div>
</div>

<style>
	.line-clamp-2 {
		display: -webkit-box;
		line-clamp: 2;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
