<script>
	import { goto } from '$app/navigation';
	import { auth } from '$stores/auth';
	import { authAPI } from '$lib/api';

	let email = '';
	let password = '';
	let error = '';
	let loading = false;

	async function handleLogin() {
		error = '';
		loading = true;

		try {
			const response = await authAPI.login(email, password);
			
			// Store token and user info
			auth.login(response.access_token, {
				id: response.user_id,
				username: response.username,
				email: email
			});

			// Redirect to dashboard
			goto('/dashboard');
		} catch (err) {
			error = err.message || 'Login failed. Please check your credentials.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Login - Study Helper</title>
</svelte:head>

<div class="flex items-center justify-center min-h-[calc(100vh-12rem)]">
	<div class="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md border border-gray-200">
		<div>
			<h2 class="text-center text-3xl font-bold text-gray-900">
				Sign in to your account
			</h2>
			<p class="mt-2 text-center text-sm text-gray-600">
				Or <a href="/register" class="font-medium text-indigo-600 hover:text-indigo-500">
					create a new account
				</a>
			</p>
		</div>

		<form class="mt-8 space-y-6" on:submit|preventDefault={handleLogin}>
			{#if error}
				<div class="rounded-md bg-red-50 border border-red-200 p-4">
					<p class="text-sm text-red-800">{error}</p>
				</div>
			{/if}

			<div class="space-y-4">
				<div>
					<label for="email" class="block text-sm font-medium text-gray-700">
						Email address
					</label>
					<input
						id="email"
						name="email"
						type="email"
						required
						bind:value={email}
						class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
							focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
						placeholder="you@example.com"
					/>
				</div>

				<div>
					<label for="password" class="block text-sm font-medium text-gray-700">
						Password
					</label>
					<input
						id="password"
						name="password"
						type="password"
						required
						bind:value={password}
						class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
							focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
						placeholder="••••••••"
					/>
				</div>
			</div>

			<div>
				<button
					type="submit"
					disabled={loading}
					class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md 
						shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 
						focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 
						disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				>
					{loading ? 'Signing in...' : 'Sign in'}
				</button>
			</div>
		</form>
	</div>
</div>
