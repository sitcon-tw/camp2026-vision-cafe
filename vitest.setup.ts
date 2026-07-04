import { loadEnvConfig } from "@next/env"

loadEnvConfig(process.cwd())

process.env.MONGODB_URI ??= "mongodb://localhost:27017/vision_cafe"
