<script>
	import { onMount } from 'svelte';
	import supabaseAPI from '$lib/supabase-api.js';

	/** @type {{ currentStreak: number; longestStreak: number; questionsToday: number; dailyGoal: number; } | null} */
	export let stats = null;
	
	let loading = true;

	onMount(async () => {
		await loadStats();
	});

	async function loadStats() {
		loading = true;
		try {
			const data = await supabaseAPI.getUserStats();
			stats = data;
		} catch (err) {
			console.error('Failed to load streak stats:', err);
			// Set default stats on error so UI doesn't break
			stats = {
				currentStreak: 0,
				longestStreak: 0,
				questionsToday: 0,
				dailyGoal: 10
			};
		} finally {
			loading = false;
		}
	}

	$: progressPercent = stats ? Math.min((stats.questionsToday / stats.dailyGoal) * 100, 100) : 0;
	$: isGoalMet = stats && stats.questionsToday >= stats.dailyGoal;
</script>

<div class="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200 p-4">
	{#if loading}
		<div class="animate-pulse flex space-x-4">
			<div class="h-12 w-12 bg-orange-200 rounded-lg"></div>
			<div class="flex-1 space-y-2">
				<div class="h-4 bg-orange-200 rounded w-3/4"></div>
				<div class="h-3 bg-orange-200 rounded w-1/2"></div>
			</div>
		</div>
	{:else if stats}
		<div class="flex items-center justify-between">
			<!-- Streak Display -->
			<div class="flex items-center gap-4">
				<div class="text-4xl">
					{#if stats.currentStreak >= 7}
						🔥
					{:else if stats.currentStreak >= 3}
						⚡
					{:else}
						📚
					{/if}
				</div>
				<div>
					<div class="flex items-baseline gap-2">
						<span class="text-2xl font-bold text-gray-900">{stats.currentStreak}</span>
						<span class="text-sm text-gray-600">day streak</span>
					</div>
					<p class="text-xs text-gray-500">
						Best: {stats.longestStreak} days
					</p>
				</div>
			</div>

			<!-- Daily Goal Progress -->
			<div class="flex-1 max-w-xs ml-6">
				<div class="flex items-center justify-between mb-1">
					<span class="text-xs font-medium text-gray-700">Daily Goal</span>
					<span class="text-xs text-gray-600">
						{stats.questionsToday}/{stats.dailyGoal}
					</span>
				</div>
				<div class="w-full bg-orange-200 rounded-full h-2">
					<div
						class="h-2 rounded-full transition-all duration-500 {isGoalMet ? 'bg-green-500' : 'bg-orange-500'}"
						style="width: {progressPercent}%"
					></div>
				</div>
				{#if isGoalMet}
					<p class="text-xs text-green-600 font-medium mt-1">🎉 Goal achieved!</p>
				{:else}
					<p class="text-xs text-gray-500 mt-1">
						{stats.dailyGoal - stats.questionsToday} more to go!
					</p>
				{/if}
			</div>
		</div>
	{/if}
</div>
