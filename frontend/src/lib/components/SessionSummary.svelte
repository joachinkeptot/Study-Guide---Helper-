<script>
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	/** @type {{ total_problems: number; correct_count: number; time_spent?: number; topics_practiced?: string[]; accuracy?: number; }} */
	export let summary;

	/**
	 * @param {number} seconds
	 */
	function formatTime(seconds) {
		if (!seconds) return '0:00';
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

	function handleContinue() {
		dispatch('continue');
	}

	function handleDashboard() {
		dispatch('dashboard');
	}

	$: accuracy = summary.accuracy || (summary.total_problems > 0 
		? Math.round((summary.correct_count / summary.total_problems) * 100)
		: 0);

	$: performanceEmoji = accuracy >= 80 ? '🎉' : accuracy >= 60 ? '👏' : '💪';
	$: performanceMessage = accuracy >= 80 
		? 'Excellent work!' 
		: accuracy >= 60 
			? 'Good progress!' 
			: 'Keep practicing!';
</script>

<div class="min-h-screen flex items-center justify-center p-4">
	<div class="max-w-2xl w-full bg-white rounded-lg shadow-lg border border-gray-200 p-8">
		<!-- Header -->
		<div class="text-center mb-8">
			<div class="text-7xl mb-4">{performanceEmoji}</div>
			<h1 class="text-3xl font-bold text-gray-900 mb-2">Session Complete!</h1>
			<p class="text-lg text-gray-600">{performanceMessage}</p>
		</div>

		<!-- Stats Grid -->
		<div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
			<!-- Problems Attempted -->
			<div class="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4 text-center">
				<div class="text-3xl font-bold text-indigo-700 mb-1">
					{summary.total_problems}
				</div>
				<div class="text-sm text-indigo-600 font-medium">
					Problems Attempted
				</div>
			</div>

			<!-- Correct Answers -->
			<div class="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 text-center">
				<div class="text-3xl font-bold text-green-700 mb-1">
					{summary.correct_count}
				</div>
				<div class="text-sm text-green-600 font-medium">
					Correct Answers
				</div>
			</div>

			<!-- Accuracy -->
			<div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 text-center col-span-2 md:col-span-1">
				<div class="text-3xl font-bold text-purple-700 mb-1">
					{accuracy}%
				</div>
				<div class="text-sm text-purple-600 font-medium">
					Accuracy
				</div>
			</div>

			<!-- Time Spent -->
			{#if summary.time_spent}
				<div class="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4 text-center col-span-2 md:col-span-3">
					<div class="flex items-center justify-center gap-2">
						<span class="text-2xl">⏱️</span>
						<div class="text-3xl font-bold text-amber-700">
							{formatTime(summary.time_spent)}
						</div>
					</div>
					<div class="text-sm text-amber-600 font-medium mt-1">
						Time Spent
					</div>
				</div>
			{/if}
		</div>

		<!-- Performance Bar -->
		<div class="mb-8">
			<div class="flex items-center justify-between mb-2">
				<span class="text-sm font-medium text-gray-700">Overall Performance</span>
				<span class="text-sm font-bold text-gray-900">{accuracy}%</span>
			</div>
			<div class="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
				<div
					class="h-4 rounded-full transition-all duration-1000 ease-out {accuracy >= 80
						? 'bg-gradient-to-r from-green-500 to-green-600'
						: accuracy >= 60
							? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
							: 'bg-gradient-to-r from-indigo-500 to-indigo-600'}"
					style="width: {accuracy}%"
				></div>
			</div>
		</div>

		<!-- Topics Practiced -->
		{#if summary.topics_practiced && summary.topics_practiced.length > 0}
			<div class="mb-8 p-4 bg-gray-50 rounded-lg">
				<h3 class="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
					<span>📚</span>
					<span>Topics Practiced</span>
				</h3>
				<div class="flex flex-wrap gap-2">
					{#each summary.topics_practiced as topic}
						<span class="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm text-gray-700">
							{topic}
						</span>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Encouragement Message -->
		<div class="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
			<div class="flex items-start gap-3">
				<div class="text-2xl flex-shrink-0">💡</div>
				<div class="flex-1">
					<p class="text-sm text-blue-900 leading-relaxed">
						{#if accuracy >= 80}
							You're mastering this material! Consider challenging yourself with new topics or reviewing less familiar concepts.
						{:else if accuracy >= 60}
							You're making good progress! Keep practicing these topics to build stronger mastery.
						{:else}
							Don't be discouraged! Mistakes are part of learning. Review the explanations and try again - you'll improve with practice.
						{/if}
					</p>
				</div>
			</div>
		</div>

		<!-- Action Buttons -->
		<div class="flex flex-col sm:flex-row gap-3">
			<button
				on:click={handleContinue}
				class="flex-1 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg
					hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 
					focus:ring-offset-2 transition-all"
			>
				Continue Studying
			</button>
			<button
				on:click={handleDashboard}
				class="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg
					hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 
					focus:ring-offset-2 transition-all"
			>
				Back to Dashboard
			</button>
		</div>
	</div>
</div>
