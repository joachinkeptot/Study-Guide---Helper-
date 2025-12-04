<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { auth } from '$stores/auth-supabase';

	// Redirect to simple-practice if already logged in
	onMount(() => {
		if ($auth.isAuthenticated) {
			goto('/simple-practice');
		}
	});
</script>

<div class="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
	<div class="text-center max-w-3xl">
		<h1 class="text-5xl font-bold text-gray-900 mb-6">
			AI Study Practice
		</h1>
		<p class="text-xl text-gray-600 mb-8">
			Enter any topic and get instant AI-generated practice problems with explanations.
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
				<div class="text-3xl mb-3">🤖</div>
				<h3 class="text-lg font-semibold text-gray-900 mb-2">AI Generated</h3>
				<p class="text-gray-600">Get instant practice problems on any topic you want to study.</p>
			</div>
			<div class="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
				<div class="text-3xl mb-3">✓</div>
				<h3 class="text-lg font-semibold text-gray-900 mb-2">Instant Feedback</h3>
				<p class="text-gray-600">Get immediate explanations for every answer - right or wrong.</p>
			</div>
			<div class="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
				<div class="text-3xl mb-3">♾️</div>
				<h3 class="text-lg font-semibold text-gray-900 mb-2">Unlimited Practice</h3>
				<p class="text-gray-600">Practice as much as you need until you feel confident.</p>
			</div>
		</div>
	</div>
</div>
