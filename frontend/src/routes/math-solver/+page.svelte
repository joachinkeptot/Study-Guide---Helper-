<script>
  import { onMount } from 'svelte';
  let problem = '';
  let solution = '';
  let loading = false;
  const samples = [
    'Solve for x: 2x + 3 = 11',
    'Find the derivative of f(x) = x^2 + 3x',
    'Integrate: ∫(2x) dx',
    'What is the area of a circle with radius r?',
    'Factor: x^2 - 9'
  ];

  function getStepByStep(problem) {
    // Simple mock logic for step-by-step solutions
    if (problem.includes('2x + 3 = 11')) {
      return `Step 1: Subtract 3 from both sides\n2x + 3 - 3 = 11 - 3\n2x = 8\nStep 2: Divide both sides by 2\nx = 4`;
    }
    if (problem.includes('derivative') && problem.includes('x^2 + 3x')) {
      return `Step 1: Use power rule\nd/dx[x^2] = 2x\nd/dx[3x] = 3\nStep 2: Add results\nFinal answer: 2x + 3`;
    }
    if (problem.includes('Integrate') && problem.includes('2x')) {
      return `Step 1: Use power rule for integration\n∫2x dx = 2 * ∫x dx\n∫x dx = (1/2)x^2\nStep 2: Multiply by 2\nFinal answer: x^2 + C`;
    }
    if (problem.includes('area of a circle')) {
      return `Step 1: Recall formula\nArea = πr^2\nStep 2: Plug in value for r as needed.`;
    }
    if (problem.includes('Factor') && problem.includes('x^2 - 9')) {
      return `Step 1: Recognize difference of squares\nx^2 - 9 = (x + 3)(x - 3)`;
    }
    return `Step 1: Understand the problem\nStep 2: Identify knowns and unknowns\nStep 3: Apply relevant formulas\nStep 4: Solve for the unknowns\n\nExample solution for: ${problem}`;
  }

  async function solveProblem() {
    loading = true;
    solution = '';
    await new Promise(r => setTimeout(r, 900));
    solution = getStepByStep(problem);
    loading = false;
  }
</script>

<div class="max-w-xl mx-auto mt-10 p-6 bg-white dark:bg-gray-800 rounded shadow">
  <h1 class="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Math Problem Solver</h1>
  <label class="block mb-2 text-gray-700 dark:text-gray-300">Enter your math problem:</label>
  <textarea bind:value={problem} rows="3" class="w-full p-2 border rounded bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 mb-4"></textarea>
  <div class="mb-4">
    <span class="text-sm text-gray-500 dark:text-gray-400">Or try a sample:</span>
    <div class="flex flex-wrap gap-2 mt-2">
      {#each samples as sample}
        <button type="button" class="px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded text-xs hover:bg-indigo-200 dark:hover:bg-indigo-800" on:click={() => { problem = sample; solution = ''; }}>
          {sample}
        </button>
      {/each}
    </div>
  </div>
  <button on:click={solveProblem} class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50" disabled={loading || !problem}>
    {loading ? 'Solving...' : 'Show Step-by-Step Solution'}
  </button>
  {#if solution}
    <div class="mt-6 p-4 bg-gray-100 dark:bg-gray-900 rounded text-gray-800 dark:text-gray-100 whitespace-pre-line">
      {solution}
    </div>
  {/if}
</div>
