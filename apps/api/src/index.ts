import { createApp } from "./app.js";
import { loadEnv } from "./env.js";

const env = loadEnv();
const app = createApp(env);

await app.listen({ port: env.PORT, host: "0.0.0.0" });
