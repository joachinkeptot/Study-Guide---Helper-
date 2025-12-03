<script>
	import { goto } from '$app/navigation';
	import { auth } from '$stores/auth-supabase';

	let email = '';
	let password = '';
	let confirmPassword = '';
	let error = '';
	let loading = false;
	let success = false;
	let needsEmailConfirmation = false;

	async function handleRegister() {
		error = '';
		success = false;
		needsEmailConfirmation = false;

		// Validation
		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}

		if (password.length < 6) {
			error = 'Password must be at least 6 characters';
			return;
		}

		loading = true;

		try {
			const result = await auth.register(email, password);
			
			// Check if email confirmation is required
			if (result.user && !result.session) {
				needsEmailConfirmation = true;
				success = true;
			} else if (result.session) {
				// Auto-logged in, redirect to dashboard
				goto('/dashboard');
			}
		} catch (err) {
			console.error('Registration error:', err);
			error = err instanceof Error ? err.message : 'Registration failed. Please try again.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Register - Study Helper</title>
</svelte:head>

<div class="flex items-center justify-center min-h-[calc(100vh-12rem)]">
	<div class="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md border border-gray-200">
		<div>
			<h2 class="text-center text-3xl font-bold text-gray-900">
				Create your account
			</h2>
			<p class="mt-2 text-center text-sm text-gray-600">
				Already have an account? <a href="/login" class="font-medium text-indigo-600 hover:text-indigo-500">
					Sign in
				</a>
			</p>
		</div>

		<form class="mt-8 space-y-6" on:submit|preventDefault={handleRegister}>
			{#if error}
				<div class="rounded-md bg-red-50 border border-red-200 p-4">
					<p class="text-sm text-red-800">{error}</p>
				</div>
			{/if}

			{#if success && needsEmailConfirmation}
				<div class="rounded-md bg-green-50 border border-green-200 p-4">
					<p class="text-sm text-green-800">
						Account created successfully! Please check your email ({email}) to confirm your account before logging in.
					</p>
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

				<div>
					<label for="confirmPassword" class="block text-sm font-medium text-gray-700">
						Confirm Password
					</label>
					<input
						id="confirmPassword"
						name="confirmPassword"
						type="password"
						required
						bind:value={confirmPassword}
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
					{loading ? 'Creating account...' : 'Create account'}
				</button>
			</div>
		</form>
	</div>
</div>
