const fs = require('fs')
const path = require('path')

function summarizeCPUProfile(profile, name) {
  // Parse the profile data
  const { nodes, samples, timeDeltas } = profile

  const nodeMap = {}
  nodes.forEach(node => {
    nodeMap[node.id] = {
      id: node.id,
      functionName: node.callFrame.functionName || '(anonymous function)',
      selfTime: 0,
      totalTime: 0,
      hitCount: node.hitCount || 0,
      children: node.children || [],
      url: node.callFrame.url
    }
  })

  // Calculate self time and total time for each node
  samples.forEach((sampleId, index) => {
    const deltaTime = timeDeltas[index] || 0
    if (nodeMap[sampleId]) {
      nodeMap[sampleId].selfTime += deltaTime
    }
  })

  // Calculate total time for each node by traversing the tree
  function calculateTotalTime (nodeId) {
    const node = nodeMap[nodeId]
    if (!node) return 0
    node.totalTime = node.selfTime
    node.children.forEach(childId => {
      node.totalTime += calculateTotalTime(childId)
    })
    return node.totalTime
  }

  nodes.forEach(node => {
    calculateTotalTime(node.id)
  })

  // Identify top functions by self time and total time
  const topSelfTimeNodes = Object.values(nodeMap)
    .sort((a, b) => b.selfTime - a.selfTime)
    .slice(0, 10)

  const topTotalTimeNodes = Object.values(nodeMap)
    .sort((a, b) => b.totalTime - a.totalTime)
    .slice(0, 10)

  const highestTotalTime = topTotalTimeNodes[0].totalTime

  // Generate summary
  function mapNodeData (node) {
    return {
      functionName: node.functionName,
      totalTime: node.totalTime / 1000,
      hitCount: node.hitCount,
      selfTime: node.selfTime / 1000,
      url: node.url,
      selfTimePercentage: ((node.selfTime / highestTotalTime) * 100).toFixed(2) + '%',
      totalTimePercentage: ((node.totalTime / highestTotalTime) * 100).toFixed(2) + '%'
    }
  }

  const summary = {
    topSelfTimeFunctions: topSelfTimeNodes.map(mapNodeData),
    topTotalTimeFunctions: topTotalTimeNodes.map(mapNodeData),
    startTime: profile.startTime / 1000,
    endTime: profile.endTime / 1000
  }
  
  return `{"messages":[{"role":"user","content":"Given the following CPU profile data: "${JSON.stringify(summary)}" answer the following question: <question>"},{"role":"assistant","content":"<Here goes the AI response>"}]}`
}

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
    console.error('Error reading file:', err);
    process.exit(1);
  }
  const profile = JSON.parse(data);
  const summary = summarizeCPUProfile(profile);
  fs.writeFile(outputFilePath, summary, 'utf8', (err) => {
    if (err) {
      console.error('Error writing summary file:', err);
      process.exit(1);
    }
    console.log(`Summary written to ${outputFilePath}`);
  });
});