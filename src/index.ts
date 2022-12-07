import cors from "@koa/cors";
import Router from "@koa/router";
import { SQLiteConnector } from "drizzle-orm-sqlite";
import Koa from "koa";
import bodyParser from "koa-bodyparser";
import z from "zod";
import minimist from "minimist";
import { users } from "./schema";
import Database from "better-sqlite3";

const argv = minimist(process.argv.slice(2));

const SQLITE_PATH = argv["sqlite-path"] ?? "db.sqlite3";
const PORT = 8787;

const client = new Database(SQLITE_PATH);
const connector = new SQLiteConnector(client);
const db = connector.connect();

// run migrations from ./drizzle folder
connector.migrate({ migrationsFolder: "./drizzle" });

const app = new Koa();
const router = new Router();

const newUserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
});

router.use((ctx, next) => {
  const region = ctx.get("region");
  if (region && region !== process.env["FLY_REGION"]) {
    ctx.set("fly-replay", `region=${region}`);
    return;
  }
  return next();
});

router.get("/users", (ctx) => {
  const start = process.hrtime();
  const list = db.select(users).all();
  const end = process.hrtime(start);
  const duration = `${(end[0] * 1000000000 + end[1]) / 1000000}ms`;
  ctx.body = {
    users: list,
    region: process.env["FLY_REGION"],
    duration,
  };
});

router.post("/users", (ctx) => {
  const newUser = newUserSchema.parse(ctx.request.body);
  const start = process.hrtime();
  const user = db.insert(users).values(newUser).returning().get()!;
  const end = process.hrtime(start);
  const duration = `${(end[0] * 1000000000 + end[1]) / 1000000}ms`;

  ctx.body = {
    user,
    region: process.env["FLY_REGION"],
    duration,
  };
});

app.use(cors());
app.use(bodyParser());

app.use(router.routes());
app.use(router.allowedMethods());

app.listen(PORT, () => {
  console.log(`🚀 Server ready at http://localhost:${PORT}`);
});
