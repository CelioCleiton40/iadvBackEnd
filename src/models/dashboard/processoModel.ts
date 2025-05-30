import { Db } from "mongodb";
import { Processo } from "../types/Processo";

/**
 * Insere ou atualiza um processo no banco de dados.
 */
export async function salvarOuAtualizarProcesso(db: Db, processo: Processo): Promise<void> {
  await db.collection<Processo>("processos").updateOne(
    { numeroProcesso: processo.numeroProcesso },
    { $set: processo },
    { upsert: true } // cria se não existir
  );
}
