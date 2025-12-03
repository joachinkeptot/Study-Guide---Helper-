<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { auth } from '$stores/auth-supabase';
	import api from '$lib/api.js';
	import LoadingSkeleton from '$lib/components/LoadingSkeleton.svelte';

	/** @type {any} */
	let progress = null;
	/** @type {any[]} */
	let sessions = [];
	let loading = true;
	let error = '';

	// Protect route
	$: if (!$auth.isAuthenticated) {
		goto('/login');
	}

	onMount(async () => {
		if (!$auth.isAuthenticated) return;

		try {
			// Load both in parallel for better performance
			const [overviewData, historyData] = await Promise.all([
				api.get('/api/progress/overview'),
				api.get('/api/progress/history?limit=10')
			]);
			
			progress = overviewData.overview || {};
			sessions = historyData.history || [];
		} catch (err) {
			error = (/** @type {Error} */ (err)).message || 'Failed to load progress data';
		} finally {
			loading = false;
		}
	});

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

</script>

<svelte:head>
	<title>Progress - Study Helper</title>
</svelte:head>

{#if $auth.isAuthenticated}
	<div class="space-y-6">
		<h1 class="text-3xl font-bold text-gray-900">Your Progress</h1>

		{#if error}
			<div class="rounded-md bg-red-50 border border-red-200 p-4">
				<p class="text-sm text-red-800">{error}</p>
			</div>
		{/if}

		{#if loading}
			<div class="space-y-6">
				<LoadingSkeleton type="card" count={3} />
				<LoadingSkeleton type="list" count={5} />
			</div>
		{:else}
			<!-- Overall Statistics -->
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
				<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-gray-600">Total Sessions</p>
							<p class="text-3xl font-bold text-gray-900 mt-2">
								{progress.total_practice_sessions || 0}
							</p>
						</div>
						<div class="text-4xl">📝</div>
					</div>
				</div>

				<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-gray-600">Questions Answered</p>
							<p class="text-3xl font-bold text-gray-900 mt-2">
								{progress.total_problems_attempted || 0}
							</p>
						</div>
						<div class="text-4xl">✍️</div>
					</div>
				</div>

				<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-gray-600">Overall Accuracy</p>
							<p class="text-3xl font-bold text-gray-900 mt-2">
								{progress.overall_accuracy || 0}%
							</p>
						</div>
						<div class="text-4xl">🎯</div>
					</div>
				</div>
			</div>

			<!-- Recent Sessions -->
			<div class="bg-white rounded-lg shadow-sm border border-gray-200">
				<div class="px-6 py-4 border-b border-gray-200">
					<h2 class="text-xl font-semibold text-gray-900">Recent Practice Sessions</h2>
				</div>

				{#if sessions.length === 0}
					<div class="px-6 py-12 text-center">
						<div class="text-5xl mb-4">🎓</div>
						<p class="text-gray-600">No practice sessions yet</p>
						<a 
							href="/dashboard" 
							class="mt-4 inline-block text-indigo-600 hover:text-indigo-700 font-medium"
						>
							Start your first practice session →
						</a>
					</div>
				{:else}
					<div class="divide-y divide-gray-200">
						{#each sessions as session}
							<div class="px-6 py-4 hover:bg-gray-50 transition-colors">
								<div class="flex items-center justify-between">
									<div class="flex-1">
										<h3 class="text-base font-medium text-gray-900 mb-1">
											{session.guide?.title || 'Practice Session'}
										</h3>
										<p class="text-sm text-gray-600">
											{formatDate(session.started_at)}
										</p>
									</div>
									<div class="flex items-center space-x-4 text-sm">
										{#if session.ended_at}
											<div class="text-right">
												<p class="font-medium text-gray-900">
													{session.stats?.correct_answers || 0} / {session.stats?.total_problems || 0}
												</p>
												<p class="text-gray-600">
													{session.stats?.accuracy || 0}% correct
												</p>
											</div>
											<span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
												Completed
											</span>
										{:else}
											<span class="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
												In Progress
											</span>
											<a 
												href="/practice/{session.id}"
												class="text-indigo-600 hover:text-indigo-700 font-medium"
											>
												Continue →
											</a>
										{/if}
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Actions -->
			<div class="flex justify-center">
				<a 
					href="/dashboard"
					class="px-6 py-3 text-base font-medium text-white bg-indigo-600 rounded-md 
						hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
						focus:ring-indigo-500 transition-colors"
				>
					Back to Dashboard
				</a>
			</div>
		{/if}
	</div>
{/if}
