const path = require('path');
const Jimp = require('jimp');

run('../images/Square/van-gogh.jpg', '../images/Square/turner-landscape.jpg', '.', 'vangogh-turner');
run('../images/Square/van-gogh.jpg', '../images/Square/klimt-adele.jpg', '.', 'vangogh-klimt');
run('../images/Square/van-gogh.jpg', '../images/Square/bacon-never-ending-screem.jpg', '.', 'vangogh-bacon');
run('../images/Square/klimt-adele.jpg', '../images/Square/van-gogh.jpg', '.', 'klimt-vangogh');
run('../images/Square/klimt-adele.jpg', '../images/Square/bacon-never-ending-screem.jpg', '.', 'klimt-bacon');
run('../images/Square/klimt-adele.jpg', '../images/Square/turner-landscape.jpg', '.', 'klimt-turner');
run('../images/Square/turner-landscape.jpg', '../images/Square/klimt-adele.jpg', '.', 'turner-klimt');
run('../images/Square/turner-landscape.jpg', '../images/Square/van-gogh.jpg', '.', 'turner-vangogh');

run('../images/Portrait-Landscape/monet.jpg', '../images/Portrait-Landscape/lucian-freud.jpg', '.', 'monet-lucian');
run('../images/Portrait-Landscape/lucian-freud.jpg', '../images/Portrait-Landscape/monet.jpg', '.', 'lucian-monet');

//run('../images/Misc-Sizes/frida-kahlo.jpg', '../images/Misc-Sizes/georgia-okeeffe.jpg');

const TRANSFORMS = {
  greyscale: greyscaleTransform,
  subpixelDistance: subpixelDistanceTransform,
};

const RESIZE_MODE = Jimp.RESIZE_BILINEAR;

async function run(sourcePath, targetPath, resultFolder = '../images', resultName = '') {
  const source = await Jimp.read(sourcePath);
  const target = await Jimp.read(targetPath);

  // TODO: image resize, the algorithm assumes equal amounts of pixels
  /* const sourcePixelCount = source.bitmap.width * source.bitmap.height;
  const targetPixelCount = target.bitmap.width * target.bitmap.height;
  
  if (sourcePixelCount !== targetPixelCount) {
    (source.bitmap.width / source.bitmap.height)
    Math.ceil(targetPixelCount / 1)
    source.resize(w, Jimp.AUTO, RESIZE_MODE);
  } */

  for (const [ name, transform ] of Object.entries(TRANSFORMS)) {
    const s = source.clone();
    const t = target.clone();

    console.time(name);

    const result = transform(s, t);

    console.timeEnd(name);

    await result.write(path.join(resultFolder, `${resultName}${resultName ? '-' : ''}${name}.${result.getExtension()}`));

    checkPixels(source, result);
  }
}

function checkPixels(source, result) {
  const sourcePixels = new Map();
  const resultPixels = new Map();

  source.scan(0, 0, source.bitmap.width, source.bitmap.height, (x, y) => {
    const color = source.getPixelColor(x, y);

    let count = sourcePixels.get(color) || 0;

    count++;

    sourcePixels.set(color, count);
  });

  result.scan(0, 0, result.bitmap.width, result.bitmap.height, (x, y) => {
    const color = result.getPixelColor(x, y);

    let count = resultPixels.get(color) || 0;

    count++;

    resultPixels.set(color, count);
  });

  if (sourcePixels.size !== resultPixels.size) {
    return console.log('Invalid result: Pixel color count mismatch:', sourcePixels.size, resultPixels.size);
  }

  for (const [color, count] of sourcePixels) {
    const resultCount = resultPixels.get(color);

    if (count !== resultCount) {
      return console.log('Invalid result: Pixel count mismatch:', color, count, resultCount);
    }
  }
}




function subpixelDistanceTransform(source, target) {
  const sourcePixels = toSortedChannels(source);
  const targetPixels = toSortedChannels(target);

  targetPixels.rChannel = invertArray(targetPixels.rChannel);
  targetPixels.gChannel = invertArray(targetPixels.gChannel);
  targetPixels.bChannel = invertArray(targetPixels.bChannel);

  target.scan(0, 0, target.bitmap.width, target.bitmap.height, (x, y, idx) => {
    const coord = formatCoords(x, y);

    const rIndex = targetPixels.rChannel.get(coord);
    const gIndex = targetPixels.gChannel.get(coord);
    const bIndex = targetPixels.bChannel.get(coord);

    // TODO: compute wich pixel of the three channels
    //       has the smallest subpixel distance and use this one

    target.bitmap.data[idx] = sourcePixels.rChannel[rIndex].pixel.r;
    target.bitmap.data[idx+1] = sourcePixels.gChannel[gIndex].pixel.g;
    target.bitmap.data[idx+2] = sourcePixels.bChannel[bIndex].pixel.b;

    //image.setPixelColor(hex, x, y);
  });

  return target;
};

function toSortedChannels(image) {
  const rChannel = [];
  const gChannel = [];
  const bChannel = [];

  image.scan(0, 0, image.bitmap.width, image.bitmap.height, (x, y, idx) => {
    const [r, g, b] = image.bitmap.data.slice(idx, idx + 3);

    const pixel = {
      coord: { x, y },
      pixel: { r, g, b },
      // hex: image.getPixelColor(x, y),
    };

    rChannel.push(pixel);
    gChannel.push(pixel);
    bChannel.push(pixel);
  });

  rChannel.sort((a, b) => a.pixel.r - b.pixel.r);
  gChannel.sort((a, b) => a.pixel.g - b.pixel.g);
  bChannel.sort((a, b) => a.pixel.b - b.pixel.b);

  return { rChannel, gChannel, bChannel };
}

function invertArray(arr) {
  const entries = arr.map((val, index) => [formatCoords(val.coord.x, val.coord.y), index]);

  return new Map(entries);
}

function formatCoords(x, y) {
  return `${x}-${y}`;
}




function greyscaleTransform(source, target) {
  const greySource = toSortedGreyscale(source);
  const greyTarget = toSortedGreyscale(target);

  for (let i = 0; i < greyTarget.length; i++) {
    const sourceX = greySource[i].x;
    const sourceY = greySource[i].y;

    const targetX = greyTarget[i].x;
    const targetY = greyTarget[i].y;

    const sourceColor = source.getPixelColor(sourceX, sourceY);

    target.setPixelColor(sourceColor, targetX, targetY);
  }

  return target;
}

function toSortedGreyscale(image) {
  const pixels = [];

  image
    .clone()
    .greyscale()
    .scan(0, 0, image.bitmap.width, image.bitmap.height, (x, y) => {
      pixels.push({ x, y, hex: image.getPixelColor(x, y) });
    });
  
  return pixels.sort((a, b) => a.hex - b.hex);
}