<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { auth } from '$stores/auth-supabase';
	import supabaseAPI from '$lib/supabase-api.js';
	import { supabase } from '$lib/supabase.js';
	import FileUpload from '$lib/components/FileUpload.svelte';
	import GuideCard from '$lib/components/GuideCard.svelte';
	import GuideDetail from '$lib/components/GuideDetail.svelte';
	import LoadingSkeleton from '$lib/components/LoadingSkeleton.svelte';
	import StreakTracker from '$lib/components/StreakTracker.svelte';
	import GuideFilter from '$lib/components/GuideFilter.svelte';
    import { extractTextFromPDF } from '$lib/pdf.js';


	/** @type {any[]} */
	let guides = [];
	/** @type {any[]} */
	let filteredGuides = [];
	/** @type {string[]} */
	let allTags = [];
	let loading = true;
	let uploadError = '';
	let loadError = '';
	/** @type {number | null} */
	let processingGuideId = null;
	let searchQuery = '';
	/** @type {string | null} */
	let selectedTag = null;
	
	/** @type {number | null} */
	let selectedGuideId = null;
	/** @type {any} */
	let selectedGuide = null;
	let loadingDetail = false;

	async function loadGuides() {
		loading = true;
		loadError = '';
		try {
			const data = await supabaseAPI.studyGuides.getAll();
			guides = data || [];
			
			// Load all unique tags
			const tags = await supabaseAPI.guideTags.getAllUserTags();
			allTags = tags || [];
			
			// Also load tags for each guide
			for (const guide of guides) {
				const guideTags = await supabaseAPI.guideTags.getByGuide(guide.id);
				guide.tags = guideTags.map(t => t.tag);
			}
			
			applyFilters();
		} catch (err) {
			console.error('Load guides error:', err);
			loadError = (/** @type {Error} */ (err)).message || 'Failed to load study guides';
		} finally {
			loading = false;
		}
	}

	function applyFilters() {
		filteredGuides = guides.filter(guide => {
			// Search filter
			const matchesSearch = !searchQuery || 
				guide.title.toLowerCase().includes(searchQuery.toLowerCase());
			
			// Tag filter
			const matchesTag = !selectedTag || 
				(guide.tags && guide.tags.includes(selectedTag));
			
			return matchesSearch && matchesTag;
		});
	}

	/**
	 * @param {CustomEvent<{ tag: string | null; search: string }>} event
	 */
	function handleFilterChange(event) {
		selectedTag = event.detail.tag;
		searchQuery = event.detail.search;
		applyFilters();
	}

	/**
	 * @param {CustomEvent<{ file: File; formData: FormData; onSuccess: () => void; onError: (msg: string) => void }>} event
	 */
	async function handleUpload(event) {
		uploadError = '';
		const { file, onSuccess, onError } = event.detail;

		try {
			// Upload file to Supabase Storage
			const fileName = `${Date.now()}_${file.name}`;
			const { data: uploadData, error: uploadError } = await supabase.storage
				.from('study-materials')
				.upload(fileName, file);

			if (uploadError) {
				console.error('Upload error:', uploadError);
				throw uploadError;
			}

			// Read file content (handle PDFs properly)
			let fileContent = '';
			if (file.type === 'application/pdf') {
				fileContent = await extractTextFromPDF(file);
			} else {
				fileContent = await file.text();
			}
			
			// Create study guide record with parsed content
			const guide = await supabaseAPI.studyGuides.create(
				file.name.replace(/\.[^/.]+$/, ''), // Remove extension for title
				file.name,
				{ file_path: uploadData.path, content: fileContent }
			);

			console.log('Study guide created:', guide);

			// Process the file content to generate topics and problems
			await processStudyGuide(guide.id, fileContent, file.name, uploadData.path);

			// Reload guides after successful upload
			await loadGuides();
			onSuccess();
		} catch (err) {
			console.error('Upload error:', err);
			const errorMsg = (/** @type {Error} */ (err)).message || 'Upload failed. Please try again.';
			uploadError = errorMsg;
			onError(errorMsg);
		}
	}

	/**
	 * Process uploaded file to generate topics and problems using Claude
	 * @param {number} guideId
	 * @param {string} content
	 * @param {string} fileName
	 * @param {string | null | undefined} [filePath] - Optional path to the uploaded file in storage
	 */
	async function processStudyGuide(guideId, content, fileName, filePath = null) {
		try {
			console.log('Processing study guide...', guideId);

			// Prefer Claude file analysis for PDFs if filePath is available
			const isPDF = fileName?.toLowerCase().endsWith('.pdf');

			// Create a prompt to extract topics and generate questions (fallback when not using file attachments)
			const prompt = `You are helping to create a study guide. I've uploaded a document titled "${fileName}".

Here's the content:
${content.substring(0, 10000)} ${content.length > 10000 ? '...(truncated)' : ''}

Please analyze this content and:
1. Identify ALL major topics covered in the material (typically 5-15 topics, but extract as many as are present)
2. For each topic, create 3-5 practice questions (mix of multiple choice and short answer)

Return your response in this exact JSON format:
{
  "topics": [
    {
      "name": "Topic Name",
      "description": "Brief description of what this topic covers",
      "problems": [
        {
          "question": "Question text?",
          "type": "multiple_choice",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correct_answer": "Option A",
          "explanation": "Why this is correct"
        },
        {
          "question": "Question text?",
          "type": "short_answer",
          "correct_answer": "Expected answer",
          "explanation": "Explanation of the answer"
        }
      ]
    }
  ]
}`;

			// Call Claude API (using Haiku 3.5 for cost efficiency)
			let response;
			let parsedContent;
			
			try {
				if (isPDF && filePath) {
					console.log('Calling Claude API with PDF attachment...');
					response = await supabaseAPI.claude.analyzeFile(
						filePath,
						fileName,
						4096
					);
				} else {
					console.log('Calling Claude API with text input...');
					response = await supabaseAPI.claude.call(
						prompt,
						'You are an expert educational content creator. Create clear, accurate study questions based on the provided material. Return ONLY valid JSON, no other text.',
						4096
					);
				}
				console.log('Claude response:', response);
				
				// Parse the response
				if (response.content && response.content[0]?.text) {
					const responseText = response.content[0].text;
					// Extract JSON from the response
					const jsonMatch = responseText.match(/\{[\s\S]*\}/);
					if (jsonMatch) {
						parsedContent = JSON.parse(jsonMatch[0]);
					} else {
						throw new Error('Could not find JSON in Claude response');
					}
				} else {
					throw new Error('Invalid response from Claude API');
				}
			} catch (claudeError) {
				const error = /** @type {Error} */ (claudeError);
				console.error('Claude API error:', error);
				console.warn('Falling back to sample questions...');
				
				// Fallback: Generate sample questions based on content
				parsedContent = {
					topics: [
						{
							name: "Key Concepts from " + fileName,
							description: "Main ideas and concepts covered in the material",
							problems: [
								{
									question: "What is the main topic covered in this material?",
									type: "short_answer",
									correct_answer: "Based on the uploaded content",
									explanation: "This question asks you to identify the central theme."
								},
								{
									question: "Which of the following best describes the content?",
									type: "multiple_choice",
									options: ["Concept A", "Concept B", "Concept C", "Concept D"],
									correct_answer: "Concept A",
									explanation: "Review the material to understand the main focus."
								},
								{
									question: "True or False: The material covers important foundational concepts?",
									type: "multiple_choice",
									options: ["True", "False"],
									correct_answer: "True",
									explanation: "Most study materials focus on foundational knowledge."
								}
							]
						}
					]
				};
				
				alert('⚠️ Claude API failed. Generated sample questions instead.\n\nError: ' + error.message + '\n\nPlease check your API key at https://console.anthropic.com/');
			}

			// Create topics and problems
			if (parsedContent.topics && Array.isArray(parsedContent.topics)) {
				console.log(`Processing ${parsedContent.topics.length} topics from Claude response`);
				
				for (let i = 0; i < parsedContent.topics.length; i++) {
					const topicData = parsedContent.topics[i];
					console.log(`Processing topic ${i + 1}: ${topicData.name}`);
					
					// Create topic
					const topic = await supabaseAPI.topics.create(
						guideId,
						topicData.name,
						topicData.description || '',
						i
					);

					console.log('Created topic:', topic);

					// Create problems for this topic
					if (topicData.problems && Array.isArray(topicData.problems)) {
						console.log(`Found ${topicData.problems.length} problems for topic ${topicData.name}`);
						
						const problems = topicData.problems.map((/** @type {any} */ p) => ({
							topic_id: topic.id,
							question_text: p.question,
							problem_type: p.type,
							options: p.options || null,
							correct_answer: p.correct_answer,
							explanation: p.explanation || '',
							hints: p.hints || null,
							hint_penalty: 0.1
						}));

						console.log('Inserting problems:', problems);
						const insertedProblems = await supabaseAPI.problems.createBulk(problems);
						console.log(`✓ Successfully created ${insertedProblems.length} problems for topic ${topic.name}`);
					} else {
						console.warn(`No problems array found for topic ${topicData.name}`);
					}
				}
				
				console.log('✓ All topics and problems created successfully!');
			} else {
				console.error('parsedContent.topics is not an array:', parsedContent);
			}

			console.log('Study guide processing complete!');
		} catch (err) {
			console.error('Error processing study guide:', err);
			// Re-throw the error so the caller can handle it
			throw err;
		}
	}

	/**
	 * @param {CustomEvent<{ guideId: number }>} event
	 */
	async function handleStudy(event) {
		const { guideId } = event.detail;
		try {
			// Create a new practice session
			const sessionData = await supabaseAPI.practice.startSession(guideId);
			goto(`/practice/${sessionData.id}`);
		} catch (err) {
			console.error('Start practice error:', err);
			const errorMsg = (/** @type {Error} */ (err)).message || 'Failed to start practice session';
			// Show error in a more user-friendly way
			if (confirm(`${errorMsg}\n\nWould you like to view the guide details to check for topics and problems?`)) {
				selectedGuideId = guideId;
				loadingDetail = true;
				try {
					const guideData = await supabaseAPI.studyGuides.getById(guideId);
					selectedGuide = guideData;
				} catch {
					alert('Failed to load guide details');
					selectedGuideId = null;
				} finally {
					loadingDetail = false;
				}
			}
		}
	}

	/**
	 * @param {CustomEvent<{ guideId: number }>} event
	 */
	async function handleViewDetails(event) {
		const { guideId } = event.detail;
		selectedGuideId = guideId;
		loadingDetail = true;

		try {
			// Load guide details with topics and sessions
			const guideData = await supabaseAPI.studyGuides.getById(guideId);
			selectedGuide = guideData;
		} catch (err) {
			console.error('Load guide details error:', err);
			alert((/** @type {Error} */ (err)).message || 'Failed to load guide details');
			selectedGuideId = null;
		} finally {
			loadingDetail = false;
		}
	}

	/**
	 * @param {CustomEvent<{ guideId: number }>} event
	 */
	async function handleDelete(event) {
		const { guideId } = event.detail;
		try {
			await supabaseAPI.studyGuides.delete(guideId);
			await loadGuides();
		} catch (err) {
			console.error('Delete guide error:', err);
			alert((/** @type {Error} */ (err)).message || 'Failed to delete guide');
		}
	}

	/**
	 * @param {CustomEvent<{ guideId: number; topicIds: number[]; options?: any }>} event
	 */
	async function handleStartPractice(event) {
		const { guideId, options } = event.detail;
		try {
			const sessionData = await supabaseAPI.practice.startSession(guideId, options || {});
			goto(`/practice/${sessionData.id}`);
		} catch (err) {
			console.error('Start practice error:', err);
			alert((/** @type {Error} */ (err)).message || 'Failed to start practice session');
		}
	}

	function handleBack() {
		selectedGuideId = null;
		selectedGuide = null;
	}

	/**
	 * @param {CustomEvent<{ guideId: number }>} event
	 */
	async function handleProcess(event) {
		const { guideId } = event.detail;
		
		if (!confirm('This will use AI to analyze your document and generate study topics and practice questions. Continue?')) {
			return;
		}

		processingGuideId = guideId;

		try {
			// Find the guide
			const guide = guides.find(g => g.id === guideId);
			if (!guide) {
				throw new Error('Guide not found');
			}

			console.log('Found guide:', guide);

			// Get the file from storage
			const filePath = guide.parsed_content?.file_path;
			console.log('Attempting to download file from:', filePath);

			if (!filePath) {
				throw new Error('File path not found in guide data');
			}

			const { data: fileData, error: downloadError } = await supabase.storage
				.from('study-materials')
				.download(filePath);

			if (downloadError) {
				console.error('Download error:', downloadError);
				throw new Error('Could not download file: ' + downloadError.message);
			}

			// Read file content (handle PDFs properly)
			let content = '';
			const guessedType = guide.original_filename?.toLowerCase().endsWith('.pdf') ? 'application/pdf' : '';
			if (guessedType === 'application/pdf') {
				content = await extractTextFromPDF(fileData);
			} else {
				content = await fileData.text();
			}
			console.log('File content length:', content.length);

			// Process the guide
			await processStudyGuide(guideId, content, guide.original_filename || guide.title, filePath);

			// Reload guides to show updated topic count
			await loadGuides();
			
			alert('Study guide processed successfully! Topics and questions have been generated.');
		} catch (err) {
			console.error('Process guide error:', err);
			alert((/** @type {Error} */ (err)).message || 'Failed to process guide');
		} finally {
			processingGuideId = null;
		}
	}
</script>

<svelte:head>
	<title>Dashboard - Study Helper</title>
</svelte:head>

{#if $auth.isAuthenticated}
	<div class="space-y-8">
		{#if selectedGuideId && selectedGuide}
			<!-- Detail View -->
			<GuideDetail
				guide={selectedGuide}
				loading={loadingDetail}
				on:back={handleBack}
				on:startPractice={handleStartPractice}
			/>
		{:else}
			<!-- Dashboard View -->
			<div>
				<!-- Streak Tracker -->
				<div class="mb-6">
					<StreakTracker />
				</div>

				<!-- Math Solver Link -->
				<div class="mb-8">
					<a
						href="/math-solver"
						class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all"
					>
						<span class="text-xl">🧮</span>
						<span>Math Solver</span>
					</a>
				</div>

				<!-- Upload Section -->
				<div class="mb-8">
					<h2 class="text-xl font-semibold text-gray-900 mb-4">Upload New Material</h2>
					<FileUpload on:upload={handleUpload} />
					{#if uploadError}
						<div class="mt-4 rounded-md bg-red-50 border border-red-200 p-4">
							<p class="text-sm text-red-800">{uploadError}</p>
						</div>
					{/if}
				</div>

				<!-- Guides Grid -->
				<div>
					<h2 class="text-xl font-semibold text-gray-900 mb-4">Your Study Guides</h2>

					<!-- Filter Bar -->
					{#if guides.length > 0}
						<GuideFilter 
							{allTags}
							{selectedTag}
							{searchQuery}
							on:filterChange={handleFilterChange}
						/>
					{/if}

					{#if loadError}
						<div class="rounded-md bg-red-50 border border-red-200 p-4 mb-6">
							<p class="text-sm text-red-800">{loadError}</p>
						</div>
					{/if}

					{#if loading}
						<LoadingSkeleton type="card" count={3} />
					{:else if filteredGuides.length === 0 && (searchQuery || selectedTag)}
						<!-- No results for filter -->
						<div class="text-center py-16 bg-white rounded-lg shadow-sm border border-gray-200">
							<div class="text-7xl mb-4">🔍</div>
							<h3 class="text-2xl font-semibold text-gray-900 mb-2">No matches found</h3>
							<p class="text-gray-600 mb-4">
								Try adjusting your filters or search query
							</p>
							<button
								on:click={() => { searchQuery = ''; selectedTag = null; applyFilters(); }}
								class="text-indigo-600 hover:text-indigo-700 font-medium"
							>
								Clear filters
							</button>
						</div>
					{:else if guides.length === 0}
						<!-- Empty State -->
						<div class="text-center py-16 bg-white rounded-lg shadow-sm border border-gray-200">
							<div class="text-7xl mb-4">📚</div>
							<h3 class="text-2xl font-semibold text-gray-900 mb-2">Welcome to Study Helper!</h3>
							<p class="text-gray-600 mb-2">You don't have any study guides yet.</p>
							<p class="text-gray-500 text-sm mb-6">
								Upload your first document above to get started with AI-powered practice questions.
							</p>
							<div class="flex items-center justify-center gap-4 text-sm text-gray-500">
								<div class="flex items-center gap-1">
									<span>📄</span>
									<span>Upload PDFs</span>
								</div>
								<div class="flex items-center gap-1">
									<span>🤖</span>
									<span>AI generates questions</span>
								</div>
								<div class="flex items-center gap-1">
									<span>📈</span>
									<span>Track progress</span>
								</div>
							</div>
						</div>
					{:else}
						<!-- Guides Grid -->
						<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{#each filteredGuides as guide (guide.id)}
								{#if processingGuideId === guide.id}
									<!-- Show processing state -->
									<div class="bg-white rounded-lg shadow-sm border border-indigo-200 p-6">
										<div class="text-center">
											<div class="text-5xl mb-4 animate-pulse">🤖</div>
											<h3 class="text-lg font-semibold text-gray-900 mb-2">
												{guide.title}
											</h3>
											<p class="text-sm text-indigo-600 mb-4">
												Processing with AI... This may take 10-30 seconds.
											</p>
											<div class="w-full bg-gray-200 rounded-full h-2">
												<div class="bg-indigo-600 h-2 rounded-full animate-pulse" style="width: 70%"></div>
											</div>
										</div>
									</div>
								{:else}
									<GuideCard
										{guide}
										on:study={handleStudy}
										on:viewDetails={handleViewDetails}
										on:delete={handleDelete}
										on:process={handleProcess}
									/>
								{/if}
							{/each}
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>
{/if}
