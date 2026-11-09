import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export function validateManifest(m) {
  if (!m || !Number.isFinite(m.width) || m.width <= 0 || m.width !== m.height) throw new Error('Canvas must be a positive square');
  if (!Array.isArray(m.images) || !m.images.length || !Array.isArray(m.texts)) throw new Error('Images and texts are required');
  for (const item of [...m.images, ...m.texts]) {
    for (const key of ['x','y','width','height']) if (!Number.isFinite(item[key]) || item[key] < 0) throw new Error(`Invalid geometry: ${key}`);
    if (item.width === 0 || item.height === 0 || item.x + item.width > m.width || item.y + item.height > m.height) throw new Error('Layer is outside canvas');
  }
  for (const image of m.images) if (typeof image.path !== 'string' || !/\.(png|jpe?g)$/i.test(image.path)) throw new Error('Image must be PNG or JPEG');
  for (const text of m.texts) if (typeof text.text !== 'string' || !text.text.trim() || !Number.isFinite(text.fontSize) || text.fontSize <= 0 || typeof text.fontFamily !== 'string' || !/^#[0-9a-f]{6}$/i.test(text.color) || !['left','center','right'].includes(text.align)) throw new Error('Invalid text style');
  return m;
}

export async function build(input, output) {
  const m = validateManifest(JSON.parse(await fs.readFile(input, 'utf8')));
  await fs.mkdir(output, {recursive:true});
  for (const file of ['editable.pptx','preview.png']) {
    try { await fs.access(path.join(output,file)); } catch (e) { if(e.code === 'ENOENT') continue; throw e; }
    throw new Error('Output exists; use a new output folder');
  }
  const modulePath = process.env.ARTIFACT_TOOL_MODULE;
  const {Presentation,PresentationFile} = await import(modulePath ? pathToFileURL(path.resolve(modulePath)).href : '@oai/artifact-tool');
  const p=Presentation.create({slideSize:{width:m.width,height:m.height}}), s=p.slides.add();
  for (const image of m.images) {
    const bytes=await fs.readFile(path.resolve(path.dirname(input),image.path));
    s.images.add({blob:bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),contentType:/\.png$/i.test(image.path)?'image/png':'image/jpeg',alt:image.name || '圖片圖層',fit:'contain',position:{left:image.x,top:image.y,width:image.width,height:image.height}});
  }
  for (const text of m.texts) {
    const t=s.shapes.add({geometry:'textbox',name:text.name || text.text,position:{left:text.x,top:text.y,width:text.width,height:text.height},fill:'none',line:{fill:'none',width:0}});
    t.text=text.text;t.text.style={fontFamily:text.fontFamily,fontSize:text.fontSize,color:text.color,alignment:text.align};
  }
  await (await PresentationFile.exportPptx(p)).save(path.join(output,'editable.pptx'));
  await fs.writeFile(path.join(output,'preview.png'),new Uint8Array(await(await p.export({slide:s,format:'png',scale:1})).arrayBuffer()));
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  if(process.argv.length!==4) {console.error('Usage: node build-editable.mjs manifest.json output-folder');process.exitCode=1;}
  else await build(path.resolve(process.argv[2]),path.resolve(process.argv[3])).catch(e=>{console.error(e.message);process.exitCode=1});
}
