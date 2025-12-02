<script>
	/** @type {{ total_problems: number; weekly_problems: number; overall_accuracy: number; streak_days: number; total_time_minutes: number }} */
	export let stats;

	/**
	 * @param {number} minutes
	 */
	function formatStudyTime(minutes) {
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		if (hours > 0) {
			return `${hours}h ${mins}m`;
		}
		return `${mins}m`;
	}
</script>

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
	<!-- Total Problems -->
	<div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
		<div class="flex items-center justify-between mb-2">
			<span class="text-3xl">📝</span>
			<span class="text-xs font-medium text-gray-500 uppercase tracking-wide">All Time</span>
		</div>
		<div class="mt-3">
			<div class="text-3xl font-bold text-gray-900">{stats.total_problems}</div>
			<div class="text-sm text-gray-600 mt-1">Problems Practiced</div>
			<div class="text-xs text-indigo-600 font-medium mt-2">
				+{stats.weekly_problems} this week
			</div>
		</div>
	</div>

	<!-- Accuracy -->
	<div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
		<div class="flex items-center justify-between mb-2">
			<span class="text-3xl">🎯</span>
			<span class="text-xs font-medium text-gray-500 uppercase tracking-wide">Accuracy</span>
		</div>
		<div class="mt-3">
			<div class="text-3xl font-bold text-gray-900">{stats.overall_accuracy.toFixed(0)}%</div>
			<div class="text-sm text-gray-600 mt-1">Overall Score</div>
			<div class="mt-3 w-full bg-gray-200 rounded-full h-2">
				<div
					class="h-2 rounded-full transition-all duration-300 {stats.overall_accuracy >= 70 ? 'bg-green-500' : stats.overall_accuracy >= 50 ? 'bg-yellow-500' : 'bg-red-500'}"
					style="width: {stats.overall_accuracy}%"
				></div>
			</div>
		</div>
	</div>

	<!-- Streak -->
	<div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
		<div class="flex items-center justify-between mb-2">
			<span class="text-3xl">🔥</span>
			<span class="text-xs font-medium text-gray-500 uppercase tracking-wide">Streak</span>
		</div>
		<div class="mt-3">
			<div class="text-3xl font-bold text-gray-900">{stats.streak_days}</div>
			<div class="text-sm text-gray-600 mt-1">
				{stats.streak_days === 1 ? 'Day' : 'Days'} in a row
			</div>
			{#if stats.streak_days >= 7}
				<div class="text-xs text-orange-600 font-medium mt-2">
					🎉 You're on fire!
				</div>
			{:else if stats.streak_days >= 3}
				<div class="text-xs text-orange-600 font-medium mt-2">
					💪 Keep it up!
				</div>
			{:else}
				<div class="text-xs text-gray-500 mt-2">
					Stay consistent!
				</div>
			{/if}
		</div>
	</div>

	<!-- Study Time -->
	<div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
		<div class="flex items-center justify-between mb-2">
			<span class="text-3xl">⏱️</span>
			<span class="text-xs font-medium text-gray-500 uppercase tracking-wide">Study Time</span>
		</div>
		<div class="mt-3">
			<div class="text-3xl font-bold text-gray-900">{formatStudyTime(stats.total_time_minutes)}</div>
			<div class="text-sm text-gray-600 mt-1">Total Time</div>
			<div class="text-xs text-gray-500 mt-2">
				Keep learning!
			</div>
		</div>
	</div>
</div>
