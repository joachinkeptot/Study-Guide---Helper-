<script>
	import { onMount } from 'svelte';
	import { auth } from '$stores/auth-supabase';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Toaster } from 'svelte-french-toast';
	import { validateEnv } from '$lib/config';
	import { logger } from '$lib/logger';
	import '../app.css';


	// Validate environment variables on app load
	try {
		validateEnv();
	} catch (error) {
		logger.error('Environment validation failed', error);
	}

	onMount(() => {
		auth.init();
		
		// Initialize Sentry in production
		if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
			import('@sentry/sveltekit').then(({ init }) => {
				init({
					dsn: import.meta.env.VITE_SENTRY_DSN,
					environment: import.meta.env.MODE,
					tracesSampleRate: 0.1,
					replaysSessionSampleRate: 0.1,
					replaysOnErrorSampleRate: 1.0
				});
				logger.info('Sentry initialized');
			}).catch((err) => {
				logger.error('Failed to initialize Sentry', err);
			});
		}
	});

	async function handleLogout() {
		await auth.logout();
		goto('/login');
	}

	$: userEmail = $auth?.user?.email;
</script>

<div class="min-h-screen bg-gray-50">
	<!-- Navigation -->
	<nav class="bg-white shadow-sm border-b border-gray-200">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between h-16">
				<div class="flex items-center">
					<a href="/" class="text-2xl font-bold text-indigo-600 hover:text-indigo-700">
						Study Helper
					</a>
					{#if $auth.isAuthenticated}
						<div class="hidden md:flex ml-10 space-x-4">
							<a 
								href="/dashboard" 
								class="px-3 py-2 rounded-md text-sm font-medium transition-colors
									{$page.url.pathname === '/dashboard' 
										? 'bg-indigo-100 text-indigo-700' 
										: 'text-gray-700 hover:bg-gray-100'}"
							>
								Dashboard
							</a>
							<a 
								href="/progress" 
								class="px-3 py-2 rounded-md text-sm font-medium transition-colors
									{$page.url.pathname === '/progress' 
										? 'bg-indigo-100 text-indigo-700' 
										: 'text-gray-700 hover:bg-gray-100'}"
							>
								Progress
							</a>
						</div>
					{/if}
				</div>

				<div class="flex items-center space-x-4">
					{#if $auth.isAuthenticated}
						<span class="text-sm text-gray-600">
							Welcome, <span class="font-medium">{userEmail || 'User'}</span>
						</span>
						<button 
							on:click={handleLogout}
							class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md 
								hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
								focus:ring-indigo-500 transition-colors"
						>
							Logout
						</button>
					{:else}
						<a 
							href="/login"
							class="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 
								transition-colors"
						>
							Login
						</a>
						<a 
							href="/register"
							class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md 
								hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
								focus:ring-indigo-500 transition-colors"
						>
							Sign Up
						</a>
					{/if}
				</div>
			</div>
		</div>
	</nav>

	<!-- Toast Notifications -->
	<Toaster />

	<!-- Main Content -->
	<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		<slot />
	</main>
</div>
