// @ts-nocheck
/**
 * Toast notification utility
 * Wrapper around svelte-french-toast
 */

import toast from "svelte-french-toast";

/**
 * Show success toast
 * @param {string} message
 */
export function showSuccess(message) {
  toast.success(message, {
    duration: 4000,
    position: "top-right",
  });
}

/**
 * Show error toast
 * @param {string} message
 */
export function showError(message) {
  toast.error(message, {
    duration: 5000,
    position: "top-right",
  });
}

/**
 * Show info toast
 * @param {string} message
 */
export function showInfo(message) {
  toast(message, {
    duration: 4000,
    position: "top-right",
    icon: "ℹ️",
  });
}

/**
 * Show warning toast
 * @param {string} message
 */
export function showWarning(message) {
  toast(message, {
    duration: 4500,
    position: "top-right",
    icon: "⚠️",
    style: "background: #f59e0b; color: white;",
  });
}

/**
 * Show loading toast and return promise
 * @param {Promise<any>} promise
 * @param {Object} messages
 * @param {string} messages.loading
 * @param {string} messages.success
 * @param {string} messages.error
 */
export function showPromise(promise, messages) {
  return toast.promise(
    promise,
    {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
    },
    {
      position: "top-right",
    }
  );
}

/**
 * Ask for confirmation with toast
 * Returns a promise that resolves to boolean
 * @param {string} message
 * @returns {Promise<boolean>}
 */
export function showConfirm(message) {
  return new Promise((resolve) => {
    const id = toast(
      () => `
			<div style="display: flex; flex-direction: column; gap: 8px;">
				<p style="margin: 0;">${message}</p>
				<div style="display: flex; gap: 8px; justify-content: flex-end;">
					<button 
						onclick="window.toastConfirmResolve_${id}(false)"
						style="padding: 4px 12px; border: 1px solid #ccc; background: white; border-radius: 4px; cursor: pointer;"
					>
						Cancel
					</button>
					<button 
						onclick="window.toastConfirmResolve_${id}(true)"
						style="padding: 4px 12px; border: none; background: #3b82f6; color: white; border-radius: 4px; cursor: pointer;"
					>
						Confirm
					</button>
				</div>
			</div>
		`,
      {
        duration: 10000,
        position: "top-center",
      }
    );

    // Store resolve function globally
    window[`toastConfirmResolve_${id}`] = (result) => {
      toast.dismiss(id);
      delete window[`toastConfirmResolve_${id}`];
      resolve(result);
    };
  });
}

// Export default toast for custom usage
export { toast };
export default toast;
