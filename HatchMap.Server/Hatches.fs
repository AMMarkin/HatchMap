module Hatches 

open System
open System.IO
open MetadataExtractor

let currentDirectory = Directory.GetCurrentDirectory()

let photosBaseDirectory = Path.Combine [|currentDirectory;"wwwroot";"Photos"|]

let photoDirs = Directory.GetDirectories photosBaseDirectory 


let rationalToDouble (r : Rational) = (r.Numerator |> Convert.ToDouble) / (r.Denominator |> Convert.ToDouble)
    
let dmsToLL (dms : float array) = dms[0] + dms[1]/(60 |> float) + dms[2]/(3600 |> float) 

let getCoordinate index (tagDirectory: Directory)=
    tagDirectory.GetRationalArray index
    |> Array.map rationalToDouble
    |> dmsToLL

let getCoordinates dir = 
    getCoordinate 2 dir, getCoordinate 4 dir

let dirsInfo file = $"Фото '{file}' не содержит GPS-тегов"

let getPhotoGPS (file : string) =
    ImageMetadataReader.ReadMetadata file 
    |> seq
    |> Seq.find (fun dir  -> dir.Name = "GPS")
    |> getCoordinates

let getPhotoInfos = 
    let getPhotoInfoFromFile file = 
        let latitude,longitude = getPhotoGPS file
            
        {|
            Filename = Path.GetFileName file
            Type = (Directory.GetParent file).Name
            Latitude = latitude
            Longitude = longitude
        |}
    let getPhotoInfoFromDir dir = 
        dir 
        |> Directory.GetFiles
        |> Array.map getPhotoInfoFromFile

    photoDirs
    |> Array.map getPhotoInfoFromDir
    |> Array.collect id
    