<script>
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	/** @type {number} */
	export let guideId;
	export let hasWeakAreas = false;

	const modes = [
		{
			id: 'normal',
			name: 'Full Practice',
			icon: '📝',
			description: 'Practice all topics with hints',
			color: 'indigo'
		},
		{
			id: 'quick_practice',
			name: 'Quick Practice',
			icon: '⚡',
			description: 'Just 5 random questions',
			color: 'blue'
		},
		{
			id: 'weak_areas',
			name: 'Weak Areas Review',
			icon: '🎯',
			description: 'Focus on topics below 70%',
			color: 'orange',
			disabled: !hasWeakAreas
		},
		{
			id: 'exam_mode',
			name: 'Exam Mode',
			icon: '⏱️',
			description: 'Timed, no hints, final score',
			color: 'red'
		}
	];

	/**
	 * @param {string} modeId
	 */
	function selectMode(modeId) {
		const mode = modes.find(m => m.id === modeId);
		if (mode && !mode.disabled) {
			dispatch('selectMode', { mode: modeId, guideId });
		}
	}
</script>

<div class="bg-white rounded-lg border border-gray-200 p-6">
	<h3 class="text-lg font-semibold text-gray-900 mb-4">Choose Practice Mode</h3>
	
	<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
		{#each modes as mode}
			<button
				on:click={() => selectMode(mode.id)}
				disabled={mode.disabled}
				class="text-left p-4 rounded-lg border-2 transition-all
					{mode.disabled 
						? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed' 
						: `border-${mode.color}-200 hover:border-${mode.color}-400 hover:bg-${mode.color}-50 cursor-pointer`}
					focus:outline-none focus:ring-2 focus:ring-${mode.color}-500"
			>
				<div class="flex items-start gap-3">
					<div class="text-3xl">{mode.icon}</div>
					<div class="flex-1">
						<h4 class="font-semibold text-gray-900 mb-1">
							{mode.name}
						</h4>
						<p class="text-sm text-gray-600">
							{mode.description}
						</p>
						{#if mode.disabled}
							<p class="text-xs text-gray-500 mt-1">
								No weak areas found
							</p>
						{/if}
					</div>
				</div>
			</button>
		{/each}
	</div>

	<div class="mt-6 pt-4 border-t border-gray-200">
		<div class="flex items-start gap-2 text-sm text-gray-600">
			<span class="text-lg">💡</span>
			<p>
				<strong>Tip:</strong> Use Exam Mode when you're ready to simulate test conditions. 
				Practice Weak Areas regularly to improve your overall score.
			</p>
		</div>
	</div>
</div>
