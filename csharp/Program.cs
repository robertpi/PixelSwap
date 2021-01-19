using System;
using System.Drawing;

namespace csharp
{
    class Program
    {
        static void Main(string[] args)
        {
            var img = (Bitmap)Image.FromFile("../../../../images/lenna.png");
            for (int x = 0; x < img.Width - 1; x++)
            {
                for (int y = 0; y < img.Height; y++)
                {
                    var c = img.GetPixel(x, y);
                    img.SetPixel(x, y, Color.FromArgb(0, c.G, c.B));
                }

            }

            img.Save("../../../../images/lenna-no-red.png");
        }
    }
}
