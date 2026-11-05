async function applyOperations(sdk, operations) {
  for (const operation of operations) {
    if (operation.type === 'image') await sdk.addImage(operation);
    else if (operation.type === 'text') await sdk.addText(operation);
    else if (operation.type === 'shape') await sdk.addShape(operation);
    else if (operation.type === 'line') await sdk.addLine(operation);
  }
}

module.exports = { applyOperations };
