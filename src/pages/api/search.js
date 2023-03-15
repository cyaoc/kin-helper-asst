import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { Configuration, OpenAIApi } from "openai";

loadEnvConfig(process.cwd());

export default async function handler( req, res ) {
    try {
        const { query } = req.body
        const input = query.replace(/\n/g, " ");
        const apiKey = process.env.OPENAI_API_KEY;
        const configuration = new Configuration({ apiKey });
        const openai = new OpenAIApi(configuration);
        const embeddingResponse = await openai.createEmbedding(
          {
            model: "text-embedding-ada-002",
            input
          });
        const [{ embedding }] = embeddingResponse.data.data;
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
        const { data, error } = await supabase.rpc("kintone_search", {
          query_embedding: embedding,
          similarity_threshold: 0.01,
          match_count: 5
        });
        if ( error ) {
            throw error;
        }
        res.status(200).json( data );
    } catch ( error ) {
        console.error(error)
        res.status(500).send(error.message);
    }
}