<script>
	export let type = 'card'; // 'card', 'list', 'text'
	export let count = 3;
</script>

{#if type === 'card'}
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
		{#each Array(count) as _, i (i)}
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
				<div class="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
				<div class="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
				<div class="h-4 bg-gray-200 rounded w-full mb-4"></div>
				<div class="h-10 bg-gray-200 rounded w-full"></div>
			</div>
		{/each}
	</div>
{:else if type === 'list'}
	<div class="space-y-4">
		{#each Array(count) as _, i (i)}
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse">
				<div class="h-5 bg-gray-200 rounded w-2/3 mb-3"></div>
				<div class="h-4 bg-gray-200 rounded w-full mb-2"></div>
				<div class="h-4 bg-gray-200 rounded w-5/6"></div>
			</div>
		{/each}
	</div>
{:else if type === 'text'}
	<div class="space-y-2">
		{#each Array(count) as _, i (i)}
			<div class="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
		{/each}
	</div>
{/if}
