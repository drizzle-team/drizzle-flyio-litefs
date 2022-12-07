Example project for [Drizzle LiteFS SQLite package](https://github.com/drizzle-team/drizzle-orm/tree/main/drizzle-orm-sqlite)  
Subscribe to our updates on [Twitter](https://twitter.com/DrizzleOrm)!

## Initial project setup
To setup Fly.io LiteFS app - please refer to official [fly.io docs](https://fly.io/docs/) and [LiteFS docs](https://fly.io/docs/litefs/)

## Update your fly.toml
```toml
name = "YOU PROJECT NAME"
## ...

[mounts]
  destination = "/mnt/sqlite"
  ## fly mounts create mount_name
  source = "YOUR SOURCE NAME"

## ...
```

## Quick start
```shell
## install dependencies
npm i

## install fly cli - https://fly.io/docs/flyctl/installing/
fly login

## launch fly app
fly launch

## create fly volume
fly volumes create source_name

## deploy changes
fly deploy

## need multi regional scale?
## create volume in different region
fly volumes create source_name
## config scaling for your app
fly scale count 2 --max-per-region=1
```
