open System
open Microsoft.AspNetCore.Builder
open Microsoft.AspNetCore.Http
open Microsoft.Extensions.Hosting
open Hatches

[<EntryPoint>]
let main args =
    let builder = WebApplication.CreateBuilder args
    let app = builder.Build()

    app.UseStaticFiles() |> ignore
    
    app.MapGet("/hatches", Func<HttpContext, obj>(fun context -> 
        //запрет кеширования
        context.Response.Headers.CacheControl <- "no-store"
        context.Response.Headers.Pragma <- "no-cache"
        getPhotoInfos
        )) |> ignore
    app.MapFallbackToFile "index.html" |> ignore
    app.Run()

    0 // Exit code

