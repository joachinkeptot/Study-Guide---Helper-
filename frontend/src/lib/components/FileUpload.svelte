<script>
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	/** @type {File | null} */
	let selectedFile = null;
	let isDragging = false;
	let isUploading = false;
	let uploadProgress = 0;
	let error = '';

	const ACCEPTED_TYPES = [
		'application/pdf',
		'text/plain',
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		'application/msword',
		'image/png',
		'image/jpeg',
		'image/jpg'
	];

	const ACCEPTED_EXTENSIONS = ['.pdf', '.txt', '.docx', '.doc', '.png', '.jpg', '.jpeg'];

	/**
	 * @param {File} file
	 */
	function validateFile(file) {
		const extension = '.' + file.name.split('.').pop()?.toLowerCase();
		
		if (!ACCEPTED_TYPES.includes(file.type) && !ACCEPTED_EXTENSIONS.includes(extension)) {
			error = 'Invalid file type. Please upload PDF, TXT, DOCX, or image files.';
			return false;
		}

		// Check file size (max 10MB)
		if (file.size > 10 * 1024 * 1024) {
			error = 'File is too large. Maximum size is 10MB.';
			return false;
		}

		error = '';
		return true;
	}

	/**
	 * @param {Event} e
	 */
	function handleFileSelect(e) {
		const target = /** @type {HTMLInputElement} */ (e.target);
		const file = target.files?.[0];
		
		if (file && validateFile(file)) {
			selectedFile = file;
		}
	}

	/**
	 * @param {DragEvent} e
	 */
	function handleDragOver(e) {
		e.preventDefault();
		isDragging = true;
	}

	/**
	 * @param {DragEvent} e
	 */
	function handleDragLeave(e) {
		e.preventDefault();
		isDragging = false;
	}

	/**
	 * @param {DragEvent} e
	 */
	function handleDrop(e) {
		e.preventDefault();
		isDragging = false;

		const file = e.dataTransfer?.files[0];
		if (file && validateFile(file)) {
			selectedFile = file;
		}
	}

	async function handleUpload() {
		if (!selectedFile) return;

		isUploading = true;
		uploadProgress = 0;
		error = '';

		try {
			const formData = new FormData();
			formData.append('file', selectedFile);

			// Simulate progress for better UX
			const progressInterval = setInterval(() => {
				if (uploadProgress < 90) {
					uploadProgress += 10;
				}
			}, 200);

			dispatch('upload', { file: selectedFile, formData });

			clearInterval(progressInterval);
			uploadProgress = 100;

			// Reset after success
			setTimeout(() => {
				selectedFile = null;
				isUploading = false;
				uploadProgress = 0;
			}, 1000);

		} catch (err) {
			error = (/** @type {Error} */ (err)).message || 'Upload failed. Please try again.';
			isUploading = false;
			uploadProgress = 0;
		}
	}

	function clearFile() {
		selectedFile = null;
		error = '';
		uploadProgress = 0;
	}
</script>

<div class="w-full">
	<!-- Drop zone -->
	<div
		class="relative border-2 border-dashed rounded-lg p-8 text-center transition-all
			{isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 bg-white'}
			{selectedFile ? 'border-green-300 bg-green-50' : ''}"
		on:dragover={handleDragOver}
		on:dragleave={handleDragLeave}
		on:drop={handleDrop}
		role="button"
		tabindex="0"
	>
		{#if !selectedFile}
			<div class="space-y-4">
				<div class="text-6xl">📄</div>
				<div>
					<p class="text-lg font-medium text-gray-700">
						Drop your study material here
					</p>
					<p class="text-sm text-gray-500 mt-1">
						or click to browse
					</p>
				</div>
				<div class="text-xs text-gray-400">
					Supports: PDF, TXT, DOCX, PNG, JPG (max 10MB)
				</div>
				<input
					type="file"
					accept={ACCEPTED_EXTENSIONS.join(',')}
					on:change={handleFileSelect}
					class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
				/>
			</div>
		{:else}
			<div class="space-y-4">
				<div class="text-5xl">✅</div>
				<div>
					<p class="text-lg font-medium text-gray-900">
						{selectedFile.name}
					</p>
					<p class="text-sm text-gray-500">
						{(selectedFile.size / 1024 / 1024).toFixed(2)} MB
					</p>
				</div>

				{#if isUploading}
					<div class="space-y-2">
						<div class="w-full bg-gray-200 rounded-full h-2">
							<div
								class="bg-indigo-600 h-2 rounded-full transition-all duration-300"
								style="width: {uploadProgress}%"
							></div>
						</div>
						<p class="text-sm text-gray-600">Uploading... {uploadProgress}%</p>
					</div>
				{:else}
					<div class="flex gap-3 justify-center">
						<button
							on:click={handleUpload}
							class="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 
								focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
								transition-colors font-medium"
						>
							Upload
						</button>
						<button
							on:click={clearFile}
							class="px-6 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 
								focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
								transition-colors font-medium"
						>
							Cancel
						</button>
					</div>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Error display -->
	{#if error}
		<div class="mt-4 rounded-md bg-red-50 border border-red-200 p-4">
			<div class="flex">
				<div class="text-2xl mr-3">⚠️</div>
				<div>
					<h3 class="text-sm font-medium text-red-800">Upload Error</h3>
					<p class="mt-1 text-sm text-red-700">{error}</p>
				</div>
			</div>
		</div>
	{/if}
</div>
