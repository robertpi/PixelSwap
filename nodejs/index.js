var Jimp = require("jimp");

/**
 * The idea is to split the RGB space into 16*16*16 buckets.
 * The buckets will index the colors of the SRC_IMAGE.
 * To find the color closest to a DEST_IMAGE pixel
 * I search for the corresponding bucket, or expand to neighboring buckets
 * if there's no color.
 * Performance will vary depending on the distribution of pixels and
 * overall difference between SRC and DEST color palette.
 */

const CUBE_RESOLUTION = 16;
const CUBE_SIZE = Math.floor(256 / CUBE_RESOLUTION);
const SRC_IMAGE = "../images/theo-van-hoytema.jpg";
const DEST_IMAGE = "../images/lenna.png";
const OUT_IMAGE = "../images/theo-van-hoytema-lenna.png";
const cube = initializeCube();

// Initialize cube
function initializeCube() {
  const cube = [];
  for (let i = 0; i < CUBE_RESOLUTION; i++) {
    cube[i] = [];
    for (let j = 0; j < CUBE_RESOLUTION; j++) {
      cube[i][j] = [];
      for (let k = 0; k < CUBE_RESOLUTION; k++) {
        cube[i][j][k] = [];
      }
    }
  }
  return cube;
}

// Compute distance between 2 pixels
function getColorDistance(r1, g1, b1, r2, g2, b2) {
  return Math.sqrt(
    Math.pow(r2 - r1, 2) + Math.pow(b2 - b1, 2) + Math.pow(g2 - g1, 2)
  );
}

// Find closest candidate
function getClosestColor(color, candidates) {
  const [r, g, b] = color;
  let minDistance = +Infinity;
  let closestColor = null;
  for (i = 0; i < candidates.length; i++) {
    const distance = getColorDistance(
      r,
      g,
      b,
      candidates[i][0],
      candidates[i][1],
      candidates[i][2]
    );
    if (distance < minDistance) {
      minDistance = distance;
      closestColor = candidates[i];
    }
  }
  return closestColor;
}

// Quantize color coordinates to get bucket
function getColorBucketCoordinates(pixel) {
  const [red, green, blue] = pixel;
  const cubeRed = Math.floor(red / CUBE_SIZE);
  const cubeGreen = Math.floor(green / CUBE_SIZE);
  const cubeBlue = Math.floor(blue / CUBE_SIZE);
  return [cubeRed, cubeGreen, cubeBlue];
}

// Index color into cube
function indexColor(color) {
  const [r, g, b] = getColorBucketCoordinates(color);
  cube[r][g][b].push(color);
}

// Get nearby colors at a radius cube distance
function getNearbyColors(color, radius) {
  let neighbors = [];
  const [r, g, b] = getColorBucketCoordinates(color);
  const rMinEdge = Math.max(0, r - radius);
  const rMaxEdge = Math.min(CUBE_RESOLUTION - 1, r + radius);
  const gMinEdge = Math.max(0, g - radius);
  const gMaxEdge = Math.min(CUBE_RESOLUTION - 1, g + radius);
  const bMinEdge = Math.max(0, b - radius);
  const bMaxEdge = Math.min(CUBE_RESOLUTION - 1, b + radius);

  for (let i = rMinEdge; i <= rMaxEdge; i++) {
    for (let j = gMinEdge; j <= gMaxEdge; j++) {
      for (let k = bMinEdge; k <= bMaxEdge; k++) {
        if (
          i === rMinEdge ||
          i === rMaxEdge ||
          j === gMinEdge ||
          j === gMaxEdge ||
          k === bMinEdge ||
          k === bMaxEdge
        ) {
          neighbors = neighbors.concat(cube[i][j][k]);
        }
      }
    }
  }
  return neighbors;
}

Jimp.read(SRC_IMAGE, (err, image) => {
  if (err) throw err;
  const uniqueColors = new Set();
  image.scan(0, 0, image.bitmap.width, image.bitmap.height, (x, y, idx) => {
    var red = image.bitmap.data[idx + 0];
    var green = image.bitmap.data[idx + 1];
    var blue = image.bitmap.data[idx + 2];

    // First, I index all colors of the source image into the 3D cube.
    // Only storing unique colors will help for lookup later.
    if (!uniqueColors.has(`${red},${green},${blue}`)) {
      uniqueColors.add(`${red},${green},${blue}`);
      indexColor([red, green, blue]);
    }
  });

  Jimp.read(DEST_IMAGE, (err, lenna) => {
    if (err) throw err;
    lenna
      .scan(
        0,
        0,
        lenna.bitmap.width,
        lenna.bitmap.height,
        function (x, y, idx) {
          var red = this.bitmap.data[idx + 0];
          var green = this.bitmap.data[idx + 1];
          var blue = this.bitmap.data[idx + 2];

          let neighbors = [];
          let radius = 0;

          // For each pixel of the destination image, check if there are colors
          // in the same color bucket. If there aren't any, I expand to
          // neighboring buckets.
          while (neighbors.length === 0 && radius < CUBE_RESOLUTION) {
            neighbors = getNearbyColors([red, green, blue], radius);
            if (neighbors.length === 0) {
              radius++;
            }
          }

          // Once I've found nearby buckets with colors,
          // I do a linear search to find the closest colors
          let similarColor = [255, 0, 255];
          if (neighbors.length > 0) {
            similarColor = getClosestColor([red, green, blue], [...neighbors]);
          }

          // Finally, I swap the original color with the closest one
          this.bitmap.data[idx] = similarColor[0];
          this.bitmap.data[idx + 1] = similarColor[1];
          this.bitmap.data[idx + 2] = similarColor[2];
        }
      )
      .write(OUT_IMAGE); // save
  });
});
