const { filterData, transformToOld } = require('@ns-private/cpu-profile-massager')
const { flattenTree } = require('./flattenTree')

const roundToTwoDecimals = (num) => Math.round(num * 100) / 100

function summarizeCPUProfile (profile) {
  // use the massager to transform the profile and get the same values as the ones in the ui
  const parsedAsset = transformToOld(profile)
  const filteredAsset = filterData(parsedAsset, {
    showNSolid: false,
    showProgram: false,
    showGarbage: true,
    showIdle: true
  })

  // get all nodes in a single array
  const nodes = flattenTree(filteredAsset.head)

  // Identify top functions by self time and total time
  const topSelfTimeNodes = Object.values(nodes)
    .sort((a, b) => b.selfTime - a.selfTime)
    .slice(0, 10)

  const topTotalTimeNodes = Object.values(nodes)
    .sort((a, b) => b.totalTime - a.totalTime)
    .slice(0, 10)

  const highestTotalTime = roundToTwoDecimals(topTotalTimeNodes[0].totalTime)

  // Generate summary
  function mapNodeData(node) {
    return {
      functionName: node.functionName,
      totalTime: roundToTwoDecimals(node.totalTime),
      hitCount: node.hitCount,
      selfTime: roundToTwoDecimals(node.selfTime),
      url: node.url,
      selfTimePercentage: roundToTwoDecimals((node.selfTime / highestTotalTime) * 100) + '%',
      totalTimePercentage: roundToTwoDecimals((node.totalTime / highestTotalTime) * 100) + '%'
    }
  }

  const summary = {
    topSelfTimeFunctions: topSelfTimeNodes.map(mapNodeData),
    topTotalTimeFunctions: topTotalTimeNodes.map(mapNodeData),
    startTime: profile.startTime / 1000,
    endTime: profile.endTime / 1000
  }
  // return JSON.stringify(summary, null, 2)
  return `{"messages":[{"role":"user","content":"Given the following CPU profile data: "${JSON.stringify(summary)}" answer the following question: <question>"},{"role":"assistant","content":"<Here goes the AI response>"}]}`
}

module.exports = { summarizeCPUProfile }