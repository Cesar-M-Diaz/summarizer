const fs = require('fs')
const path = require('path')
const { summarizeCPUProfile } = require('./utils/summarizeCPUProfile')

const args = process.argv.slice(2);

if (args.length !== 1) {
  console.error('Usage: summarizeCPUProfile <file>');
  process.exit(1);
}

const file = args[0];
const outputFileName = path.basename(file, path.extname(file)) + '.summary.jsonl';
const outputDir = path.join(__dirname, 'summaries')
const outputFilePath = path.join(outputDir, outputFileName);

fs.readFile(file, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading file:', err, 'reading error');
    process.exit(1);
  }
  const profile = JSON.parse(data);
  const summary = summarizeCPUProfile(profile);
  fs.writeFile(outputFilePath, summary, 'utf8', (err) => {
    if (err) {
      console.error('Error writing summary file:', err, 'writing error');
      process.exit(1);
    }
    console.log(`Summary written to ${outputFilePath}`);
  });
});