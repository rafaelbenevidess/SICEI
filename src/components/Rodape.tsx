import { anosDeDireitos, PRODUTO } from '@/lib/produto'

/** Rodapé de todas as páginas: titular do SICEI, empresa licenciada e contato comercial. */
export function Rodape({ anoAtual, licenciada }: { anoAtual: number; licenciada: string | null }) {
  return (
    <footer className="nao-imprimir border-t border-slate-200 px-4 py-4 text-center text-xs text-slate-500">
      <p>
        {PRODUTO.sigla} © {anosDeDireitos(anoAtual)} {PRODUTO.titular}. Todos os direitos
        reservados.
      </p>
      <p>
        {licenciada && <>Licenciado para {licenciada} · </>}
        Contato comercial:{' '}
        <a href={`mailto:${PRODUTO.contatoComercial}`} className="underline">
          {PRODUTO.contatoComercial}
        </a>
      </p>
    </footer>
  )
}
