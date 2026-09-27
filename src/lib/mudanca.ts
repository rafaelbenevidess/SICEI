/**
 * Resumo curto do "antes → depois" de um registro do log (RF-21), para caber numa linha da
 * tabela de auditoria. O JSON completo continua no banco e entra no hash.
 */
export interface ResumoDaMudanca {
  antes: string | null
  depois: string | null
}

/** Campos técnicos que não ajudam quem lê o log: identificadores, origem e datas. */
const IGNORADOS = new Set([
  'id',
  'itemId',
  'usuarioId',
  'destinoId',
  'colaboradorId',
  'fornecedorId',
  'estornaId',
  'ip',
  'userAgent',
  'criadoEm',
  'atualizadoEm',
  'nomeChave',
])

/** Campos mais informativos aparecem primeiro. */
const PRIORIDADE = [
  'tipo',
  'quantidade',
  'codigo',
  'login',
  'perfil',
  'posicao',
  'status',
  'nivel',
  'nome',
  'razaoSocial',
  'estoqueMinimo',
  'falhasLogin',
]

const LIMITE = 90

type Objeto = Record<string, unknown>

function ehObjeto(v: unknown): v is Objeto {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function valorCurto(v: unknown): string {
  if (v === null || v === undefined) return '∅'
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  const json = JSON.stringify(v)
  return json.length > 30 ? `${json.slice(0, 29)}…` : json
}

function ordenar(chaves: string[]): string[] {
  const peso = (k: string) => {
    const i = PRIORIDADE.indexOf(k)
    return i === -1 ? PRIORIDADE.length : i
  }
  return [...chaves].sort((a, b) => peso(a) - peso(b))
}

function cortar(texto: string): string {
  return texto.length > LIMITE ? `${texto.slice(0, LIMITE - 1)}…` : texto
}

function listar(obj: Objeto, chaves: string[], maximo: number): string | null {
  if (chaves.length === 0) return null
  const partes = chaves.slice(0, maximo).map((k) => `${k}: ${valorCurto(obj[k])}`)
  const resto = chaves.length - maximo
  return cortar(partes.join(' · ') + (resto > 0 ? ` · +${resto}` : ''))
}

/** Chaves relevantes de um registro sozinho (criação ou exclusão lógica). */
function chavesDe(obj: Objeto): string[] {
  return ordenar(Object.keys(obj).filter((k) => !IGNORADOS.has(k) && obj[k] !== null))
}

export function resumoDaMudanca(antes: unknown, depois: unknown, maximo = 3): ResumoDaMudanca {
  const a = ehObjeto(antes) ? antes : null
  const d = ehObjeto(depois) ? depois : null

  // movimentação: o que importa é o saldo antes e depois
  if (!a && d && typeof d.saldoAnterior === 'number' && typeof d.saldoPosterior === 'number')
    return { antes: `saldo: ${d.saldoAnterior}`, depois: `saldo: ${d.saldoPosterior}` }

  if (a && d) {
    const mudaram = ordenar(
      [...new Set([...Object.keys(a), ...Object.keys(d)])].filter(
        (k) => !IGNORADOS.has(k) && JSON.stringify(a[k]) !== JSON.stringify(d[k]),
      ),
    )
    if (mudaram.length > 0)
      return { antes: listar(a, mudaram, maximo), depois: listar(d, mudaram, maximo) }
    return { antes: listar(a, chavesDe(a), maximo), depois: listar(d, chavesDe(d), maximo) }
  }

  return {
    antes: a ? listar(a, chavesDe(a), maximo) : antes == null ? null : cortar(valorCurto(antes)),
    depois: d ? listar(d, chavesDe(d), maximo) : depois == null ? null : cortar(valorCurto(depois)),
  }
}

/** Hash encurtado para a tabela: "9f3a…c21e". */
export function hashCurto(hash: string): string {
  return hash.length <= 10 ? hash : `${hash.slice(0, 4)}…${hash.slice(-4)}`
}
