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
			// Session ID is used internally, just load first problem
			totalProblems = 20; // Default to 20 problems per session
			await loadNextProblem();
		} catch (err) {
			error = (/** @type {Error} */ (err)).message || 'Failed to load practice session';
		} finally {
			loading = false;
		}
	}

	async function loadNextProblem() {
		try {
			const response = await api.get(`/api/practice/next-problem?session_id=${sessionId}`);
			currentProblem = response.problem;
			currentProblemIndex++;

			if (practiceSessionComponent) {
				practiceSessionComponent.showProblem(currentProblem);
			}
		} catch (err) {
			const errorMsg = (/** @type {Error} */ (err)).message;
			if (errorMsg && (errorMsg.includes('completed') || errorMsg.includes('No problems available'))) {
				// Session completed - load summary
				await loadSessionSummary();
			} else {
				error = errorMsg || 'Failed to load next problem';
			}
		}
	}

	async function loadSessionSummary() {
		try {
			// End the session to get summary
			const response = await api.post('/api/practice/end', { session_id: parseInt(sessionId) });
			sessionSummary = response.summary;
		} catch (err) {
			// Fallback summary if endpoint fails
			sessionSummary = {
				total_problems: currentProblemIndex,
				correct_answers: 0,
				accuracy: 0
			};
		}
	}

	/**
	 * @param {CustomEvent<{ problemId: number; answer: string; hintsUsed?: number }>} event
	 */
	async function handleSubmitAnswer(event) {
		const { problemId, answer, hintsUsed = 0 } = event.detail;

		try {
			const feedback = await api.post('/api/practice/submit', {
				session_id: parseInt(sessionId),
				problem_id: problemId,
				answer: answer
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
			
			// Get the current problem's hints from the problem data
			// Backend doesn't have a separate hints endpoint
			if (currentProblem && currentProblem.hints) {
				const hintsUsed = practiceSessionComponent.getHintsUsed();
				if (hintsUsed < currentProblem.hints.length) {
					practiceSessionComponent.addHint(currentProblem.hints[hintsUsed]);
				} else {
					throw new Error('No more hints available');
				}
			} else {
				throw new Error('No hints available for this problem');
			}
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
		// Note: Backend expects attempt_id, not problem_id
		// This feature may not work correctly without storing the last attempt_id
		// For now, skip confidence update and just load next problem

		// Load next problem
		await loadNextProblem();
	}

	async function handleEndSession() {
		try {
			await api.post('/api/practice/end', { session_id: parseInt(sessionId) });
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
