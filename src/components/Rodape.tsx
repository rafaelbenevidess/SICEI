import { anosDeDireitos, PRODUTO } from '@/lib/produto'

/** Rodapé de todas as páginas: titular do SICEI, empresa licenciada e contato comercial. */
export function Rodape({ anoAtual, licenciada }: { anoAtual: number; licenciada: string | null }) {
  return (
    <footer className="nao-imprimir flex flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-4 text-xs text-ink-3 md:px-8 md:pl-4">
      <p>
        {PRODUTO.sigla} © {anosDeDireitos(anoAtual)} {PRODUTO.titular}. Todos os direitos
        reservados.
      </p>
      <p>
        {licenciada && <>Licenciado para {licenciada} · </>}
        <span className="sr-only">Contato comercial: </span>
        <a href={`mailto:${PRODUTO.contatoComercial}`}>{PRODUTO.contatoComercial}</a>
      </p>
    </footer>
  )
}
