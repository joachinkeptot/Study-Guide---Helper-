<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { auth } from '$stores/auth';
	import api from '$lib/api';
	import PracticeSession from '$lib/components/PracticeSession.svelte';
	import SessionSummary from '$lib/components/SessionSummary.svelte';

import { callClaude } from '$lib/api.js';

let prompt = '';
let response = '';
let loading = false;
let error = '';

async function sendPrompt() {
	loading = true;
	error = '';
	response = '';
	try {
		const result = await callClaude(prompt);
		response = result?.content || JSON.stringify(result);
	} catch (e) {
		error = e instanceof Error ? (e.message || 'Error calling Claude API') : 'Error calling Claude API';
	} finally {
		loading = false;
	}
}
	/** @type {{ id?: number, study_guide?: any, topic?: any } | null} */
	let session = null;
	/** @type {any} */
	let currentProblem = null;
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
		// Initialize lightweight session object so PracticeSession renders
		if (sessionId !== undefined) {
			session = { id: parseInt(sessionId) };
		} else {
			error = 'Session ID is missing.';
			return;
		}
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
			if (!response || !response.problem) {
				// Guard against empty 200 responses
				error = 'No problem returned from server. Please try again or end the session.';
				currentProblem = null;
				return;
			}
			currentProblem = response.problem;
			currentProblemIndex++;

			if (practiceSessionComponent) {
				practiceSessionComponent.showProblem(currentProblem);
			}
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : 'Failed to load next problem';
			// If there are no problems available for selected topics, show a friendly empty state
			if (errorMsg && (errorMsg.includes('No problems available') || errorMsg.includes('No topics found'))) {
				error = 'No practice problems are available for this study guide yet. This can happen if the document content is too short or if problem generation failed. Please try uploading a different document or contact support.';
				currentProblem = null;
				return;
			}
			// If problem generation failed
			if (errorMsg && errorMsg.includes('Failed to generate')) {
				error = 'We encountered an issue generating practice problems. Please try again in a moment, or return to the dashboard to upload a different document.';
				currentProblem = null;
				return;
			}
			// If the session was already ended, do not auto-complete; surface the error
			if (errorMsg && errorMsg.includes('already ended')) {
				error = 'This session has already ended. Start a new session from the dashboard.';
				currentProblem = null;
				return;
			}
			// For other errors
			error = errorMsg || 'Failed to load next problem';
		}
	}

	async function loadSessionSummary() {
		try {
			// End the session to get summary
			if (sessionId === undefined) {
				error = 'Session ID is missing.';
				return;
			}
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
			if (sessionId === undefined) {
				error = 'Session ID is missing.';
				return;
			}
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
			const msg = err instanceof Error ? err.message : 'Failed to submit answer';
			error = msg;
		}
	}

	/**
	 * Handle hint request from practice session component
	 */
	async function handleHintRequest() {
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
			const errorMsg = err instanceof Error ? err.message : 'Failed to load hint';
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
	 * Handle loading next problem
	 */
	async function handleNextProblem() {
		// Optionally send confidence rating to backend
		// Note: Backend expects attempt_id, not problem_id
		// This feature may not work correctly without storing the last attempt_id
		// For now, skip confidence update and just load next problem

		// Load next problem
		await loadNextProblem();
	}

	async function handleEndSession() {
		try {
			if (sessionId === undefined) {
				error = 'Session ID is missing.';
				return;
			}
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
		<div class="min-h-screen flex items-center justify-center p-4 bg-gray-50">
			<div class="max-w-lg w-full">
				<div class="bg-white rounded-lg shadow-md border border-gray-200 p-8">
					<div class="flex items-start gap-4 mb-6">
						<div class="shrink-0">
							<svg class="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
						<div class="flex-1">
							<h2 class="text-xl font-semibold text-gray-900 mb-2">Unable to Start Practice Session</h2>
							<p class="text-sm text-gray-700 leading-relaxed">{error}</p>
						</div>
					</div>
					
					<div class="flex flex-col sm:flex-row gap-3">
						<button
							on:click={loadSession}
							class="flex-1 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md 
								hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 
								focus:ring-offset-2 transition-colors"
						>
							🔄 Try Again
						</button>
						<a 
							href="/dashboard" 
							class="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 
								bg-gray-100 text-gray-700 text-sm font-medium rounded-md 
								hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 
								focus:ring-offset-2 transition-colors"
						>
							← Back to Dashboard
						</a>
					</div>
				</div>
			</div>
		</div>
	{:else if sessionSummary}
		<SessionSummary
			summary={sessionSummary}
			on:continue={handleContinueStudying}
			on:dashboard={handleBackToDashboard}
		/>
	{:else if currentProblem}
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
