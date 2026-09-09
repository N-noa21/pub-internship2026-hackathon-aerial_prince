/**
 * 資格情報の読み出し。
 *
 * Snowflake App Runtime では app.yml の `secrets:` が /secrets/<name>/secret_string
 * にファイルとしてマウントされる（環境変数には入らない）。
 * https://docs.snowflake.com/en/developer-guide/snowflake-app-runtime/runtime-environment
 *
 * ローカル開発では .env.local の環境変数を使うので、両方見る。
 * ローテーションが再デプロイなしで効くよう、毎回読み直してキャッシュしない。
 */
import { readFileSync } from "node:fs";

/** マウント済みシークレット → 環境変数 の順に探す。無ければ空文字 */
export function cred(name: string): string {
  try {
    return readFileSync(`/secrets/${name}/secret_string`, "utf8").trim();
  } catch {
    return process.env[name]?.trim() ?? "";
  }
}
