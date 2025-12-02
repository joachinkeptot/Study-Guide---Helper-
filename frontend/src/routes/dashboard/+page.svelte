<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { auth } from '$stores/auth';
	import api from '$lib/api';

	let guides = [];
	let loading = true;
	let error = '';

	// Protect route - redirect if not authenticated
	$: if (!$auth.isAuthenticated) {
		goto('/login');
	}

	onMount(async () => {
		if (!$auth.isAuthenticated) return;

		try {
			guides = await api.get('/api/study-guides');
		} catch (err) {
			error = err.message || 'Failed to load study guides';
		} finally {
			loading = false;
		}
	});

	function formatDate(dateString) {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Dashboard - Study Helper</title>
</svelte:head>

{#if $auth.isAuthenticated}
	<div class="space-y-6">
		<div class="flex justify-between items-center">
			<h1 class="text-3xl font-bold text-gray-900">
				Your Study Guides
			</h1>
			<button
				class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md 
					hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
					focus:ring-indigo-500 transition-colors"
			>
				+ New Guide
			</button>
		</div>

		{#if error}
			<div class="rounded-md bg-red-50 border border-red-200 p-4">
				<p class="text-sm text-red-800">{error}</p>
			</div>
		{/if}

		{#if loading}
			<div class="flex justify-center items-center py-12">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
			</div>
		{:else if guides.length === 0}
			<div class="text-center py-12 bg-white rounded-lg border border-gray-200">
				<div class="text-5xl mb-4">📚</div>
				<h3 class="text-lg font-medium text-gray-900 mb-2">No study guides yet</h3>
				<p class="text-gray-600 mb-6">Get started by creating your first study guide</p>
				<button
					class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md 
						hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
						focus:ring-indigo-500 transition-colors"
				>
					Create Study Guide
				</button>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{#each guides as guide}
					<a
						href="/guide/{guide.id}"
						class="block p-6 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 
							hover:shadow-md transition-all"
					>
						<h3 class="text-lg font-semibold text-gray-900 mb-2">
							{guide.title}
						</h3>
						<p class="text-sm text-gray-600 mb-4 line-clamp-2">
							{guide.description || 'No description available'}
						</p>
						<div class="flex justify-between items-center text-xs text-gray-500">
							<span>Created {formatDate(guide.created_at)}</span>
							{#if guide.topic}
								<span class="px-2 py-1 bg-indigo-100 text-indigo-700 rounded">
									{guide.topic}
								</span>
							{/if}
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</div>
{/if}
