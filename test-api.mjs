#!/usr/bin/env node

/**
 * HeroUI React MCP API Test Suite
 *
 * Tests the simplified REST API endpoints
 * Usage: node test-api.js [--url http://localhost:8787]
 */

import http from "http";
import https from "https";
import {URL} from "url";

// Parse command line arguments
const args = process.argv.slice(2);
const urlArgIndex = args.indexOf("--url");
const baseUrl =
  urlArgIndex !== -1 && args[urlArgIndex + 1] ? args[urlArgIndex + 1] : "http://localhost:8787";

console.log(`\n🧪 Testing HeroUI React MCP API at: ${baseUrl}\n`);

// Colors for terminal output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  gray: "\x1b[90m",
};

// Test results tracking
let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

/**
 * Make HTTP request
 */
function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${baseUrl}${path}`);
    const client = url.protocol === "https:" ? https : http;

    const reqOptions = {
      hostname: url.hostname,
      port: url.port || (url.protocol === "https:" ? 443 : 80),
      path: url.pathname + url.search,
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    };

    const req = client.request(reqOptions, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const parsed = data ? JSON.parse(data) : null;
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsed,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data,
          });
        }
      });
    });

    req.on("error", reject);
    req.end();
  });
}

/**
 * Log test result
 */
function logTest(name, passed, details = "") {
  testsRun++;
  if (passed) {
    testsPassed++;
    console.log(`${colors.green}✓${colors.reset} ${name}`);
  } else {
    testsFailed++;
    console.log(`${colors.red}✗${colors.reset} ${name}`);
  }
  if (details) {
    console.log(`  ${colors.gray}${details}${colors.reset}`);
  }
}

/**
 * Test API info endpoint
 */
async function testApiInfo() {
  console.log(`${colors.blue}Testing API Info Endpoint...${colors.reset}`);

  try {
    const response = await makeRequest("/");

    logTest("API info accessible", response.status === 200);
    logTest("API has name", !!response.data?.name);
    logTest("API has version", !!response.data?.version);
    logTest("API has endpoints", !!response.data?.endpoints);

    if (response.data) {
      console.log(`  Name: ${response.data.name}`);
      console.log(`  Version: ${response.data.version}`);
    }
  } catch (error) {
    logTest("API info", false, error.message);
  }

  console.log();
}

/**
 * Test health endpoint
 */
async function testHealthEndpoint() {
  console.log(`${colors.blue}Testing Health Endpoint...${colors.reset}`);

  try {
    const response = await makeRequest("/health");

    logTest("Health endpoint accessible", response.status === 200);
    logTest("Health response has status", response.data?.status === "healthy");
    logTest("Health response has timestamp", !!response.data?.timestamp);

    if (response.data?.environment) {
      console.log(`  Environment: ${response.data.environment}`);
    }
  } catch (error) {
    logTest("Health endpoint", false, error.message);
  }

  console.log();
}

/**
 * Test list components endpoint
 */
async function testListComponents() {
  console.log(`${colors.blue}Testing List Components...${colors.reset}`);

  try {
    const response = await makeRequest("/components");

    logTest("List components accessible", response.status === 200);
    logTest("Response has components array", Array.isArray(response.data?.components));
    logTest("Components found", (response.data?.components?.length || 0) > 0);

    if (response.data?.components) {
      console.log(`  Found ${response.data.components.length} components`);
      if (response.data.components.length > 0) {
        console.log(`  First 5: ${response.data.components.slice(0, 5).join(", ")}`);
      }
    }
  } catch (error) {
    logTest("List components", false, error.message);
  }

  console.log();
}

/**
 * Test get component props
 */
async function testGetComponentProps() {
  console.log(`${colors.blue}Testing Get Component Props...${colors.reset}`);

  try {
    const response = await makeRequest("/components/Button/props");

    logTest("Get component props accessible", response.status === 200);
    logTest("Response has props", !!response.data?.props);

    if (response.data?.props) {
      const preview = response.data.props.substring(0, 100);
      console.log(`  Props preview: ${preview}...`);
    }
  } catch (error) {
    logTest("Get component props", false, error.message);
  }

  console.log();
}

/**
 * Test get component examples
 */
async function testGetComponentExample() {
  console.log(`${colors.blue}Testing Get Component Examples...${colors.reset}`);

  try {
    const response = await makeRequest("/components/Button/examples");

    logTest("Get component examples accessible", response.status === 200);
    logTest("Response has examples", !!response.data?.examples);

    if (response.data?.examples && Array.isArray(response.data.examples)) {
      console.log(`  Found ${response.data.examples.length} examples`);
    }
  } catch (error) {
    logTest("Get component examples", false, error.message);
  }

  console.log();
}

/**
 * Test versions endpoint
 */
async function testVersions() {
  console.log(`${colors.blue}Testing Versions Endpoint...${colors.reset}`);

  try {
    const response = await makeRequest("/versions");

    logTest("Versions endpoint accessible", response.status === 200);
    logTest("Has HeroUI versions", !!response.data?.heroui);
    logTest("Has MCP version", !!response.data?.mcp);

    if (response.data) {
      console.log(`  HeroUI latest: ${response.data.heroui?.latest || "unknown"}`);
      console.log(`  MCP version: ${response.data.mcp?.current || "unknown"}`);
    }
  } catch (error) {
    logTest("Versions endpoint", false, error.message);
  }

  console.log();
}

/**
 * Test docs available endpoint
 */
async function testDocsAvailable() {
  console.log(`${colors.blue}Testing Docs Available Endpoint...${colors.reset}`);

  try {
    const response = await makeRequest("/docs/available");

    logTest("Docs available endpoint accessible", response.status === 200);
    logTest("Response has categories", Array.isArray(response.data?.categories));
    logTest("Response has total count", typeof response.data?.total === "number");
    logTest("Response has baseUrl", !!response.data?.baseUrl);

    if (response.data) {
      console.log(`  Base URL: ${response.data.baseUrl}`);
      console.log(`  Categories: ${response.data.categories?.length || 0}`);
      console.log(`  Total docs: ${response.data.total || 0}`);

      // Show first category as sample
      if (response.data.categories?.[0]) {
        const firstCategory = response.data.categories[0];
        console.log(
          `  First category: ${firstCategory.name} (${firstCategory.docs?.length || 0} docs)`,
        );
      }
    }
  } catch (error) {
    logTest("Docs available endpoint", false, error.message);
  }

  console.log();
}

/**
 * Test docs content endpoint
 */
async function testDocsContent() {
  console.log(`${colors.blue}Testing Docs Content Endpoint...${colors.reset}`);

  try {
    // Test with a known documentation path
    const testPath = "/docs/introduction";
    const response = await makeRequest(`/docs/content?path=${encodeURIComponent(testPath)}`);

    logTest("Docs content endpoint accessible", response.status === 200);
    logTest("Response has path", !!response.data?.path);
    logTest("Response has content", !!response.data?.content);
    logTest("Response has url", !!response.data?.url);
    logTest("Response has contentType", !!response.data?.contentType);

    if (response.data?.content) {
      const preview = response.data.content.substring(0, 100).replace(/\n/g, " ");
      console.log(`  Content preview: ${preview}...`);
      console.log(`  URL: ${response.data.url}`);
      console.log(`  Content length: ${response.data.content.length} characters`);
    }

    // Test error handling with invalid path
    const badResponse = await makeRequest("/docs/content?path=/invalid/path");
    logTest("Invalid path returns error", badResponse.status !== 200);
  } catch (error) {
    logTest("Docs content endpoint", false, error.message);
  }

  console.log();
}

/**
 * Test 404 handling
 */
async function test404Handling() {
  console.log(`${colors.blue}Testing 404 Handling...${colors.reset}`);

  try {
    const response = await makeRequest("/nonexistent");

    logTest("404 returns proper status", response.status === 404);
    logTest("404 has error message", !!response.data?.error);
  } catch (error) {
    logTest("404 handling", false, error.message);
  }

  console.log();
}

/**
 * Main test runner
 */
async function runTests() {
  console.log("Starting API Tests...\n");
  console.log("=".repeat(50));
  console.log();

  // Run tests in sequence
  await testApiInfo();
  await testHealthEndpoint();
  await testListComponents();
  await testGetComponentProps();
  await testGetComponentExample();
  await testVersions();
  await testDocsAvailable();
  await testDocsContent();
  await test404Handling();

  // Print summary
  console.log("=".repeat(50));
  console.log("\nTest Summary:");
  console.log(`  Total tests: ${testsRun}`);
  console.log(`  ${colors.green}Passed: ${testsPassed}${colors.reset}`);
  console.log(`  ${colors.red}Failed: ${testsFailed}${colors.reset}`);

  const successRate = testsRun > 0 ? ((testsPassed / testsRun) * 100).toFixed(1) : 0;
  const statusColor = testsFailed === 0 ? colors.green : colors.red;
  console.log(`  ${statusColor}Success rate: ${successRate}%${colors.reset}`);

  // Exit with appropriate code
  process.exit(testsFailed > 0 ? 1 : 0);
}

// Run tests
runTests().catch((error) => {
  console.error(`\n${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
