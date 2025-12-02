<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { auth } from '$stores/auth';

	// Redirect to dashboard if already logged in
	onMount(() => {
		if ($auth.isAuthenticated) {
			goto('/dashboard');
		}
	});
</script>

<div class="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
	<div class="text-center max-w-3xl">
		<h1 class="text-5xl font-bold text-gray-900 mb-6">
			Welcome to Study Helper
		</h1>
		<p class="text-xl text-gray-600 mb-8">
			Transform your study materials into interactive practice sessions. 
			Upload documents, generate study guides, and track your progress.
		</p>
		
		<div class="flex flex-col sm:flex-row gap-4 justify-center">
			<a 
				href="/register" 
				class="px-8 py-3 text-lg font-medium text-white bg-indigo-600 rounded-lg 
					hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
					focus:ring-indigo-500 transition-colors"
			>
				Get Started
			</a>
			<a 
				href="/login" 
				class="px-8 py-3 text-lg font-medium text-indigo-600 bg-white border-2 
					border-indigo-600 rounded-lg hover:bg-indigo-50 focus:outline-none 
					focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
			>
				Sign In
			</a>
		</div>

		<div class="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
			<div class="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
				<div class="text-3xl mb-3">📚</div>
				<h3 class="text-lg font-semibold text-gray-900 mb-2">Upload Materials</h3>
				<p class="text-gray-600">Upload your study documents and let AI generate comprehensive study guides.</p>
			</div>
			<div class="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
				<div class="text-3xl mb-3">✍️</div>
				<h3 class="text-lg font-semibold text-gray-900 mb-2">Practice</h3>
				<p class="text-gray-600">Test your knowledge with interactive practice sessions and instant feedback.</p>
			</div>
			<div class="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
				<div class="text-3xl mb-3">📊</div>
				<h3 class="text-lg font-semibold text-gray-900 mb-2">Track Progress</h3>
				<p class="text-gray-600">Monitor your learning journey with detailed progress analytics.</p>
			</div>
		</div>
	</div>
</div>
