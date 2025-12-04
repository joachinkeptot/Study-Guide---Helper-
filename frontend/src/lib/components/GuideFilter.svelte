<script>
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	/** @type {string[]} */
	export let allTags = [];
	/** @type {string | null} */
	export let selectedTag = null;
	export let searchQuery = '';

	/**
	 * @param {string | null} tag
	 */
	function selectTag(tag) {
		selectedTag = tag === selectedTag ? null : tag;
		dispatch('filterChange', { tag: selectedTag, search: searchQuery });
	}

	function handleSearchInput() {
		dispatch('filterChange', { tag: selectedTag, search: searchQuery });
	}
</script>

<div class="bg-white rounded-lg border border-gray-200 p-4 mb-6">
	<div class="flex flex-col md:flex-row gap-4">
		<!-- Search -->
		<div class="flex-1">
			<div class="relative">
				<input
					type="text"
					bind:value={searchQuery}
					on:input={handleSearchInput}
					placeholder="Search guides..."
					class="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
				/>
				<span class="absolute left-3 top-2.5 text-gray-400 text-lg">🔍</span>
			</div>
		</div>

		<!-- Tag Filter -->
		{#if allTags.length > 0}
			<div class="flex flex-wrap gap-2 items-center">
				<span class="text-sm font-medium text-gray-700">Filter:</span>
				<button
					on:click={() => selectTag(null)}
					class="px-3 py-1 rounded-full text-sm transition-colors
						{selectedTag === null 
							? 'bg-indigo-600 text-white' 
							: 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
				>
					All
				</button>
				{#each allTags as tag}
					<button
						on:click={() => selectTag(tag)}
						class="px-3 py-1 rounded-full text-sm transition-colors
							{selectedTag === tag 
								? 'bg-indigo-600 text-white' 
								: 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
					>
						{tag}
					</button>
				{/each}
			</div>
		{/if}
	</div>
</div>
