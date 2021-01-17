from PIL import Image
img = Image.open("../images/lenna.png")
width, height = img.size

for x in range(width):
    for y in range(height):
        (r,b,g) = img.getpixel((x, y))
        img.putpixel((x, y), (0,b,g))

img.save('../images/lenna-no-red.png')