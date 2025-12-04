<script>
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { auth } from '$stores/auth-supabase';

	let topic = '';
	let loading = false;
	let error = '';
	
	/** @type {{ question: string; options: string[]; correct_answer: string; explanation: string; } | null} */
	let currentProblem = null;
	let selectedAnswer = '';
	let showFeedback = false;
	let isCorrect = false;

	// Protect route (only in browser)
	$: if (browser && !$auth.isAuthenticated) {
		goto('/login');
	}

	async function generateProblem() {
		if (!topic.trim()) {
			error = 'Please enter a topic';
			return;
		}

		loading = true;
		error = '';
		currentProblem = null;
		showFeedback = false;
		selectedAnswer = '';

		try {
			const response = await fetch('https://ybcrtgdzmziclaohvjaz.supabase.co/functions/v1/generate-simple-problem', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${$auth.token}`
				},
				body: JSON.stringify({ topic })
			});

			if (!response.ok) {
				throw new Error('Failed to generate problem');
			}

			const data = await response.json();
			currentProblem = data;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to generate problem';
		} finally {
			loading = false;
		}
	}

	function submitAnswer() {
		if (!selectedAnswer || !currentProblem) return;
		
		isCorrect = selectedAnswer === currentProblem.correct_answer;
		showFeedback = true;
	}

	function nextProblem() {
		generateProblem();
	}

	function changeTopic() {
		currentProblem = null;
		showFeedback = false;
		selectedAnswer = '';
		topic = '';
	}
</script>

<svelte:head>
	<title>Simple Practice - Study Helper</title>
</svelte:head>

{#if $auth.isAuthenticated}
	<div class="max-w-3xl mx-auto py-8 px-4">
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-gray-900 mb-2">AI Practice Generator</h1>
			<p class="text-gray-600">Enter any topic and get instant practice problems</p>
		</div>

		<!-- Topic Input -->
		<div class="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
			<label for="topic-input" class="block text-sm font-medium text-gray-700 mb-2">
				What do you want to practice?
			</label>
			<div class="flex gap-3">
				<input
					id="topic-input"
					type="text"
					bind:value={topic}
					placeholder="e.g., Calculus derivatives, Spanish verbs, Chemistry..."
					disabled={loading}
					on:keydown={(e) => e.key === 'Enter' && generateProblem()}
					class="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg
						focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
						transition-all text-gray-900 placeholder-gray-400
						disabled:opacity-60 disabled:cursor-not-allowed"
				/>
				<button
					on:click={generateProblem}
					disabled={loading || !topic.trim()}
					class="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg
						hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 
						focus:ring-offset-2 transition-all
						disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{loading ? 'Generating...' : 'Generate Problem'}
				</button>
			</div>
			{#if error}
				<p class="mt-2 text-sm text-red-600">{error}</p>
			{/if}
		</div>

		<!-- Problem Display -->
		{#if currentProblem}
			<div class="bg-white rounded-lg shadow-md border border-gray-200 p-6">
				<!-- Question -->
				<div class="mb-6">
					<div class="flex items-start gap-3 mb-4">
						<div class="text-2xl shrink-0">❓</div>
						<div class="flex-1">
							<p class="text-lg text-gray-900 leading-relaxed">{currentProblem.question}</p>
						</div>
					</div>
				</div>

				<!-- Options -->
				{#if !showFeedback}
					<div class="space-y-3 mb-6">
						{#each currentProblem.options as option, index}
							<button
								on:click={() => selectedAnswer = option}
								class="w-full text-left p-4 rounded-lg border-2 transition-all
									{selectedAnswer === option
										? 'border-indigo-500 bg-indigo-50'
										: 'border-gray-200 bg-white hover:border-indigo-300'}
									cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
							>
								<div class="flex items-center gap-3">
									<div class="shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center
										{selectedAnswer === option
											? 'border-indigo-500 bg-indigo-500'
											: 'border-gray-300'}">
										{#if selectedAnswer === option}
											<div class="w-2 h-2 rounded-full bg-white"></div>
										{/if}
									</div>
									<span class="text-sm text-gray-500 font-medium w-6">{String.fromCharCode(65 + index)}.</span>
									<span class="flex-1 text-gray-900">{option}</span>
								</div>
							</button>
						{/each}
					</div>

					<button
						on:click={submitAnswer}
						disabled={!selectedAnswer}
						class="w-full px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg
							hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 
							focus:ring-offset-2 transition-all
							disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Submit Answer
					</button>
				{/if}

				<!-- Feedback -->
				{#if showFeedback}
					<div class="mb-6">
						<div class="rounded-lg p-4 {isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}">
							<div class="flex items-start gap-3 mb-3">
								<span class="text-2xl">{isCorrect ? '✓' : '✗'}</span>
								<div class="flex-1">
									<h3 class="text-lg font-semibold {isCorrect ? 'text-green-900' : 'text-red-900'} mb-1">
										{isCorrect ? 'Correct!' : 'Incorrect'}
									</h3>
									{#if !isCorrect}
										<p class="text-sm {isCorrect ? 'text-green-700' : 'text-red-700'} mb-2">
											Correct answer: <strong>{currentProblem.correct_answer}</strong>
										</p>
									{/if}
									<p class="text-sm {isCorrect ? 'text-green-800' : 'text-red-800'}">
										{currentProblem.explanation}
									</p>
								</div>
							</div>
						</div>
					</div>

					<div class="flex gap-3">
						<button
							on:click={nextProblem}
							class="flex-1 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg
								hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 
								focus:ring-offset-2 transition-all"
						>
							Next Problem →
						</button>
						<button
							on:click={changeTopic}
							class="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg
								hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 
								focus:ring-offset-2 transition-all"
						>
							Change Topic
						</button>
					</div>
				{/if}
			</div>
		{/if}
	</div>
{/if}
