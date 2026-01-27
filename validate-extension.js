#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('\n📋 LinkedIn Invite Acceptor Extension Validator\n');

const requiredFiles = [
  'manifest.json',
  'src/background/background.js',
  'src/popup/popup.html',
  'src/popup/popup.css',
  'src/popup/popup.js',
  'src/content/content-script.js',
];

const baseDir = '/Users/pratik/Projects/linkedin-invite-acceptor';
let allValid = true;

console.log('Checking required files...');
requiredFiles.forEach(file => {
  const filePath = path.join(baseDir, file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`✅ ${file} (${stats.size} bytes)`);
  } else {
    console.error(`❌ ${file} - MISSING`);
    allValid = false;
  }
});

if (!allValid) {
  console.log('\n❌ Some files are missing!\n');
  process.exit(1);
}

// Validate manifest.json
console.log('\nValidating manifest.json...');
try {
  const manifest = JSON.parse(fs.readFileSync(path.join(baseDir, 'manifest.json'), 'utf8'));
  console.log(`✅ Valid JSON`);
  console.log(`   - Version: ${manifest.manifest_version}`);
  console.log(`   - Name: ${manifest.name}`);
  console.log(`   - Service Worker: ${manifest.background?.service_worker || 'NOT FOUND'}`);
} catch (e) {
  console.error(`❌ Invalid JSON: ${e.message}`);
  allValid = false;
}

// Check background.js for syntax
console.log('\nValidating background.js...');
try {
  const bgScript = fs.readFileSync(path.join(baseDir, 'src/background/background.js'), 'utf8');
  if (bgScript.includes('class BackgroundController') && bgScript.includes('const controller = new BackgroundController()')) {
    console.log(`✅ BackgroundController class found and initialized`);
  } else {
    console.error(`❌ BackgroundController not properly set up`);
    allValid = false;
  }
} catch (e) {
  console.error(`❌ Error reading background.js: ${e.message}`);
  allValid = false;
}

// Check popup files
console.log('\nValidating popup files...');
try {
  const html = fs.readFileSync(path.join(baseDir, 'src/popup/popup.html'), 'utf8');
  if (html.includes('id="start-btn"') && html.includes('id="stop-btn"')) {
    console.log(`✅ popup.html has Start/Stop buttons`);
  }
  
  const css = fs.readFileSync(path.join(baseDir, 'src/popup/popup.css'), 'utf8');
  console.log(`✅ popup.css loaded (${css.length} bytes)`);
  
  const js = fs.readFileSync(path.join(baseDir, 'src/popup/popup.js'), 'utf8');
  if (js.includes('class PopupController')) {
    console.log(`✅ popup.js has PopupController class`);
  }
} catch (e) {
  console.error(`❌ Error validating popup files: ${e.message}`);
  allValid = false;
}

// Check content script
console.log('\nValidating content script...');
try {
  const contentScript = fs.readFileSync(path.join(baseDir, 'src/content/content-script.js'), 'utf8');
  if (contentScript.includes('class LinkedInAcceptor') && contentScript.includes('chrome.runtime.onMessage.addListener')) {
    console.log(`✅ Content script has LinkedInAcceptor class and message listener`);
  }
} catch (e) {
  console.error(`❌ Error validating content script: ${e.message}`);
  allValid = false;
}

if (allValid) {
  console.log('\n✅ All validation checks passed!\n');
  console.log('Extension is ready to load in Chrome Dev Mode:');
  console.log('  1. Open chrome://extensions/');
  console.log('  2. Enable "Developer mode" (top right)');
  console.log('  3. Click "Load unpacked"');
  console.log('  4. Select: /Users/pratik/Projects/linkedin-invite-acceptor');
  console.log('\n');
  process.exit(0);
} else {
  console.log('\n❌ Validation failed. Please fix the issues above.\n');
  process.exit(1);
}
