const sharp = require("sharp");

const input = process.argv[2];
const output = process.argv[3];

async function main() {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const red = data[i];
    const green = data[i + 1];
    const blue = data[i + 2];

    // The generated source uses a saturated magenta chroma background. The
    // brand artwork contains only navy, teal, gold and white, so magenta pixels
    // can be removed safely while retaining antialiased logo edges.
    const magenta = Math.min(red, blue) - green;
    const saturation = Math.max(red, green, blue) - Math.min(red, green, blue);
    const alpha = Math.max(0, Math.min(255, Math.round((magenta < 35 || saturation < 45) ? 255 : 255 - (magenta - 35) * 2.4)));

    data[i + 3] = alpha;
  }

  await sharp(data, { raw: info })
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 8 })
    .resize({ width: 1200, withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toFile(output);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
