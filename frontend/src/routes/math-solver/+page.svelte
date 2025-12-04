<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { auth } from '$stores/auth-supabase';
	import MathSolver from '$lib/components/MathSolver.svelte';

	// Protect route
	$: if (!$auth.isAuthenticated) {
		goto('/login');
	}

	/** @type {Array<{ problem: string; solution: any; timestamp: string }>} */
	let recentSolutions = [];

	/**
	 * @param {CustomEvent<{ problem: string; solution: any }>} event
	 */
	function handleSolved(event) {
		const { problem, solution } = event.detail;
		recentSolutions = [
			{
				problem,
				solution,
				timestamp: new Date().toISOString()
			},
			...recentSolutions.slice(0, 4) // Keep last 5
		];
	}
</script>

<svelte:head>
	<title>Math Solver - Study Helper</title>
</svelte:head>

{#if $auth.isAuthenticated}
	<div class="min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
		<!-- Header -->
		<div class="bg-white border-b border-gray-200 shadow-sm">
			<div class="max-w-4xl mx-auto px-4 py-6">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-4">
						<a 
							href="/dashboard"
							class="text-gray-600 hover:text-gray-900 transition-colors"
						>
							<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
							</svg>
						</a>
						<div>
							<h1 class="text-2xl font-bold text-gray-900">Math Problem Solver</h1>
							<p class="text-sm text-gray-600 mt-1">Get step-by-step solutions to math and statistics problems</p>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Main Content -->
		<div class="max-w-4xl mx-auto px-4 py-8">
			<div class="space-y-6">
				<!-- Math Solver Component -->
				<MathSolver on:solved={handleSolved} />

				<!-- Recent Solutions -->
				{#if recentSolutions.length > 0}
					<div class="bg-white rounded-lg shadow-md border border-gray-200 p-6">
						<h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
							<span class="text-2xl">📚</span>
							Recent Solutions
						</h3>
						<div class="space-y-4">
							{#each recentSolutions as item, index}
								<div class="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
									<p class="text-sm font-medium text-gray-700 mb-2">{item.problem}</p>
									<div class="flex items-center gap-4 text-xs text-gray-500">
										<span>✓ Solved</span>
										<span>•</span>
										<span>{new Date(item.timestamp).toLocaleTimeString()}</span>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Help & Tips -->
				<div class="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
					<h3 class="text-lg font-semibold text-indigo-900 mb-3 flex items-center gap-2">
						<span class="text-2xl">💡</span>
						Tips for Best Results
					</h3>
					<ul class="space-y-2 text-sm text-indigo-800">
						<li class="flex items-start gap-2">
							<span class="shrink-0">•</span>
							<span>Be specific with your problem statement and include all given information</span>
						</li>
						<li class="flex items-start gap-2">
							<span class="shrink-0">•</span>
							<span>For word problems, clearly state what you need to find</span>
						</li>
						<li class="flex items-start gap-2">
							<span class="shrink-0">•</span>
							<span>Include units where applicable (meters, seconds, dollars, etc.)</span>
						</li>
						<li class="flex items-start gap-2">
							<span class="shrink-0">•</span>
							<span>For complex problems, break them into smaller steps if needed</span>
						</li>
						<li class="flex items-start gap-2">
							<span class="shrink-0">•</span>
							<span>Review the step-by-step solution to understand the methodology</span>
						</li>
					</ul>
				</div>
			</div>
		</div>
	</div>
{/if}
