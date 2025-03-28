# https://hub.docker.com/_/microsoft-dotnet
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /source

# copy csproj and restore as distinct layers
COPY *.sln .
COPY HatchMap.Server/*.fsproj ./HatchMap.Server/
RUN dotnet restore

# copy everything else and build app
COPY HatchMap.Server/. ./HatchMap.Server/
WORKDIR /source/HatchMap.Server
RUN dotnet publish -c release -o /app --no-restore

# final stage/image
FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /app ./
ENTRYPOINT ["dotnet", "HatchMap.Server.dll"]
