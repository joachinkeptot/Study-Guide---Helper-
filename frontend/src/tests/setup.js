// @ts-nocheck
import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock browser environment
global.window = global.window || {};
global.document = global.document || {};
global.navigator = global.navigator || { userAgent: "node.js" };

// Mock SvelteKit modules
vi.mock("$app/environment", () => ({
  browser: true,
  dev: true,
  building: false,
  version: "1.0.0",
}));

vi.mock("$app/navigation", () => ({
  goto: vi.fn(),
  invalidate: vi.fn(),
  invalidateAll: vi.fn(),
  preloadData: vi.fn(),
  preloadCode: vi.fn(),
  beforeNavigate: vi.fn(),
  afterNavigate: vi.fn(),
}));

vi.mock("$app/stores", () => ({
  page: {
    subscribe: vi.fn(),
  },
  navigating: {
    subscribe: vi.fn(),
  },
  updated: {
    subscribe: vi.fn(),
    check: vi.fn(),
  },
}));

// Mock environment variables
global.import = {
  meta: {
    env: {
      DEV: true,
      PROD: false,
      VITE_SUPABASE_URL: "http://localhost:54321",
      VITE_SUPABASE_ANON_KEY: "test-anon-key",
      VITE_API_BASE_URL: "http://localhost:5001",
    },
  },
};
