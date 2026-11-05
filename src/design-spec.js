const IMAGE_URL = /^https:\/\/.+\.(png|jpe?g|webp)(?:[?#].*)?$/i;
const FORBIDDEN_KEYS = new Set(['customerId', 'prompt', 'accessToken', 'oauthToken', 'apiKey']);
const ELEMENT_KINDS = new Set(['text', 'shape', 'line']);
const ASSET_ROLES = new Set(['background', 'decoration', 'special-title']);

function isFiniteNonNegative(value) {
  return Number.isFinite(value) && value >= 0;
}

function hasGeometry(item) {
  return ['x', 'y', 'width', 'height', 'zIndex'].every((key) => isFiniteNonNegative(item[key]));
}

function validAsset(asset) {
  return asset
    && typeof asset.id === 'string'
    && ASSET_ROLES.has(asset.role)
    && typeof asset.url === 'string'
    && IMAGE_URL.test(asset.url)
    && typeof asset.locked === 'boolean'
    && hasGeometry(asset);
}

function validElement(element) {
  if (!element || typeof element.id !== 'string' || !ELEMENT_KINDS.has(element.kind) || !hasGeometry(element)) return false;
  return element.kind !== 'text' || (typeof element.text === 'string' && element.text.length > 0);
}

function validateDesignSpec(spec) {
  if (!spec || typeof spec !== 'object') return { ok: false, code: 'INVALID_SPEC' };
  if (Object.keys(spec).some((key) => FORBIDDEN_KEYS.has(key))) return { ok: false, code: 'INVALID_SPEC' };
  const { metadata, canvas, assets, elements } = spec;
  if (!metadata || typeof metadata.version !== 'string' || typeof metadata.conceptId !== 'string' || typeof metadata.name !== 'string') {
    return { ok: false, code: 'INVALID_SPEC' };
  }
  if (!canvas || canvas.width !== 1080 || canvas.height !== 1080 || !Array.isArray(assets) || !Array.isArray(elements)) {
    return { ok: false, code: 'INVALID_SPEC' };
  }
  if (!assets.every(validAsset) || !elements.every(validElement)) return { ok: false, code: 'INVALID_SPEC' };
  return { ok: true, value: spec };
}

module.exports = { validateDesignSpec };
