<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { auth } from '$stores/auth';
	import api from '$lib/api';
	import AddTopicModal from '$lib/components/AddTopicModal.svelte';

	/** @type {{ id: number; title: string; description?: string; content?: string; created_at: string; topic?: string; topics?: any[] } | null} */
	let guide = null;
	let loading = true;
	let error = '';
	let startingPractice = false;
	let showAddTopicModal = false;

	$: guideId = $page.params.id;

	// Protect route
	$: if (!$auth.isAuthenticated) {
		goto('/login');
	}

	onMount(async () => {
		if (!$auth.isAuthenticated) return;

		try {
			const response = await api.get(`/api/guides/${guideId}`);
			guide = response.guide || response;
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to load study guide';
			error = errorMessage;
		} finally {
			loading = false;
		}
	});

	async function startPractice() {
		if (!guideId) return;
		
		startingPractice = true;
		try {
			const response = await api.post('/api/practice/start', {
				guide_id: parseInt(guideId)
			});
			const sessionData = response.session || response;
			goto(`/practice/${sessionData.id}`);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to start practice session';
			error = errorMessage;
		} finally {
			startingPractice = false;
		}
	}

	async function handleTopicAdded() {
		// Reload guide to show new topic
		try {
			const response = await api.get(`/api/guides/${guideId}`);
			guide = response.guide || response;
		} catch (err) {
			console.error('Failed to reload guide:', err);
		}
	}

	/**
	 * @param {string} dateString
	 */
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

					<!-- Topics Section -->
					<div class="mb-6">
						<div class="flex justify-between items-center mb-4">
							<h2 class="text-lg font-semibold text-gray-900">Topics</h2>
							<button
								on:click={() => (showAddTopicModal = true)}
								class="px-3 py-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 
									border border-indigo-300 rounded-md hover:bg-indigo-50 
									focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
							>
								+ Add Topic
							</button>
						</div>

						{#if guide.topics && guide.topics.length > 0}
							<div class="space-y-3">
								{#each guide.topics as topic}
									<div class="p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
										<div class="flex justify-between items-start">
											<div class="flex-1">
												<h3 class="font-medium text-gray-900">{topic.name}</h3>
												{#if topic.description}
													<p class="text-sm text-gray-600 mt-1">{topic.description}</p>
												{/if}
												<p class="text-xs text-gray-500 mt-2">
													{topic.problem_count || 0} practice problem{topic.problem_count === 1 ? '' : 's'}
												</p>
											</div>
										</div>
									</div>
								{/each}
							</div>
						{:else}
							<div class="text-center py-8 bg-gray-50 border border-gray-200 rounded-lg">
								<svg
									class="mx-auto h-12 w-12 text-gray-400"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
									/>
								</svg>
								<h3 class="mt-2 text-sm font-medium text-gray-900">No topics yet</h3>
								<p class="mt-1 text-sm text-gray-500">
									Add topics to organize your study material
								</p>
								<button
									on:click={() => (showAddTopicModal = true)}
									class="mt-4 px-4 py-2 text-sm font-medium text-white bg-indigo-600 
										rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 
										focus:ring-offset-2 focus:ring-indigo-500"
								>
									Add Your First Topic
								</button>
							</div>
						{/if}
					</div>

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

	<!-- Add Topic Modal -->
	{#if guideId}
		<AddTopicModal
			bind:show={showAddTopicModal}
			guideId={parseInt(guideId)}
			on:topicAdded={handleTopicAdded}
		/>
	{/if}
{/if}
