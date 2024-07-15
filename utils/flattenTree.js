function flattenTree (root) {
  const uniqueValuesById = new Map()

  function traverse (node) {
    if (!node || uniqueValuesById.has(node.id)) return
    uniqueValuesById.set(node.id, node)
    if (node.children) {
      node.children.forEach(child => traverse(child))
    }
  }

  traverse(root)
  return Array.from(uniqueValuesById.values())
}

module.exports = { flattenTree }