<script>
	import { page } from '$app/stores';

	$: error = $page.error;
	$: status = $page.status;
</script>

<svelte:head>
	<title>{status} - Error</title>
</svelte:head>

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
					<h2 class="text-xl font-semibold text-gray-900 mb-2">
						{#if status === 404}
							Page Not Found
						{:else if status === 500}
							Internal Server Error
						{:else}
							Error {status}
						{/if}
					</h2>
					<p class="text-sm text-gray-700 leading-relaxed">
						{#if error?.message}
							{error.message}
						{:else if status === 404}
							The page you're looking for doesn't exist.
						{:else if status === 500}
							Something went wrong on our end. Please try again later.
						{:else}
							An unexpected error occurred.
						{/if}
					</p>
				</div>
			</div>
			
			<div class="flex flex-col sm:flex-row gap-3">
				<a 
					href="/"
					class="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 
						bg-indigo-600 text-white text-sm font-medium rounded-md 
						hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 
						focus:ring-offset-2 transition-colors"
				>
					← Go Home
				</a>
				<button
					on:click={() => window.location.reload()}
					class="flex-1 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md 
						hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 
						focus:ring-offset-2 transition-colors"
				>
					🔄 Refresh Page
				</button>
			</div>
		</div>
	</div>
</div>
