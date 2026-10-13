import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient(): PrismaClient {
  const rawUrl = process.env.DATABASE_URL || "file:./dev.db";
  const authToken = process.env.DATABASE_AUTH_TOKEN;

  let resolvedUrl = rawUrl;
  if (rawUrl.startsWith("file:./") || rawUrl.startsWith("file:../")) {
    const relPath = rawUrl.replace(/^file:/, "");
    resolvedUrl = `file:${path.resolve(process.cwd(), relPath)}`;
  } else if (
    !rawUrl.startsWith("file:") &&
    !rawUrl.startsWith("http:") &&
    !rawUrl.startsWith("https:") &&
    !rawUrl.startsWith("libsql:")
  ) {
    resolvedUrl = `file:${path.resolve(process.cwd(), rawUrl)}`;
  }

  const adapter = new PrismaLibSql({
    url: resolvedUrl,
    authToken: authToken || undefined,
  });

  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

export default db;
