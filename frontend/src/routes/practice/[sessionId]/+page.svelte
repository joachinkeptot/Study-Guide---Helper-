<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { auth } from '$stores/auth';
	import api from '$lib/api';
	import PracticeSession from '$lib/components/PracticeSession.svelte';
	import SessionSummary from '$lib/components/SessionSummary.svelte';

	/** @type {any} */
	let session = null;
	/** @type {any} */
	let currentProblem = null;
	let loading = true;
	let error = '';
	/** @type {any} */
	let sessionSummary = null;

	let currentProblemIndex = 0;
	let totalProblems = 0;

	/** @type {PracticeSession | null} */
	let practiceSessionComponent = null;

	$: sessionId = $page.params.sessionId;

	// Protect route
	$: if (!$auth.isAuthenticated) {
		goto('/login');
	}

	onMount(async () => {
		if (!$auth.isAuthenticated) return;
		await loadSession();
	});

	async function loadSession() {
		loading = true;
		error = '';
		try {
			session = await api.get(`/api/practice/session/${sessionId}`);
			totalProblems = session.total_count || 20; // Default to 20 if not provided
			await loadNextProblem();
		} catch (err) {
			error = (/** @type {Error} */ (err)).message || 'Failed to load practice session';
		} finally {
			loading = false;
		}
	}

	async function loadNextProblem() {
		try {
			const response = await api.get(`/api/practice/session/${sessionId}/next`);
			currentProblem = response;
			currentProblemIndex++;

			if (practiceSessionComponent) {
				practiceSessionComponent.showProblem(currentProblem);
			}
		} catch (err) {
			const errorMsg = (/** @type {Error} */ (err)).message;
			if (errorMsg && errorMsg.includes('completed')) {
				// Session completed - load summary
				await loadSessionSummary();
			} else {
				error = errorMsg || 'Failed to load next problem';
			}
		}
	}

	async function loadSessionSummary() {
		try {
			const summary = await api.get(`/api/practice/session/${sessionId}/summary`);
			sessionSummary = summary;
		} catch (err) {
			// Fallback summary if endpoint doesn't exist
			sessionSummary = {
				total_problems: currentProblemIndex,
				correct_count: session?.correct_count || 0,
				accuracy: session?.correct_count && currentProblemIndex 
					? Math.round((session.correct_count / currentProblemIndex) * 100) 
					: 0
			};
		}
	}

	/**
	 * @param {CustomEvent<{ problemId: number; answer: string; hintsUsed?: number }>} event
	 */
	async function handleSubmitAnswer(event) {
		const { problemId, answer, hintsUsed = 0 } = event.detail;

		try {
			// Create hints_used array based on count
			const hints_used = hintsUsed > 0 
				? Array.from({ length: hintsUsed }, (_, i) => i)
				: [];

			const feedback = await api.post(`/api/practice/session/${sessionId}/submit`, {
				problem_id: problemId,
				answer: answer,
				hints_used: hints_used
			});

			// Add hints_used count to feedback for display
			if (practiceSessionComponent) {
				practiceSessionComponent.showFeedback({
					...feedback,
					hints_used: hintsUsed
				});
			}
		} catch (err) {
			error = (/** @type {Error} */ (err)).message || 'Failed to submit answer';
		}
	}

	/**
	 * @param {CustomEvent<{ problemId: number }>} event
	 */
	async function handleHintRequest(event) {
		const { problemId } = event.detail;

		if (!practiceSessionComponent || !sessionId) return;

		try {
			practiceSessionComponent.setHintLoading(true);
			
			const response = await api.post('/api/practice/hint', {
				session_id: parseInt(sessionId),
				problem_id: problemId
			});

			// Add the hint to the practice session component
			practiceSessionComponent.addHint(response.hint);
		} catch (err) {
			const errorMsg = (/** @type {Error} */ (err)).message;
			// Show user-friendly error messages
			if (errorMsg.includes('All hints have been used')) {
				alert('All hints for this problem have been used.');
			} else if (errorMsg.includes('No hints available')) {
				alert('No hints are available for this problem.');
			} else {
				error = errorMsg || 'Failed to load hint';
			}
			practiceSessionComponent.setHintLoading(false);
		}
	}

	/**
	 * @param {CustomEvent<{ confidence: number }>} event
	 */
	async function handleNextProblem(event) {
		const { confidence } = event.detail;

		// Optionally send confidence rating to backend
		try {
			await api.post(`/api/practice/session/${sessionId}/confidence`, {
				problem_id: currentProblem.id,
				confidence: confidence
			});
		} catch (err) {
			// Non-critical, continue anyway
			console.warn('Failed to save confidence rating:', err);
		}

		// Load next problem
		await loadNextProblem();
	}

	async function handleEndSession() {
		try {
			await api.post(`/api/practice/session/${sessionId}/end`, {});
			await loadSessionSummary();
		} catch (err) {
			error = (/** @type {Error} */ (err)).message || 'Failed to end session';
		}
	}

	function handleContinueStudying() {
		goto('/dashboard');
	}

	function handleBackToDashboard() {
		goto('/dashboard');
	}

	$: currentTopic = session?.study_guide?.title || session?.topic?.name || 'Practice Session';
</script>

<svelte:head>
	<title>Practice Session - Study Helper</title>
</svelte:head>

{#if $auth.isAuthenticated}
	{#if loading}
		<div class="min-h-screen flex justify-center items-center bg-linear-to-br from-gray-50 to-gray-100">
			<div class="text-center">
				<div class="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
				<p class="text-gray-600">Loading practice session...</p>
			</div>
		</div>
	{:else if error && !currentProblem}
		<div class="min-h-screen flex items-center justify-center p-4">
			<div class="max-w-md w-full">
				<div class="rounded-md bg-red-50 border border-red-200 p-4 mb-4">
					<p class="text-sm text-red-800">{error}</p>
				</div>
				<a 
					href="/dashboard" 
					class="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
				>
					← Back to Dashboard
				</a>
			</div>
		</div>
	{:else if sessionSummary}
		<SessionSummary
			summary={sessionSummary}
			on:continue={handleContinueStudying}
			on:dashboard={handleBackToDashboard}
		/>
	{:else if session && currentProblem}
		<PracticeSession
			bind:this={practiceSessionComponent}
			{currentTopic}
			{totalProblems}
			{currentProblemIndex}
			on:submitAnswer={handleSubmitAnswer}
			on:nextProblem={handleNextProblem}
			on:endSession={handleEndSession}
			on:requestHint={handleHintRequest}
		/>
	{/if}
{/if}
