import cors from '@koa/cors';
import Router from '@koa/router';
import { SQLiteConnector } from 'drizzle-orm-sqlite';
import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import z from 'zod';
import minimist from 'minimist';
import { users } from './schema';
import fs from 'fs';
import { DefaultLogger, sql } from 'drizzle-orm';
import Database from 'better-sqlite3';

const argv = minimist(process.argv.slice(2));

const SQLITE_PATH = argv['sqlite-path'] ?? 'db.sqlite3';
const PORT = 8787;
const client = new Database(SQLITE_PATH);
const db = new SQLiteConnector(client, { logger: new DefaultLogger() }).connect();

db.run(sql.raw(fs.readFileSync('schema.sql', 'utf-8')));
console.log('Created schema');

const app = new Koa();
const router = new Router();

const newUserSchema = z.object({
	name: z.string(),
	email: z.string().email(),
});

router.use((ctx, next) => {
	const region = ctx.get('region');
	console.log('region', region, process.env['FLY_REGION']);
	if (region && region !== process.env['FLY_REGION']) {
		ctx.set('fly-replay', `region=${region}`);
		return;
	}
	return next();
});

router.get('/users', (ctx) => {
	const list = db.select(users).execute();
	ctx.body = {
		users: list,
		region: process.env['FLY_REGION'],
	};
});

router.post('/users', (ctx) => {
	const newUser = newUserSchema.parse(ctx.request.body);
	const user = db.insert(users).values(newUser).returning().execute()[0]!;
	ctx.body = {
		user,
		region: process.env['FLY_REGION'],
	};
});

app.use(cors());
app.use(bodyParser());

app.use(router.routes());
app.use(router.allowedMethods());

app.listen(PORT, () => {
	console.log(`🚀 Server ready at http://localhost:${PORT}`);
});
