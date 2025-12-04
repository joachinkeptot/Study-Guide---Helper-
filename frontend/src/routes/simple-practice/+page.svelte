<script>
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { auth } from '$stores/auth-supabase';
	import { simplePracticeAPI } from '$lib/supabase-api';
	import { onMount, tick } from 'svelte';

	// ============================================
	// CONFIGURATION - Set to true to test UI without backend
	// ============================================
	const USE_MOCK_DATA = false; // Set to true to bypass the API and use mock problems

	let topic = '';
	let loading = false;
	let error = '';
	
	/** @type {{ question?: string; options?: string[]; correct_answer?: string; explanation?: string; parts?: Array<{prompt: string; options: string[]; correct_answer: string; explanation: string; visual?: any}>; visual?: any; tags?: string[]; metadata?: any } | null} */
	let currentProblem = null;
	let selectedAnswer = '';
	let showFeedback = false;
	let isCorrect = false;
	
	/** @type {string[]} */
	let partAnswers = [];
	/** @type {boolean[]} */
	let partCorrect = [];
	
	/** @type {string[]} */
	let recentQuestions = [];

	// Settings
	let preferMultiPart = false;
	let difficulty = 'college';
	let numOptions = 4;
	let includeVisuals = true;
	let conceptualDepth = 'intermediate';
	let problemStyle = 'mixed';
	let showSettings = false;

	// Statistics tracking
	let sessionStats = {
		total: 0,
		correct: 0,
		streak: 0,
		longestStreak: 0
	};

	// Library ready flags
	let mathJaxReady = false;
	let mermaidReady = false;

	// Debug mode - shows raw API response
	let showDebug = false;
	let lastApiResponse = null;

	// ============================================
	// MOCK DATA GENERATOR (for testing UI)
	// ============================================
	function generateMockProblem(topicName, options) {
		const { preferMultiPart, numOptions: optCount, difficulty: diff } = options;
		
		if (preferMultiPart) {
			return {
				question: `Consider the following aspects of ${topicName}:`,
				parts: [
					{
						prompt: `What is the fundamental principle behind ${topicName}?`,
						options: generateMockOptions(optCount, 'A'),
						correct_answer: 'Option A - The correct fundamental principle',
						explanation: `This is the explanation for part A about ${topicName}.`
					},
					{
						prompt: `How does ${topicName} apply in real-world scenarios?`,
						options: generateMockOptions(optCount, 'B'),
						correct_answer: 'Option B - The correct application',
						explanation: `This is the explanation for part B about ${topicName}.`
					}
				],
				tags: [topicName, diff, 'multi-part'],
				metadata: {
					difficulty: diff,
					conceptualDepth: options.conceptualDepth,
					problemStyle: options.problemStyle,
					hasVisual: false
				}
			};
		}
		
		return {
			question: `In the context of ${topicName}, which of the following statements is most accurate regarding its ${diff} level application?`,
			options: generateMockOptions(optCount, 'single'),
			correct_answer: 'Option A - This is the correct answer',
			explanation: `The correct answer is Option A because it accurately describes the key concept in ${topicName}. The other options contain common misconceptions.`,
			tags: [topicName, diff],
			metadata: {
				difficulty: diff,
				conceptualDepth: options.conceptualDepth,
				problemStyle: options.problemStyle,
				hasVisual: false
			}
		};
	}

	function generateMockOptions(count, prefix) {
		const options = [];
		for (let i = 0; i < count; i++) {
			const letter = String.fromCharCode(65 + i);
			if (i === 0) {
				options.push(`Option ${letter} - This is the correct answer`);
			} else {
				options.push(`Option ${letter} - This is an incorrect option (distractor ${i})`);
			}
		}
		return options;
	}

	// ============================================
	// LIFECYCLE & INITIALIZATION
	// ============================================
	onMount(() => {
		if (!browser) return;
		loadSettings();
		
		if (includeVisuals) {
			initMathJax();
			initMermaid();
		}
	});

	function loadSettings() {
		try {
			const saved = localStorage.getItem('practiceSettings');
			if (saved) {
				const settings = JSON.parse(saved);
				difficulty = settings.difficulty || 'college';
				numOptions = clampNumOptions(settings.numOptions);
				includeVisuals = settings.includeVisuals ?? true;
				conceptualDepth = settings.conceptualDepth || 'intermediate';
				problemStyle = settings.problemStyle || 'mixed';
				preferMultiPart = settings.preferMultiPart || false;
			}
		} catch (e) {
			console.error('Failed to load settings:', e);
		}
	}

	function saveSettings() {
		if (!browser) return;
		try {
			localStorage.setItem('practiceSettings', JSON.stringify({
				difficulty,
				numOptions,
				includeVisuals,
				conceptualDepth,
				problemStyle,
				preferMultiPart
			}));
		} catch (e) {
			console.error('Failed to save settings:', e);
		}
	}

	function clampNumOptions(value) {
		const num = parseInt(value);
		if (isNaN(num) || num < 2) return 2;
		if (num > 6) return 6;
		return num;
	}

	function initMathJax() {
		if (typeof window === 'undefined') return;
		const checkMathJax = () => {
			if (window.MathJax?.typesetPromise) {
				mathJaxReady = true;
				console.log('✓ MathJax ready');
			} else {
				setTimeout(checkMathJax, 200);
			}
		};
		checkMathJax();
	}

	function initMermaid() {
		if (typeof window === 'undefined') return;
		const checkMermaid = () => {
			if (window.mermaid?.initialize) {
				window.mermaid.initialize({ startOnLoad: false, theme: 'neutral' });
				mermaidReady = true;
				console.log('✓ Mermaid ready');
			} else {
				setTimeout(checkMermaid, 200);
			}
		};
		checkMermaid();
	}

	async function renderMath() {
		if (!browser || !mathJaxReady || !window.MathJax?.typesetPromise) return;
		await tick();
		try {
			await window.MathJax.typesetPromise();
		} catch (err) {
			console.error('MathJax render error:', err);
		}
	}

	async function renderMermaid() {
		if (!browser || !mermaidReady || !window.mermaid?.run) return;
		await tick();
		try {
			await window.mermaid.run();
		} catch (err) {
			console.error('Mermaid render error:', err);
		}
	}

	// Reactive: re-render visuals when problem changes
	$: if (browser && currentProblem && includeVisuals) {
		renderMath();
		renderMermaid();
	}

	// Reactive: save settings when they change
	$: if (browser) {
		// This will trigger whenever any of these change
		difficulty; numOptions; includeVisuals; conceptualDepth; problemStyle; preferMultiPart;
		saveSettings();
	}

	// ============================================
	// PROBLEM GENERATION
	// ============================================
	function handleNumOptionsChange(event) {
		numOptions = clampNumOptions(event.target.value);
	}

	async function generateProblem() {
		if (loading) return;
		
		const trimmedTopic = topic.trim();
		if (!trimmedTopic) {
			error = 'Please enter a topic';
			return;
		}

		loading = true;
		error = '';
		currentProblem = null;
		showFeedback = false;
		selectedAnswer = '';
		partAnswers = [];
		partCorrect = [];
		lastApiResponse = null;

		const requestPayload = {
			recentProblems: recentQuestions,
			preferMultiPart,
			difficulty,
			numOptions,
			includeVisuals,
			conceptualDepth,
			problemStyle,
		};

		console.log('📤 Generating problem with:', { topic: trimmedTopic, ...requestPayload });

		try {
			let data;
			
			if (USE_MOCK_DATA) {
				// Use mock data for testing
				console.log('🎭 Using MOCK data (USE_MOCK_DATA = true)');
				await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
				data = generateMockProblem(trimmedTopic, requestPayload);
			} else {
				// Call the real API
				data = await simplePracticeAPI.generateProblem(trimmedTopic, requestPayload);
			}
			
			console.log('📥 Received problem:', data);
			lastApiResponse = data;

			// Validate response exists
			if (!data || typeof data !== 'object') {
				throw new Error('Invalid response from API - no data received');
			}

			// Determine problem type and validate
			const hasValidQuestion = data.question && typeof data.question === 'string';
			const hasValidOptions = Array.isArray(data.options) && data.options.length >= 2;
			const hasValidParts = Array.isArray(data.parts) && data.parts.length > 0;

			// Single-part validation
			const isSinglePart = hasValidQuestion && hasValidOptions && data.correct_answer;
			
			// Multi-part validation
			let isMultiPart = false;
			if (hasValidParts) {
				isMultiPart = data.parts.every(part => 
					part.prompt && 
					typeof part.prompt === 'string' &&
					Array.isArray(part.options) && 
					part.options.length >= 2 &&
					part.correct_answer
				);
			}

			if (!isSinglePart && !isMultiPart) {
				console.error('❌ Invalid problem structure:', {
					hasValidQuestion,
					hasValidOptions,
					hasValidParts,
					isSinglePart,
					isMultiPart,
					data
				});
				throw new Error(
					'Invalid problem structure received. ' +
					'Please check the Edge Function logs for details.'
				);
			}

			// Normalize the problem data
			currentProblem = normalizeProblem(data);
			console.log('✓ Problem validated and normalized:', currentProblem);

			// Initialize part answers for multi-part
			if (isMultiPart) {
				partAnswers = new Array(data.parts.length).fill('');
				partCorrect = new Array(data.parts.length).fill(false);
			}

			// Track for diversity
			const questionContext = data.question || (data.parts?.map(p => p.prompt).join(' ') || '');
			const fullContext = `${questionContext} ${(data.tags || []).join(' ')}`;
			recentQuestions = [...recentQuestions.slice(-9), fullContext];

		} catch (err) {
			console.error('❌ Error generating problem:', err);
			
			// Create user-friendly error message
			if (err instanceof Error) {
				if (err.message.includes('Failed to fetch') || err.message.includes('network')) {
					error = 'Network error. Please check your internet connection and try again.';
				} else if (err.message.includes('Edge Function') || err.message.includes('invoke')) {
					error = 'The problem generation service is unavailable. Please try again later.';
				} else {
					error = err.message;
				}
			} else {
				error = 'An unexpected error occurred. Please try again.';
			}
		} finally {
			loading = false;
		}
	}

	/**
	 * Normalize problem data to ensure consistent structure
	 */
	function normalizeProblem(data) {
		const normalized = { ...data };
		
		// Ensure options are strings
		if (Array.isArray(normalized.options)) {
			normalized.options = normalized.options.map(opt => String(opt));
		}
		
		// Ensure correct_answer is string
		if (normalized.correct_answer != null) {
			normalized.correct_answer = String(normalized.correct_answer);
		}
		
		// Normalize parts
		if (Array.isArray(normalized.parts)) {
			normalized.parts = normalized.parts.map(part => ({
				...part,
				options: Array.isArray(part.options) ? part.options.map(opt => String(opt)) : [],
				correct_answer: part.correct_answer != null ? String(part.correct_answer) : '',
				prompt: part.prompt || '',
				explanation: part.explanation || ''
			}));
		}
		
		// Ensure tags is an array
		if (!Array.isArray(normalized.tags)) {
			normalized.tags = [];
		}
		
		// Ensure metadata exists
		if (!normalized.metadata || typeof normalized.metadata !== 'object') {
			normalized.metadata = {};
		}
		
		return normalized;
	}

	// ============================================
	// ANSWER HANDLING
	// ============================================
	function selectAnswer(answer) {
		if (showFeedback) return;
		selectedAnswer = String(answer);
	}

	function selectPartAnswer(partIndex, answer) {
		if (showFeedback) return;
		partAnswers[partIndex] = String(answer);
		partAnswers = [...partAnswers]; // Trigger reactivity
	}

	/**
	 * Compare two answers for equality (handles various edge cases)
	 */
	function answersMatch(userAnswer, correctAnswer) {
		if (!userAnswer || !correctAnswer) return false;
		
		const normalize = (str) => String(str)
			.trim()
			.toLowerCase()
			.replace(/\s+/g, ' '); // Normalize whitespace
		
		const userNorm = normalize(userAnswer);
		const correctNorm = normalize(correctAnswer);
		
		// Exact match
		if (userNorm === correctNorm) return true;
		
		// Check if one contains the other (for partial matches)
		if (userNorm.includes(correctNorm) || correctNorm.includes(userNorm)) {
			// Only match if the shorter one is at least 80% of the longer
			const shorter = Math.min(userNorm.length, correctNorm.length);
			const longer = Math.max(userNorm.length, correctNorm.length);
			if (shorter / longer > 0.8) return true;
		}
		
		return false;
	}

	function submitAnswer() {
		if (!currentProblem || showFeedback) return;
		
		// Multi-part question
		if (isMultiPart) {
			const allAnswered = partAnswers.length === currentProblem.parts.length && 
				partAnswers.every(a => a !== '');
			
			if (!allAnswered) {
				error = 'Please answer all parts before submitting';
				return;
			}
			
			error = '';
			partCorrect = currentProblem.parts.map((p, i) => {
				return answersMatch(partAnswers[i], p.correct_answer);
			});
			isCorrect = partCorrect.every(Boolean);
			showFeedback = true;
			updateStats(isCorrect);
			return;
		}
		
		// Single-part question
		if (!selectedAnswer) {
			error = 'Please select an answer';
			return;
		}
		
		error = '';
		isCorrect = answersMatch(selectedAnswer, currentProblem.correct_answer);
		showFeedback = true;
		updateStats(isCorrect);
	}

	function updateStats(correct) {
		const newStreak = correct ? sessionStats.streak + 1 : 0;
		sessionStats = {
			total: sessionStats.total + 1,
			correct: sessionStats.correct + (correct ? 1 : 0),
			streak: newStreak,
			longestStreak: Math.max(sessionStats.longestStreak, newStreak)
		};
	}

	// ============================================
	// NAVIGATION
	// ============================================
	function nextProblem() {
		if (loading) return;
		showFeedback = false;
		selectedAnswer = '';
		partAnswers = [];
		partCorrect = [];
		currentProblem = null;
		error = '';
		generateProblem();
	}

	function changeTopic() {
		currentProblem = null;
		showFeedback = false;
		selectedAnswer = '';
		partAnswers = [];
		partCorrect = [];
		topic = '';
		error = '';
		recentQuestions = [];
		lastApiResponse = null;
	}

	function toggleSettings() {
		showSettings = !showSettings;
	}

	function toggleDebug() {
		showDebug = !showDebug;
	}

	function resetStats() {
		sessionStats = {
			total: 0,
			correct: 0,
			streak: 0,
			longestStreak: 0
		};
	}

	function handleKeydown(event) {
		if (event.key === 'Enter' && !loading && topic.trim()) {
			generateProblem();
		}
	}

	// ============================================
	// COMPUTED VALUES
	// ============================================
	$: accuracy = sessionStats.total > 0 
		? Math.round((sessionStats.correct / sessionStats.total) * 100) 
		: 0;
	
	$: isMultiPart = currentProblem?.parts && 
		Array.isArray(currentProblem.parts) && 
		currentProblem.parts.length > 0;
	
	$: canSubmit = currentProblem && !showFeedback && (
		(isMultiPart && partAnswers.length > 0 && partAnswers.every(a => a !== '')) ||
		(!isMultiPart && selectedAnswer !== '')
	);
</script>

<svelte:head>
	<title>Simple Practice - Study Helper</title>
	{#if includeVisuals}
		<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
		<script src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/tex-mml-chtml.min.js"></script>
	{/if}
</svelte:head>

{#if $auth.isAuthenticated}
	<div class="max-w-4xl mx-auto py-8 px-4">
		<!-- Header with Stats -->
		<div class="mb-8">
			<div class="flex items-start justify-between flex-wrap gap-4">
				<div>
					<h1 class="text-3xl font-bold text-gray-900 mb-2">🎯 AI Practice Generator</h1>
					<p class="text-gray-600">Master any topic with adaptive, AI-powered practice</p>
					{#if USE_MOCK_DATA}
						<p class="text-xs text-orange-600 mt-1">⚠️ MOCK MODE ENABLED - Using fake data for testing</p>
					{/if}
				</div>
				{#if sessionStats.total > 0}
					<div class="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-200">
						<div class="text-sm text-gray-600 mb-1">Session Stats</div>
						<div class="flex gap-4 text-sm">
							<div>
								<div class="font-bold text-indigo-700">{sessionStats.correct}/{sessionStats.total}</div>
								<div class="text-xs text-gray-500">Score</div>
							</div>
							<div>
								<div class="font-bold text-purple-700">{accuracy}%</div>
								<div class="text-xs text-gray-500">Accuracy</div>
							</div>
							<div>
								<div class="font-bold text-green-700">{sessionStats.streak} 🔥</div>
								<div class="text-xs text-gray-500">Streak</div>
							</div>
						</div>
						<button
							on:click={resetStats}
							class="mt-2 text-xs text-gray-500 hover:text-gray-700 underline"
							type="button"
						>
							Reset Stats
						</button>
					</div>
				{/if}
			</div>
		</div>

		<!-- Topic Input -->
		<div class="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
			<label for="topic-input" class="block text-sm font-medium text-gray-700 mb-2">
				What do you want to practice?
			</label>
			<div class="flex gap-3">
				<input
					id="topic-input"
					type="text"
					bind:value={topic}
					placeholder="e.g., Quantum mechanics, Machine learning, Organic chemistry..."
					disabled={loading}
					on:keydown={handleKeydown}
					class="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg
						focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
						transition-all text-gray-900 placeholder-gray-400
						disabled:opacity-60 disabled:cursor-not-allowed"
				/>
				<button
					on:click={generateProblem}
					disabled={loading || !topic.trim()}
					type="button"
					class="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg
						hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 
						focus:ring-offset-2 transition-all shadow-md hover:shadow-lg
						disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{#if loading}
						<span class="flex items-center gap-2">
							<svg class="animate-spin h-4 w-4" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
							</svg>
							Generating...
						</span>
					{:else}
						✨ Generate Problem
					{/if}
				</button>
			</div>

			<!-- Settings & Debug Toggle -->
			<div class="mt-4 flex gap-4">
				<button
					on:click={toggleSettings}
					type="button"
					class="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-2 transition-colors"
				>
					<span class="transition-transform duration-200" class:rotate-90={showSettings}>▶</span>
					{showSettings ? 'Hide' : 'Show'} Settings
				</button>
				<button
					on:click={toggleDebug}
					type="button"
					class="text-sm text-gray-500 hover:text-gray-700 font-medium flex items-center gap-2 transition-colors"
				>
					🔧 {showDebug ? 'Hide' : 'Show'} Debug
				</button>
			</div>

			<!-- Settings Panel -->
			{#if showSettings}
				<div class="mt-4 p-5 bg-gradient-to-br from-gray-50 to-indigo-50 rounded-lg border border-indigo-100 space-y-5">
					<div class="grid grid-cols-1 md:grid-cols-2 gap-5">
						<!-- Difficulty -->
						<div>
							<label for="difficulty-select" class="block text-sm font-medium text-gray-700 mb-2">
								📊 Difficulty Level
							</label>
							<select
								id="difficulty-select"
								bind:value={difficulty}
								disabled={loading}
								class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white
									focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500
									disabled:opacity-60 disabled:cursor-not-allowed"
							>
								<option value="easy">Easy - High School Level</option>
								<option value="medium">Medium - Undergraduate</option>
								<option value="college">College - Standard Academic</option>
								<option value="hard">Hard - Advanced/Graduate</option>
							</select>
						</div>

						<!-- Conceptual Depth -->
						<div>
							<label for="depth-select" class="block text-sm font-medium text-gray-700 mb-2">
								🧠 Conceptual Depth
							</label>
							<select
								id="depth-select"
								bind:value={conceptualDepth}
								disabled={loading}
								class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white
									focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500
									disabled:opacity-60 disabled:cursor-not-allowed"
							>
								<option value="surface">Surface - Definitions & Recall</option>
								<option value="intermediate">Intermediate - Understanding & Application</option>
								<option value="deep">Deep - Analysis & Synthesis</option>
							</select>
						</div>

						<!-- Problem Style -->
						<div>
							<label for="style-select" class="block text-sm font-medium text-gray-700 mb-2">
								🎨 Problem Style
							</label>
							<select
								id="style-select"
								bind:value={problemStyle}
								disabled={loading}
								class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white
									focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500
									disabled:opacity-60 disabled:cursor-not-allowed"
							>
								<option value="theoretical">Theoretical - Conceptual Focus</option>
								<option value="applied">Applied - Real-World Problems</option>
								<option value="mixed">Mixed - Balanced Approach</option>
							</select>
						</div>

						<!-- Number of Options -->
						<div>
							<label for="num-options" class="block text-sm font-medium text-gray-700 mb-2">
								🔢 Answer Choices: {numOptions}
							</label>
							<input
								id="num-options"
								type="range"
								min="2"
								max="6"
								step="1"
								value={numOptions}
								on:input={handleNumOptionsChange}
								disabled={loading}
								class="w-full h-2 bg-gradient-to-r from-indigo-200 to-purple-200 rounded-lg appearance-none cursor-pointer
									disabled:opacity-60 disabled:cursor-not-allowed"
							/>
							<div class="flex justify-between text-xs text-gray-500 mt-1">
								<span>2</span>
								<span>3</span>
								<span>4</span>
								<span>5</span>
								<span>6</span>
							</div>
						</div>
					</div>

					<!-- Toggle Options -->
					<div class="flex flex-wrap gap-4 pt-3 border-t border-indigo-200">
						<label class="flex items-center gap-2 cursor-pointer">
							<input
								type="checkbox"
								bind:checked={preferMultiPart}
								disabled={loading}
								class="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500
									disabled:opacity-60 disabled:cursor-not-allowed"
							/>
							<span class="text-sm text-gray-700">🔗 Multi-part questions</span>
						</label>
						
						<label class="flex items-center gap-2 cursor-pointer">
							<input
								type="checkbox"
								bind:checked={includeVisuals}
								disabled={loading}
								class="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500
									disabled:opacity-60 disabled:cursor-not-allowed"
							/>
							<span class="text-sm text-gray-700">📊 Include visuals</span>
						</label>
					</div>
				</div>
			{/if}

			<!-- Debug Panel -->
			{#if showDebug && lastApiResponse}
				<div class="mt-4 p-4 bg-gray-900 text-green-400 rounded-lg text-xs font-mono overflow-x-auto">
					<div class="text-gray-400 mb-2">// Last API Response:</div>
					<pre>{JSON.stringify(lastApiResponse, null, 2)}</pre>
				</div>
			{/if}

			{#if error}
				<div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
					<span class="text-red-500 text-lg">⚠️</span>
					<div class="flex-1">
						<p class="text-sm text-red-600">{error}</p>
						<p class="text-xs text-red-500 mt-1">
							Check browser console (F12) for details. 
							<button on:click={toggleDebug} class="underline">Show debug panel</button>
						</p>
					</div>
				</div>
			{/if}
		</div>

		<!-- Problem Display -->
		{#if currentProblem}
			<div class="bg-white rounded-lg shadow-lg border-2 border-indigo-100 p-6">
				<!-- Metadata -->
				{#if currentProblem.metadata && Object.keys(currentProblem.metadata).length > 0}
					<div class="mb-3 text-xs text-gray-400 flex flex-wrap gap-2">
						{#each Object.entries(currentProblem.metadata) as [key, value]}
							<span class="bg-gray-100 px-2 py-0.5 rounded">{key}: {value}</span>
						{/each}
					</div>
				{/if}

				<!-- Tags -->
				{#if currentProblem.tags && currentProblem.tags.length > 0}
					<div class="mb-4 flex flex-wrap gap-2">
						{#each currentProblem.tags as tag}
							<span class="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
								{tag}
							</span>
						{/each}
					</div>
				{/if}

				<!-- Question -->
				<div class="mb-6">
					{#if currentProblem.question}
						<div class="flex items-start gap-3 mb-4">
							<div class="text-2xl shrink-0">❓</div>
							<p class="text-lg text-gray-900 leading-relaxed flex-1">{currentProblem.question}</p>
						</div>
					{/if}

					<!-- Visual for single-part -->
					{#if currentProblem.visual && !isMultiPart}
						<div class="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
							{#if currentProblem.visual.description}
								<div class="text-sm font-medium text-gray-600 mb-2">
									📊 {currentProblem.visual.description}
								</div>
							{/if}
							{#if currentProblem.visual.type === 'equation' && currentProblem.visual.content}
								<div class="text-center py-2 overflow-x-auto math-display">
									\[{currentProblem.visual.content}\]
								</div>
							{:else if currentProblem.visual.type === 'code' && currentProblem.visual.content}
								<pre class="text-sm bg-gray-900 text-green-400 p-3 rounded overflow-x-auto"><code>{currentProblem.visual.content}</code></pre>
							{:else if currentProblem.visual.content}
								<pre class="text-sm bg-white p-3 rounded border border-gray-300 overflow-x-auto whitespace-pre">{currentProblem.visual.content}</pre>
							{/if}
						</div>
					{/if}
				</div>

				<!-- Answer Options -->
				{#if !showFeedback}
					{#if isMultiPart}
						<!-- Multi-part -->
						<div class="space-y-6 mb-6">
							{#each currentProblem.parts as part, pIndex (pIndex)}
								<div class="space-y-3 p-4 bg-gradient-to-br from-gray-50 to-indigo-50 rounded-lg border border-indigo-100">
									<h3 class="text-md font-semibold text-gray-900 flex items-center gap-2">
										<span class="flex items-center justify-center w-6 h-6 bg-indigo-600 text-white text-xs font-bold rounded-full">
											{String.fromCharCode(65 + pIndex)}
										</span>
										{part.prompt}
									</h3>

									{#if part.visual}
										<div class="mb-3 p-3 bg-white rounded border border-gray-200">
											{#if part.visual.description}
												<div class="text-xs font-medium text-gray-600 mb-2">📊 {part.visual.description}</div>
											{/if}
											{#if part.visual.type === 'equation' && part.visual.content}
												<div class="text-center py-2 overflow-x-auto math-display">\[{part.visual.content}\]</div>
											{:else if part.visual.content}
												<pre class="text-xs p-2 rounded overflow-x-auto whitespace-pre">{part.visual.content}</pre>
											{/if}
										</div>
									{/if}

									<div class="space-y-2">
										{#each part.options as option, optIndex (optIndex)}
											<button
												on:click={() => selectPartAnswer(pIndex, option)}
												type="button"
												class="w-full text-left p-3 rounded-lg border-2 transition-all cursor-pointer
													focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
													{partAnswers[pIndex] === String(option)
														? 'border-indigo-500 bg-indigo-100 shadow-md'
														: 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50'}"
											>
												<div class="flex items-center gap-3">
													<div class="shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center
														{partAnswers[pIndex] === String(option) ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'}">
														{#if partAnswers[pIndex] === String(option)}
															<div class="w-2 h-2 rounded-full bg-white"></div>
														{/if}
													</div>
													<span class="text-xs text-gray-500 font-medium w-5">{String.fromCharCode(65 + optIndex)}.</span>
													<span class="flex-1 text-gray-900 text-sm">{option}</span>
												</div>
											</button>
										{/each}
									</div>
								</div>
							{/each}
						</div>
					{:else if currentProblem.options && currentProblem.options.length > 0}
						<!-- Single-part -->
						<div class="space-y-3 mb-6">
							{#each currentProblem.options as option, index (index)}
								<button
									on:click={() => selectAnswer(option)}
									type="button"
									class="w-full text-left p-4 rounded-lg border-2 transition-all cursor-pointer
										focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
										{selectedAnswer === String(option)
											? 'border-indigo-500 bg-indigo-100 shadow-md'
											: 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50'}"
								>
									<div class="flex items-center gap-3">
										<div class="shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center
											{selectedAnswer === String(option) ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'}">
											{#if selectedAnswer === String(option)}
												<div class="w-2 h-2 rounded-full bg-white"></div>
											{/if}
										</div>
										<span class="text-sm text-gray-500 font-medium w-6">{String.fromCharCode(65 + index)}.</span>
										<span class="flex-1 text-gray-900">{option}</span>
									</div>
								</button>
							{/each}
						</div>
					{:else}
						<div class="text-red-600 mb-4 p-3 bg-red-50 rounded-lg">
							Error: No answer options available.
						</div>
					{/if}

					<button
						on:click={submitAnswer}
						disabled={!canSubmit}
						type="button"
						class="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg
							hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 
							focus:ring-offset-2 transition-all shadow-md hover:shadow-lg
							disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isMultiPart ? 'Submit All Answers' : 'Submit Answer'}
					</button>
				{/if}

				<!-- Feedback -->
				{#if showFeedback}
					<div class="mb-6 space-y-4">
						<div class="rounded-lg p-5 shadow-md {isCorrect 
							? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300' 
							: 'bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-300'}">
							<div class="flex items-start gap-3">
								<span class="text-3xl">{isCorrect ? '✓' : '✗'}</span>
								<div class="flex-1">
									<h3 class="text-xl font-bold mb-2 {isCorrect ? 'text-green-900' : 'text-red-900'}">
										{isCorrect ? '🎉 Correct!' : '❌ Incorrect'}
									</h3>
									
									{#if isMultiPart}
										<p class="text-sm text-gray-800 font-medium">
											{partCorrect.filter(Boolean).length} of {partCorrect.length} parts correct
										</p>
									{:else}
										{#if !isCorrect && currentProblem.correct_answer}
											<p class="text-sm mb-3 font-medium text-red-700">
												Correct answer: <strong>{currentProblem.correct_answer}</strong>
											</p>
										{/if}
										{#if currentProblem.explanation}
											<p class="text-sm leading-relaxed {isCorrect ? 'text-green-900' : 'text-red-900'}">
												{currentProblem.explanation}
											</p>
										{/if}
									{/if}
								</div>
							</div>
						</div>

						{#if isMultiPart}
							<div class="space-y-3">
								{#each currentProblem.parts as part, pIndex (pIndex)}
									<div class="rounded-lg p-4 border-2 {partCorrect[pIndex] 
										? 'border-green-300 bg-green-50' 
										: 'border-red-300 bg-red-50'}">
										<h4 class="font-semibold text-gray-900 mb-2 flex items-center gap-2">
											<span class="flex items-center justify-center w-5 h-5 text-white text-xs font-bold rounded-full
												{partCorrect[pIndex] ? 'bg-green-600' : 'bg-red-600'}">
												{String.fromCharCode(65 + pIndex)}
											</span>
											Part {String.fromCharCode(65 + pIndex)} {partCorrect[pIndex] ? '✓' : '✗'}
										</h4>
										{#if !partCorrect[pIndex] && part.correct_answer}
											<p class="text-sm text-red-800 mb-2 font-medium">
												Correct: <strong>{part.correct_answer}</strong>
											</p>
										{/if}
										{#if part.explanation}
											<p class="text-sm text-gray-900">{part.explanation}</p>
										{/if}
									</div>
								{/each}
							</div>
						{/if}
					</div>

					<div class="flex gap-3">
						<button
							on:click={nextProblem}
							disabled={loading}
							type="button"
							class="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg
								hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 
								focus:ring-offset-2 transition-all shadow-md hover:shadow-lg
								disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{loading ? 'Loading...' : 'Next Problem →'}
						</button>
						<button
							on:click={changeTopic}
							type="button"
							class="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg
								hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 
								focus:ring-offset-2 transition-all"
						>
							Change Topic
						</button>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Empty State -->
		{#if !currentProblem && !loading && !error}
			<div class="text-center py-12 text-gray-500">
				<div class="text-6xl mb-4">📚</div>
				<p class="text-lg">Enter a topic above and click "Generate Problem" to start!</p>
				<p class="text-sm mt-2 text-gray-400">Try topics like: Calculus, World War II, Python programming, Cell biology...</p>
			</div>
		{/if}
	</div>
{:else}
	<div class="max-w-md mx-auto py-16 px-4 text-center">
		<div class="text-6xl mb-4">🔒</div>
		<h2 class="text-2xl font-bold text-gray-900 mb-2">Sign In Required</h2>
		<p class="text-gray-600 mb-6">Please sign in to access the AI Practice Generator.</p>
	</div>
{/if}

<style>
	:global(.math-display) {
		font-size: 1.1em;
		padding: 0.5rem;
	}

	pre code {
		font-family: 'Courier New', Consolas, monospace;
		font-size: 0.9em;
		line-height: 1.4;
	}

	button {
		transition: all 0.2s ease-in-out;
	}

	pre::-webkit-scrollbar {
		height: 8px;
	}

	pre::-webkit-scrollbar-track {
		background: #f1f1f1;
		border-radius: 4px;
	}

	pre::-webkit-scrollbar-thumb {
		background: #888;
		border-radius: 4px;
	}

	pre {
		white-space: pre-wrap;
		word-wrap: break-word;
	}

	input[type="range"] {
		-webkit-appearance: none;
		appearance: none;
	}

	input[type="range"]::-webkit-slider-thumb {
		-webkit-appearance: none;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: #4f46e5;
		cursor: pointer;
		border: 2px solid white;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	input[type="range"]::-moz-range-thumb {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: #4f46e5;
		cursor: pointer;
		border: 2px solid white;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.rotate-90 {
		transform: rotate(90deg);
	}
</style>