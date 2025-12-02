<script>
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	/** @type {Array<{ session_id: number; guide_title: string; topic: string; problems_attempted: number; correct_answers: number; session_date: string; duration_minutes: number }>} */
	export let sessions;

	/** @type {string} */
	export let selectedGuide = 'all';

	/** @type {number | null} */
	let expandedSessionId = null;

	/**
	 * @param {number} sessionId
	 */
	function toggleExpand(sessionId) {
		expandedSessionId = expandedSessionId === sessionId ? null : sessionId;
	}

	/**
	 * @param {string} dateString
	 */
	function formatDate(dateString) {
		const date = new Date(dateString);
		const now = new Date();
		const diffTime = Math.abs(now.getTime() - date.getTime());
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

		if (diffDays === 0) return 'Today';
		if (diffDays === 1) return 'Yesterday';
		if (diffDays < 7) return `${diffDays} days ago`;
		
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	/**
	 * @param {number} minutes
	 */
	function formatDuration(minutes) {
		if (minutes < 60) return `${minutes}m`;
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return `${hours}h ${mins}m`;
	}

	/**
	 * @param {number} correct
	 * @param {number} total
	 */
	function getAccuracyColor(correct, total) {
		const accuracy = (correct / total) * 100;
		if (accuracy >= 75) return 'text-green-600 bg-green-50';
		if (accuracy >= 50) return 'text-yellow-600 bg-yellow-50';
		return 'text-red-600 bg-red-50';
	}

	// Filter sessions by selected guide
	$: filteredSessions = selectedGuide === 'all' 
		? sessions 
		: sessions.filter(s => s.guide_title === selectedGuide);

	// Get unique guide titles for filter
	$: guideOptions = ['all', ...new Set(sessions.map(s => s.guide_title))];
</script>

<div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
	<div class="flex items-center justify-between mb-6">
		<div>
			<h3 class="text-lg font-semibold text-gray-900">Session History</h3>
			<p class="text-sm text-gray-600 mt-1">Your recent practice sessions</p>
		</div>
		<span class="text-3xl">📖</span>
	</div>

	<!-- Filter -->
	{#if guideOptions.length > 2}
		<div class="mb-4">
			<label for="guide-filter" class="block text-sm font-medium text-gray-700 mb-2">
				Filter by Guide
			</label>
			<select
				id="guide-filter"
				bind:value={selectedGuide}
				class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
			>
				<option value="all">All Guides</option>
				{#each guideOptions.slice(1) as guide}
					<option value={guide}>{guide}</option>
				{/each}
			</select>
		</div>
	{/if}

	<!-- Sessions List -->
	<div class="space-y-3">
		{#each filteredSessions as session (session.session_id)}
			<div class="border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors">
				<button
					on:click={() => toggleExpand(session.session_id)}
					class="w-full p-4 text-left"
				>
					<div class="flex items-center justify-between">
						<div class="flex-1">
							<div class="flex items-center gap-2 mb-1">
								<h4 class="font-medium text-gray-900">{session.topic}</h4>
								<span class="text-xs text-gray-500">•</span>
								<span class="text-xs text-gray-500">{formatDate(session.session_date)}</span>
							</div>
							<div class="text-sm text-gray-600">{session.guide_title}</div>
						</div>
						<div class="flex items-center gap-3">
							<div class="text-center">
								<div class="text-lg font-semibold {getAccuracyColor(session.correct_answers, session.problems_attempted)}
									px-3 py-1 rounded-lg">
									{session.correct_answers}/{session.problems_attempted}
								</div>
								<div class="text-xs text-gray-500 mt-1">
									{((session.correct_answers / session.problems_attempted) * 100).toFixed(0)}%
								</div>
							</div>
							<svg
								class="w-5 h-5 text-gray-400 transition-transform duration-200 {expandedSessionId === session.session_id ? 'rotate-180' : ''}"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
							</svg>
						</div>
					</div>
				</button>

				{#if expandedSessionId === session.session_id}
					<div class="px-4 pb-4 border-t border-gray-100 pt-4 animate-slideDown">
						<div class="grid grid-cols-3 gap-4 text-sm">
							<div>
								<div class="text-gray-500 text-xs uppercase tracking-wide mb-1">Duration</div>
								<div class="font-medium text-gray-900 flex items-center gap-1">
									<span>⏱️</span>
									{formatDuration(session.duration_minutes)}
								</div>
							</div>
							<div>
								<div class="text-gray-500 text-xs uppercase tracking-wide mb-1">Problems</div>
								<div class="font-medium text-gray-900 flex items-center gap-1">
									<span>📝</span>
									{session.problems_attempted}
								</div>
							</div>
							<div>
								<div class="text-gray-500 text-xs uppercase tracking-wide mb-1">Accuracy</div>
								<div class="font-medium text-gray-900 flex items-center gap-1">
									<span>🎯</span>
									{((session.correct_answers / session.problems_attempted) * 100).toFixed(0)}%
								</div>
							</div>
						</div>
					</div>
				{/if}
			</div>
		{/each}

		{#if filteredSessions.length === 0}
			<div class="text-center py-8">
				<span class="text-4xl mb-3 block">📝</span>
				<p class="text-gray-600">
					{selectedGuide === 'all' ? 'No practice sessions yet. Start practicing!' : 'No sessions for this guide yet.'}
				</p>
			</div>
		{/if}
	</div>
</div>

<style>
	@keyframes slideDown {
		from {
			opacity: 0;
			max-height: 0;
		}
		to {
			opacity: 1;
			max-height: 200px;
		}
	}

	.animate-slideDown {
		animation: slideDown 0.2s ease-out;
	}
</style>
