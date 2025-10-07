#!/usr/bin/env node

/**
 * HeroUI Native MCP API Test Suite
 *
 * Tests the REST API endpoints for Native MCP
 * Usage: node test-api.mjs [--url http://localhost:8788]
 */

import http from "http";
import https from "https";
import {URL} from "url";

// Parse command line arguments
const args = process.argv.slice(2);
const urlArgIndex = args.indexOf("--url");
const baseUrl =
  urlArgIndex !== -1 && args[urlArgIndex + 1] ? args[urlArgIndex + 1] : "http://localhost:8788";

console.log(`\n🧪 Testing HeroUI Native MCP API at: ${baseUrl}\n`);

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
function makeRequest(path, method = "GET", body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${baseUrl}${path}`);
    const client = url.protocol === "https:" ? https : http;

    const reqOptions = {
      hostname: url.hostname,
      port: url.port || (url.protocol === "https:" ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
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

    if (body) {
      req.write(JSON.stringify(body));
    }

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
 * Test health endpoint
 */
async function testHealthEndpoint() {
  console.log(`${colors.blue}Testing Health Endpoint...${colors.reset}`);

  try {
    const response = await makeRequest("/");

    logTest("Health endpoint accessible", response.status === 200);
    logTest("Health response has status", response.data?.status === "healthy");
    logTest("Health response has service name", !!response.data?.service);
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
    logTest("Response has count", typeof response.data?.count === "number");
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
 * Test get component details (bulk)
 */
async function testGetComponentDetails() {
  console.log(`${colors.blue}Testing Get Component Details (Bulk)...${colors.reset}`);

  try {
    const response = await makeRequest("/components", "POST", {
      components: ["Button", "Card", "Avatar"]
    });

    logTest("Get component details accessible", response.status === 200);
    logTest("Response has results", Array.isArray(response.data?.results));
    logTest("Response has version", !!response.data?.version);

    if (response.data?.results) {
      console.log(`  Got ${response.data.results.length} component results`);
      const successful = response.data.results.filter(r => !r.error);
      console.log(`  Successful: ${successful.length}`);
    }
  } catch (error) {
    logTest("Get component details", false, error.message);
  }

  console.log();
}

/**
 * Test get component props
 */
async function testGetComponentProps() {
  console.log(`${colors.blue}Testing Get Component Props (Bulk)...${colors.reset}`);

  try {
    const response = await makeRequest("/components/props", "POST", {
      components: ["Button", "Card"]
    });

    logTest("Get component props accessible", response.status === 200);
    logTest("Response has results", Array.isArray(response.data?.results));

    if (response.data?.results && response.data.results[0]?.props) {
      const preview = response.data.results[0].props.substring(0, 100);
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
async function testGetComponentExamples() {
  console.log(`${colors.blue}Testing Get Component Examples (Bulk)...${colors.reset}`);

  try {
    const response = await makeRequest("/components/examples", "POST", {
      components: ["Button", "Card"]
    });

    logTest("Get component examples accessible", response.status === 200);
    logTest("Response has results", Array.isArray(response.data?.results));

    if (response.data?.results) {
      const totalExamples = response.data.results.reduce((sum, r) =>
        sum + (r.examples?.length || 0), 0
      );
      console.log(`  Total examples across components: ${totalExamples}`);
    }
  } catch (error) {
    logTest("Get component examples", false, error.message);
  }

  console.log();
}

/**
 * Test theme endpoint
 */
async function testThemeEndpoint() {
  console.log(`${colors.blue}Testing Theme Endpoint...${colors.reset}`);

  try {
    const response = await makeRequest("/themes");

    logTest("Theme endpoint accessible", response.status === 200);
    logTest("Has color tokens", !!response.data?.colors);
    logTest("Has typography tokens", !!response.data?.typography);
    logTest("Has spacing tokens", !!response.data?.spacing);

    if (response.data?.colors) {
      const totalColors = (response.data.colors.semantic?.length || 0) +
                         (response.data.colors.palette?.length || 0) +
                         (response.data.colors.brand?.length || 0);
      console.log(`  Total color tokens: ${totalColors}`);
    }
  } catch (error) {
    logTest("Theme endpoint", false, error.message);
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
    logTest("Has latest versions", !!response.data?.latest);
    logTest("Has available versions", Array.isArray(response.data?.available));

    if (response.data?.latest) {
      console.log(`  Components version: ${response.data.latest.components || "unknown"}`);
      console.log(`  Theme version: ${response.data.latest.theme || "unknown"}`);
    }
  } catch (error) {
    logTest("Versions endpoint", false, error.message);
  }

  console.log();
}

/**
 * Test docs endpoint
 */
async function testDocsEndpoint() {
  console.log(`${colors.blue}Testing Docs Endpoint...${colors.reset}`);

  try {
    // Test with a known component
    const response = await makeRequest("/docs/Button");

    logTest("Docs endpoint accessible", response.status === 200);
    logTest("Response has component name", !!response.data?.component);
    logTest("Response has documentation", !!response.data?.documentation);

    if (response.data?.documentation) {
      const preview = response.data.documentation.substring(0, 100).replace(/\n/g, " ");
      console.log(`  Documentation preview: ${preview}...`);
    }

    // Test with non-existent component
    const badResponse = await makeRequest("/docs/NonExistent");
    logTest("Invalid component returns error", badResponse.status === 404);
  } catch (error) {
    logTest("Docs endpoint", false, error.message);
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
 * Test CORS headers
 */
async function testCORSHeaders() {
  console.log(`${colors.blue}Testing CORS Headers...${colors.reset}`);

  try {
    const response = await makeRequest("/");

    logTest("Has Access-Control-Allow-Origin",
      response.headers["access-control-allow-origin"] === "*");
    logTest("Has Access-Control-Allow-Methods",
      !!response.headers["access-control-allow-methods"]);
  } catch (error) {
    logTest("CORS headers", false, error.message);
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
  await testHealthEndpoint();
  await testListComponents();
  await testGetComponentDetails();
  await testGetComponentProps();
  await testGetComponentExamples();
  await testThemeEndpoint();
  await testVersions();
  await testDocsEndpoint();
  await test404Handling();
  await testCORSHeaders();

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