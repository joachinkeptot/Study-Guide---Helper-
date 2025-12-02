<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { auth } from '$stores/auth';
	import api from '$lib/api';

	let guide = null;
	let loading = true;
	let error = '';
	let startingPractice = false;

	$: guideId = $page.params.id;

	// Protect route
	$: if (!$auth.isAuthenticated) {
		goto('/login');
	}

	onMount(async () => {
		if (!$auth.isAuthenticated) return;

		try {
			guide = await api.get(`/api/study-guides/${guideId}`);
		} catch (err) {
			error = err.message || 'Failed to load study guide';
		} finally {
			loading = false;
		}
	});

	async function startPractice() {
		startingPractice = true;
		try {
			const response = await api.post('/api/practice/start', {
				study_guide_id: guideId
			});
			goto(`/practice/${response.session_id}`);
		} catch (err) {
			error = err.message || 'Failed to start practice session';
		} finally {
			startingPractice = false;
		}
	}

	function formatDate(dateString) {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>{guide?.title || 'Study Guide'} - Study Helper</title>
</svelte:head>

{#if $auth.isAuthenticated}
	<div class="max-w-4xl mx-auto">
		{#if loading}
			<div class="flex justify-center items-center py-12">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
			</div>
		{:else if error}
			<div class="rounded-md bg-red-50 border border-red-200 p-4">
				<p class="text-sm text-red-800">{error}</p>
			</div>
			<div class="mt-4">
				<a 
					href="/dashboard" 
					class="text-indigo-600 hover:text-indigo-700 font-medium"
				>
					← Back to Dashboard
				</a>
			</div>
		{:else if guide}
			<div class="space-y-6">
				<div>
					<a 
						href="/dashboard" 
						class="text-indigo-600 hover:text-indigo-700 font-medium mb-4 inline-block"
					>
						← Back to Dashboard
					</a>
				</div>

				<div class="bg-white rounded-lg shadow-md border border-gray-200 p-8">
					<div class="flex justify-between items-start mb-6">
						<div>
							<h1 class="text-3xl font-bold text-gray-900 mb-2">
								{guide.title}
							</h1>
							<p class="text-gray-600">
								Created on {formatDate(guide.created_at)}
							</p>
						</div>
						{#if guide.topic}
							<span class="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
								{guide.topic}
							</span>
						{/if}
					</div>

					{#if guide.description}
						<div class="mb-6">
							<h2 class="text-lg font-semibold text-gray-900 mb-2">Description</h2>
							<p class="text-gray-700">{guide.description}</p>
						</div>
					{/if}

					{#if guide.content}
						<div class="mb-6">
							<h2 class="text-lg font-semibold text-gray-900 mb-2">Content</h2>
							<div class="prose max-w-none text-gray-700 whitespace-pre-wrap">
								{guide.content}
							</div>
						</div>
					{/if}

					<div class="mt-8 pt-6 border-t border-gray-200">
						<button
							on:click={startPractice}
							disabled={startingPractice}
							class="w-full sm:w-auto px-6 py-3 text-base font-medium text-white 
								bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none 
								focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 
								disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							{startingPractice ? 'Starting Practice...' : '🎯 Start Practice Session'}
						</button>
					</div>
				</div>
			</div>
		{/if}
	</div>
{/if}
