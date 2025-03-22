open System
open Microsoft.AspNetCore.Builder
open Microsoft.Extensions.Hosting
open Hatches

[<EntryPoint>]
let main args =
    let builder = WebApplication.CreateBuilder(args)
    let app = builder.Build()

    app.UseStaticFiles() |> ignore
    
    app.MapGet("/hatches", Func<obj>(fun () -> getPhotoInfos)) |> ignore
    app.MapFallbackToFile("index.html") |> ignore
    app.Run()

    0 // Exit code

