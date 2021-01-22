open System
open System.IO
open System.Diagnostics
open System.Drawing

let sortFun (_, c: Color) = (float c.R ** 2.) + (float c.B ** 2.) + (float c.G ** 2.)

let imageToSortedMap (img: Bitmap) =
    seq { for x in 0 .. img.Width - 1 do
            for y in 0 .. img.Height - 1 do
                yield (x, y), img.GetPixel(x, y) }
    |> Seq.sortBy sortFun
    |> Seq.toArray

let loadBitmap path =
    Image.FromFile(path) :?> Bitmap


let output (height: int) (width: int) nameA (mapA: ((int*int)*Color)[]) nameB (mapB: ((int*int)*Color)[]) =
    let mapBAdjusted = 
        if mapA.Length = mapB.Length then
            mapB
        else
            let ratio = float mapB.Length / float mapA.Length
            let intPart = int (Math.Floor ratio)
            let remainder = mapA.Length - (mapB.Length * intPart)
            let rnd = new Random()
            [| for _ in 1 .. intPart do yield! mapB
               for _ in 1 .. remainder do yield mapB.[rnd.Next mapB.Length] |]
            |> Seq.sortBy sortFun 
            |> Seq.toArray

    let zippedMaps = Seq.zip mapA mapBAdjusted
    let img = new Bitmap(height, width)
    for (((x,y),_),(_, c)) in zippedMaps do
        img.SetPixel(x, y, c)

    img.Save(Path.Combine(@"C:\code\PixelSwap\images\", sprintf  "%s_%s.jpg" nameA nameB))


let swap (imgPath1: string) (imgPath2: string) =
    let stopwatch = Stopwatch.StartNew();
    let img1 = loadBitmap imgPath1
    let name1 = Path.GetFileNameWithoutExtension(imgPath1)
    let map1 = imageToSortedMap img1
    
    let img2 = loadBitmap imgPath2
    let name2 = Path.GetFileNameWithoutExtension(imgPath2)
    let map2 = imageToSortedMap img2

    output img1.Width img1.Height name1 map1 name2 map2
    output img2.Width img2.Height name2 map2 name1 map1 
    printfn "stopwatch.Elapsed: %O" stopwatch.Elapsed
        
[<EntryPoint>]
let main argv =
    swap @"C:\code\PixelSwap\images\Square\van-gogh.jpg" @"C:\code\PixelSwap\images\Square\klimt-adele.jpg"
    0 // return an integer exit code
