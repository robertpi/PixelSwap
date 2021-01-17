var Jimp = require('jimp');

// open a file called "lenna.png"
Jimp.read('../images/lenna.png', (err, lenna) => {
  if (err) throw err;
  lenna.scan(0, 0, lenna.bitmap.width, lenna.bitmap.height, function(x, y, idx) {
    // x, y is the position of this pixel on the image
    // idx is the position start position of this rgba tuple in the bitmap Buffer
    // this is the image
  
    var red = this.bitmap.data[idx + 0];
    var green = this.bitmap.data[idx + 1];
    var blue = this.bitmap.data[idx + 2];
    var alpha = this.bitmap.data[idx + 3];
  
    // rgba values run from 0 - 255
    this.bitmap.data[idx] = 0; // removes red from this pixel
  }).write('../images/lenna-no-red.jpg'); // save
});