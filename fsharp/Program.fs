// Learn more about F# at http://fsharp.org

open System.Drawing

[<EntryPoint>]
let main argv =
    let img = Image.FromFile("../../../../images/lenna.png") :?> Bitmap
    for x in 0 .. img.Width - 1 do
        for y in 0 .. img.Height - 1 do
            let c = img.GetPixel(x, y)
            img.SetPixel(x, y, Color.FromArgb(0, int c.G, int c.B))

    img.Save("../../../../images/lenna-no-red.png")
    0 // return an integer exit code
