import { createDb, type Db } from "@app0/db";

// Jedno zdieľané spojenie na proces — hot reload v dev režime
// nesmie vytvárať nové pooly pri každej zmene súboru.
const globalCache = globalThis as unknown as { __app0Db?: Db };

export function getDb(): Db {
  return (globalCache.__app0Db ??= createDb());
}
