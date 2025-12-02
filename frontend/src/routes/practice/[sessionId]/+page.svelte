<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { auth } from '$stores/auth';
	import api from '$lib/api';

	let session = null;
	let currentProblem = null;
	let userAnswer = '';
	let loading = true;
	let submitting = false;
	let error = '';
	let feedback = null;

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
		try {
			session = await api.get(`/api/practice/session/${sessionId}`);
			await loadNextProblem();
		} catch (err) {
			error = err.message || 'Failed to load practice session';
		} finally {
			loading = false;
		}
	}

	async function loadNextProblem() {
		try {
			currentProblem = await api.get(`/api/practice/session/${sessionId}/next`);
			feedback = null;
			userAnswer = '';
		} catch (err) {
			if (err.message.includes('completed')) {
				// Session completed
				goto(`/progress`);
			} else {
				error = err.message || 'Failed to load next problem';
			}
		}
	}

	async function submitAnswer() {
		if (!userAnswer.trim()) {
			error = 'Please provide an answer';
			return;
		}

		submitting = true;
		error = '';

		try {
			feedback = await api.post(`/api/practice/session/${sessionId}/submit`, {
				problem_id: currentProblem.id,
				answer: userAnswer
			});
		} catch (err) {
			error = err.message || 'Failed to submit answer';
		} finally {
			submitting = false;
		}
	}

	async function nextQuestion() {
		await loadNextProblem();
	}

	async function endSession() {
		try {
			await api.post(`/api/practice/session/${sessionId}/end`);
			goto('/progress');
		} catch (err) {
			error = err.message || 'Failed to end session';
		}
	}
</script>

<svelte:head>
	<title>Practice Session - Study Helper</title>
</svelte:head>

{#if $auth.isAuthenticated}
	<div class="max-w-3xl mx-auto">
		{#if loading}
			<div class="flex justify-center items-center py-12">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
			</div>
		{:else if error && !currentProblem}
			<div class="rounded-md bg-red-50 border border-red-200 p-4 mb-4">
				<p class="text-sm text-red-800">{error}</p>
			</div>
			<a 
				href="/dashboard" 
				class="text-indigo-600 hover:text-indigo-700 font-medium"
			>
				← Back to Dashboard
			</a>
		{:else if session && currentProblem}
			<div class="space-y-6">
				<!-- Session Header -->
				<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
					<div class="flex justify-between items-center">
						<div>
							<h2 class="text-lg font-semibold text-gray-900">
								{session.study_guide?.title || 'Practice Session'}
							</h2>
							<p class="text-sm text-gray-600">
								Session started {new Date(session.started_at).toLocaleTimeString()}
							</p>
						</div>
						<button
							on:click={endSession}
							class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 
								rounded-md hover:bg-gray-200 transition-colors"
						>
							End Session
						</button>
					</div>
				</div>

				<!-- Problem Card -->
				<div class="bg-white rounded-lg shadow-md border border-gray-200 p-8">
					<div class="mb-6">
						<div class="flex items-center justify-between mb-4">
							<span class="text-sm font-medium text-indigo-600">
								Question {currentProblem.order || ''}
							</span>
							{#if currentProblem.difficulty}
								<span class="px-2 py-1 text-xs font-medium rounded 
									{currentProblem.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
									currentProblem.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
									'bg-red-100 text-red-800'}">
									{currentProblem.difficulty}
								</span>
							{/if}
						</div>
						
						<h3 class="text-xl font-semibold text-gray-900 mb-4">
							{currentProblem.question}
						</h3>
					</div>

					{#if !feedback}
						<div class="space-y-4">
							<div>
								<label for="answer" class="block text-sm font-medium text-gray-700 mb-2">
									Your Answer
								</label>
								<textarea
									id="answer"
									bind:value={userAnswer}
									rows="4"
									class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
										focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
									placeholder="Type your answer here..."
								/>
							</div>

							{#if error}
								<div class="rounded-md bg-red-50 border border-red-200 p-3">
									<p class="text-sm text-red-800">{error}</p>
								</div>
							{/if}

							<button
								on:click={submitAnswer}
								disabled={submitting || !userAnswer.trim()}
								class="w-full px-4 py-2 text-base font-medium text-white bg-indigo-600 
									rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 
									focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 
									disabled:cursor-not-allowed transition-colors"
							>
								{submitting ? 'Submitting...' : 'Submit Answer'}
							</button>
						</div>
					{:else}
						<div class="space-y-4">
							<div class="rounded-md p-4 
								{feedback.is_correct ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}">
								<div class="flex items-start">
									<div class="text-2xl mr-3">
										{feedback.is_correct ? '✅' : '💭'}
									</div>
									<div class="flex-1">
										<h4 class="font-semibold mb-2 
											{feedback.is_correct ? 'text-green-800' : 'text-yellow-800'}">
											{feedback.is_correct ? 'Correct!' : 'Not quite right'}
										</h4>
										{#if feedback.feedback}
											<p class="text-sm text-gray-700">{feedback.feedback}</p>
										{/if}
									</div>
								</div>
							</div>

							{#if currentProblem.correct_answer}
								<div class="rounded-md bg-blue-50 border border-blue-200 p-4">
									<h4 class="font-semibold text-blue-900 mb-2">Correct Answer:</h4>
									<p class="text-sm text-gray-700">{currentProblem.correct_answer}</p>
								</div>
							{/if}

							<button
								on:click={nextQuestion}
								class="w-full px-4 py-2 text-base font-medium text-white bg-indigo-600 
									rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 
									focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
							>
								Next Question →
							</button>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>
{/if}
