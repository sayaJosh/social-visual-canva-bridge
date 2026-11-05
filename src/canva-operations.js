function toOperation(item) {
  const base = {
    id: item.id, role: item.role, x: item.x, y: item.y,
    width: item.width, height: item.height, zIndex: item.zIndex,
  };
  if (item.url) {
    return { ...base, type: 'image', url: item.url, locked: item.locked, label: item.role === 'special-title' ? '特殊主標 PNG（保真）' : undefined };
  }
  if (item.kind === 'text') return { ...base, type: 'text', text: item.text };
  return { ...base, type: item.kind };
}

function compileCanvaOperations(spec) {
  return [...spec.assets, ...spec.elements]
    .sort((left, right) => left.zIndex - right.zIndex)
    .map(toOperation);
}

module.exports = { compileCanvaOperations };
