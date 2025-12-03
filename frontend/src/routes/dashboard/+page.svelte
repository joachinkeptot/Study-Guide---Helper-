<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { auth } from '$stores/auth-supabase';
	import api from '$lib/api.js';
	import FileUpload from '$lib/components/FileUpload.svelte';
	import GuideCard from '$lib/components/GuideCard.svelte';
	import GuideDetail from '$lib/components/GuideDetail.svelte';
	import LoadingSkeleton from '$lib/components/LoadingSkeleton.svelte';

	/** @type {any[]} */
	let guides = [];
	let loading = true;
	let uploadError = '';
	let loadError = '';
	
	/** @type {number | null} */
	let selectedGuideId = null;
	/** @type {any} */
	let selectedGuide = null;
	let loadingDetail = false;

	// Protect route - redirect on client after mount

	onMount(async () => {
		if (!$auth.isAuthenticated) return;
		// Start loading guides immediately
		loadGuides();
	});

	async function loadGuides() {
		loading = true;
		loadError = '';
		try {
			// Use pagination to load faster
			const data = await api.get('/api/guides?limit=50');
			guides = data.guides || [];
		} catch (err) {
			loadError = (/** @type {Error} */ (err)).message || 'Failed to load study guides';
		} finally {
			loading = false;
		}
	}

	/**
	 * @param {CustomEvent<{ file: File; formData: FormData; onSuccess: () => void; onError: (msg: string) => void }>} event
	 */
	async function handleUpload(event) {
		uploadError = '';
		const { formData, onSuccess, onError } = event.detail;

		try {
			// Call your API endpoint for file upload
			const response = await fetch(
				`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'}/api/guides/upload`,
				{
					method: 'POST',
					headers: {
						'Authorization': `Bearer ${$auth.token}`
					},
					body: formData
				}
			);

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				const errorMsg = errorData.error || errorData.message || 'Upload failed';
				uploadError = errorMsg;
				onError(errorMsg);
				return;
			}

			// Reload guides after successful upload
			await loadGuides();
			onSuccess();
		} catch (err) {
			const errorMsg = (/** @type {Error} */ (err)).message || 'Upload failed. Please try again.';
			uploadError = errorMsg;
			onError(errorMsg);
		}
	}

	/**
	 * @param {CustomEvent<{ guideId: number }>} event
	 */
	async function handleStudy(event) {
		const { guideId } = event.detail;
		try {
			// Create a new practice session
			const response = await api.post('/api/practice/start', {
				guide_id: guideId
			});
			const sessionData = response.session || response;
			goto(`/practice/${sessionData.id}`);
		} catch (err) {
			const errorMsg = (/** @type {Error} */ (err)).message || 'Failed to start practice session';
			// Show error in a more user-friendly way
			if (confirm(`${errorMsg}\n\nWould you like to view the guide details to check for topics and problems?`)) {
				selectedGuideId = guideId;
				loadingDetail = true;
				try {
					const guideData = await api.get(`/api/guides/${guideId}`);
					selectedGuide = guideData.guide || guideData;
				} catch {
					alert('Failed to load guide details');
					selectedGuideId = null;
				} finally {
					loadingDetail = false;
				}
			}
		}
	}

	/**
	 * @param {CustomEvent<{ guideId: number }>} event
	 */
	async function handleViewDetails(event) {
		const { guideId } = event.detail;
		selectedGuideId = guideId;
		loadingDetail = true;

		try {
			// Load guide details with topics and sessions
			const guideData = await api.get(`/api/guides/${guideId}`);
			selectedGuide = guideData.guide || guideData;
		} catch (err) {
			alert((/** @type {Error} */ (err)).message || 'Failed to load guide details');
			selectedGuideId = null;
		} finally {
			loadingDetail = false;
		}
	}

	/**
	 * @param {CustomEvent<{ guideId: number }>} event
	 */
	async function handleDelete(event) {
		const { guideId } = event.detail;
		try {
			await api.delete(`/api/guides/${guideId}`);
			await loadGuides();
		} catch (err) {
			alert((/** @type {Error} */ (err)).message || 'Failed to delete guide');
		}
	}

	/**
	 * @param {CustomEvent<{ guideId: number; topicIds: number[] }>} event
	 */
	async function handleStartPractice(event) {
		const { guideId, topicIds } = event.detail;
		try {
			const response = await api.post('/api/practice/start', {
				guide_id: guideId,
				topic_ids: topicIds.length > 0 ? topicIds : undefined
			});
			const sessionData = response.session || response;
			goto(`/practice/${sessionData.id}`);
		} catch (err) {
			alert((/** @type {Error} */ (err)).message || 'Failed to start practice session');
		}
	}

	function handleBack() {
		selectedGuideId = null;
		selectedGuide = null;
	}
</script>

<svelte:head>
	<title>Dashboard - Study Helper</title>
</svelte:head>

{#if $auth.isAuthenticated}
	<div class="space-y-8">
		{#if selectedGuideId && selectedGuide}
			<!-- Detail View -->
			<GuideDetail
				guide={selectedGuide}
				loading={loadingDetail}
				on:startPractice={handleStartPractice}
				on:back={handleBack}
			/>
		{:else}
			<!-- Dashboard View -->
			<div>
				<h1 class="text-3xl font-bold text-gray-900 mb-6">My Study Guides</h1>

				<!-- Upload Section -->
				<div class="mb-8">
					<h2 class="text-xl font-semibold text-gray-900 mb-4">Upload New Material</h2>
					<FileUpload on:upload={handleUpload} />
					{#if uploadError}
						<div class="mt-4 rounded-md bg-red-50 border border-red-200 p-4">
							<p class="text-sm text-red-800">{uploadError}</p>
						</div>
					{/if}
				</div>

				<!-- Guides Grid -->
				<div>
					<h2 class="text-xl font-semibold text-gray-900 mb-4">Your Study Guides</h2>

					{#if loadError}
						<div class="rounded-md bg-red-50 border border-red-200 p-4 mb-6">
							<p class="text-sm text-red-800">{loadError}</p>
						</div>
					{/if}

				{#if loading}
					<LoadingSkeleton type="card" count={3} />
					{:else if guides.length === 0}
						<!-- Empty State -->
						<div class="text-center py-16 bg-white rounded-lg shadow-sm border border-gray-200">
							<div class="text-7xl mb-4">📚</div>
							<h3 class="text-2xl font-semibold text-gray-900 mb-2">Welcome to Study Helper!</h3>
							<p class="text-gray-600 mb-2">You don't have any study guides yet.</p>
							<p class="text-gray-500 text-sm mb-6">
								Upload your first document above to get started with AI-powered practice questions.
							</p>
							<div class="flex items-center justify-center gap-4 text-sm text-gray-500">
								<div class="flex items-center gap-1">
									<span>📄</span>
									<span>Upload PDFs</span>
								</div>
								<div class="flex items-center gap-1">
									<span>🤖</span>
									<span>AI generates questions</span>
								</div>
								<div class="flex items-center gap-1">
									<span>📈</span>
									<span>Track progress</span>
								</div>
							</div>
						</div>
					{:else}
						<!-- Guides Grid -->
						<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{#each guides as guide (guide.id)}
								<GuideCard
									{guide}
									on:study={handleStudy}
									on:viewDetails={handleViewDetails}
									on:delete={handleDelete}
								/>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>
{/if}
