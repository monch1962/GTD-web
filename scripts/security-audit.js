/**
 * Security Audit Script
 * Run in Node.js to audit innerHTML usage and identify XSS vulnerabilities
 *
 * Usage:
 *   node scripts/security-audit.js
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const RESULTS = {
    safe: [],
    warning: [],
    dangerous: [],
    total: 0
};

// Patterns to identify unsafe innerHTML usage
const UNSAFE_PATTERNS = [
    {
        pattern: /\.innerHTML\s*=\s*`[^`]*\${[^}]*}[^`]*`/,
        risk: 'dangerous',
        desc: 'Template literal with variable interpolation (HIGH RISK)'
    },
    {
        pattern: /\.innerHTML\s*=\s*['"][^'"]*\$\{[^}]*\}[^'"]*['"]/,
        risk: 'dangerous',
        desc: 'Template string with variable (HIGH RISK)'
    },
    {
        pattern: /\.innerHTML\s*=\s*.*\+.*;/,
        risk: 'dangerous',
        desc: 'String concatenation (HIGH RISK)'
    },
    {
        pattern: /\.innerHTML\s*=\s*['"][^']*\.\*[^'"]*['"]/,
        risk: 'warning',
        desc: 'String with placeholder (MEDIUM RISK)'
    },
    {
        pattern: /\.innerHTML\s*=\s*element\./,
        risk: 'warning',
        desc: 'Dynamic element property (MEDIUM RISK)'
    },
    {
        pattern: /\.innerHTML\s*=\s*['\"][^'\"]*['\"]/,
        risk: 'safe',
        desc: 'Static string (SAFE)'
    }
];

/**
 * Recursively find all JavaScript files in directory
 */
function findJSFiles(dir, fileList = []) {
    const files = readdirSync(dir);

    files.forEach(file => {
        const filePath = join(dir, file);
        const stat = statSync(filePath);

        if (stat.isDirectory() && !filePath.includes('node_modules')) {
            findJSFiles(filePath, fileList);
        } else if (file.endsWith('.js') && !filePath.includes('backup')) {
            fileList.push(filePath);
        }
    });

    return fileList;
}

/**
 * Analyze a single file for innerHTML usage
 */
function analyzeFile(filePath) {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    // Find all innerHTML usage
    const innerHTMLMatches = [...content.matchAll(/\.innerHTML\s*=/g)];

    if (innerHTMLMatches.length === 0) {
        return;
    }

    // Check each usage
    lines.forEach((line, index) => {
        if (!line.includes('.innerHTML')) return;

        RESULTS.total++;

        // Determine risk level
        let risk = 'safe';
        let desc = 'Static string';

        for (const { pattern, risk: patternRisk, desc: patternDesc } of UNSAFE_PATTERNS) {
            if (pattern.test(line)) {
                risk = patternRisk;
                desc = patternDesc;
                break;
            }
        }

        const result = {
            file: filePath.replace(process.cwd(), ''),
            line: index + 1,
            code: line.trim(),
            risk: risk,
            description: desc
        };

        if (risk === 'dangerous') {
            RESULTS.dangerous.push(result);
        } else if (risk === 'warning') {
            RESULTS.warning.push(result);
        } else {
            RESULTS.safe.push(result);
        }
    });
}

/**
 * Generate security report
 */
function generateReport() {
    console.log('\n🔒 GTD Web Security Audit Report');
    console.log('=====================================\n');

    console.log(`📊 Summary:`);
    console.log(`   Total innerHTML usage: ${RESULTS.total}`);
    console.log(`   ✅ Safe: ${RESULTS.safe.length}`);
    console.log(`   ⚠️  Warnings: ${RESULTS.warning.length}`);
    console.log(`   🚨 Dangerous: ${RESULTS.dangerous.length}\n`);

    // Dangerous findings
    if (RESULTS.dangerous.length > 0) {
        console.log(`🚨 DANGEROUS - XSS Vulnerabilities Found (${RESULTS.dangerous.length}):\n`);
        RESULTS.dangerous.forEach((finding, i) => {
            console.log(`   ${i + 1}. ${finding.file}:${finding.line}`);
            console.log(`      Risk: ${finding.description}`);
            console.log(`      Code: ${finding.code.substring(0, 80)}...`);
            console.log('');
        });
    }

    // Warnings
    if (RESULTS.warning.length > 0) {
        console.log(`⚠️  WARNINGS - Medium Risk Issues (${RESULTS.warning.length}):\n`);
        RESULTS.warning.forEach((finding, i) => {
            console.log(`   ${i + 1}. ${finding.file}:${finding.line}`);
            console.log(`      Risk: ${finding.description}`);
            console.log(`      Code: ${finding.code.substring(0, 80)}...`);
            console.log('');
        });
    }

    // Safe usage
    if (RESULTS.safe.length > 0) {
        console.log(`✅ SAFE - Static innerHTML usage (${RESULTS.safe.length}):\n`);
        console.log(`   These are safe because they use static strings without user input.\n`);
    }

    // Recommendations
    console.log(`📋 Recommendations:\n`);

    if (RESULTS.dangerous.length > 0) {
        console.log(`   1. ❗ HIGH PRIORITY: Fix ${RESULTS.dangerous.length} dangerous innerHTML usages`);
        console.log(`      - Replace with DOM APIs (textContent, createElement)`);
        console.log(`      - Or use escapeHtml() from dom-utils.js`);
        console.log(`      - See js/utils/dom-builder.js for safe alternatives\n`);
    }

    if (RESULTS.warning.length > 0) {
        console.log(`   2. ⚠️  MEDIUM PRIORITY: Review ${RESULTS.warning.length} warning usages`);
        console.log(`      - Ensure no user input in template strings`);
        console.log(`      - Add validation/sanitization if needed\n`);
    }

    console.log(`   3. ✅ BEST PRACTICES:`);
    console.log(`      - Use textContent instead of innerHTML for text`);
    console.log(`      - Use createElement() and appendChild() for structure`);
    console.log(`      - Import { createElement } from './utils/dom-builder.js'`);
    console.log(`      - Always escape user-provided content\n`);

    // Overall assessment
    console.log(`🎯 Overall Security Score:`);

    const safePercentage = RESULTS.total > 0 ? (RESULTS.safe.length / RESULTS.total * 100) : 100;
    let score = 'A';
    let status = 'EXCELLENT';

    if (RESULTS.dangerous.length > 0) {
        score = 'F';
        status = 'CRITICAL - XSS vulnerabilities detected!';
    } else if (RESULTS.warning.length > 5) {
        score = 'C';
        status = 'NEEDS IMPROVEMENT - Many medium-risk issues';
    } else if (RESULTS.warning.length > 0) {
        score = 'B';
        status = 'GOOD - Some issues to review';
    }

    console.log(`   Grade: ${score}`);
    console.log(`   Status: ${status}\n`);

    // File with most issues
    const fileStats = {};
    [...RESULTS.dangerous, ...RESULTS.warning].forEach(finding => {
        fileStats[finding.file] = (fileStats[finding.file] || 0) + 1;
    });

    const sortedFiles = Object.entries(fileStats)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    if (sortedFiles.length > 0) {
        console.log(`📁 Files with most issues:\n`);
        sortedFiles.forEach(([file, count], i) => {
            console.log(`   ${i + 1}. ${file}: ${count} issues`);
        });
        console.log('');
    }

    console.log(`=====================================\n`);
}

/**
 * Main execution
 */
function main() {
    console.log('🔍 Scanning for innerHTML usage...\n');

    const jsDir = join(__dirname, '..', 'js');
    const files = findJSFiles(jsDir);

    console.log(`Found ${files.length} JavaScript files\n`);

    files.forEach(analyzeFile);
    generateReport();

    // Exit with error code if dangerous issues found
    if (RESULTS.dangerous.length > 0) {
        process.exit(1);
    }
}

// Run audit
main();
