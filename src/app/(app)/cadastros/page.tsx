import type { Metadata } from 'next'
import Link from 'next/link'
import type { ReactNode } from 'react'
import {
  Factory,
  FileUp,
  Grid3x3,
  HardHat,
  Info,
  MapPin,
  Package,
  Plus,
  QrCode,
  Truck,
} from 'lucide-react'
import { formatarCnpj } from '@/domain/cnpj'
import { pode } from '@/domain/permissoes'
import {
  BadgeStatus,
  ChipCodigo,
  ChipPosicao,
  LinkBotao,
  Pagina,
  Selo,
  Tabela,
  Vazio,
} from '@/components/ui'
import { NOME_TIPO_DESTINO, nomeDaPastilha } from '@/lib/formatar'
import {
  listarColaboradores,
  listarDestinos,
  listarFabricantes,
  listarFornecedores,
  listarItensDoCadastro,
  listarPosicoes,
} from '@/server/consultas/cadastros'
import { exigirPermissaoDaPagina } from '@/server/web/sessao-atual'
import {
  BotaoSituacao,
  FormColaborador,
  FormDestino,
  FormFabricante,
  FormFornecedor,
  FormPosicao,
} from './formularios'
import { MapaAlmoxarifado } from './MapaAlmoxarifado'

import { AbasDeCadastros } from '@/components/abasDasTelas'

export const metadata: Metadata = { title: 'Cadastros' }

const ABAS = [
  'itens',
  'fabricantes',
  'fornecedores',
  'destinos',
  'colaboradores',
  'posicoes',
] as const
type Aba = (typeof ABAS)[number]

const INFO: Record<Aba, { rotulo: string; descricao: string; novo: string; Icone: typeof Truck }> =
  {
    itens: {
      rotulo: 'Itens',
      descricao:
        'As pastilhas controladas no estoque. Cada item nasce com fabricante e pelo menos um fornecedor.',
      novo: 'Novo item',
      Icone: Package,
    },
    fabricantes: {
      rotulo: 'Fabricantes',
      descricao: 'Quem produz as pastilhas. O nome não se repete, sem diferenciar maiúsculas.',
      novo: 'Novo fabricante',
      Icone: Factory,
    },
    fornecedores: {
      rotulo: 'Fornecedores',
      descricao:
        'Quem vende para a empresa. CNPJ válido e único, inclusive no formato alfanumérico.',
      novo: 'Novo fornecedor',
      Icone: Truck,
    },
    destinos: {
      rotulo: 'Destinos',
      descricao: 'Máquinas, setores e centros de custo que recebem as pastilhas.',
      novo: 'Novo destino',
      Icone: MapPin,
    },
    colaboradores: {
      rotulo: 'Colaboradores',
      descricao: 'Quem retira e devolve pastilhas no balcão. Não têm login no sistema.',
      novo: 'Novo colaborador',
      Icone: HardHat,
    },
    posicoes: {
      rotulo: 'Posições',
      descricao: 'Armário, gaveta e compartimento. Cada posição guarda um item só.',
      novo: 'Nova posição',
      Icone: Grid3x3,
    },
  }

/** RF-03, RF-04, RF-05, RF-06, RF-27 e RF-28 numa página com abas. */
export default async function Cadastros({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string; editar?: string }>
}) {
  const u = await exigirPermissaoDaPagina('cadastros:ver')
  const p = await searchParams
  const aba: Aba = (ABAS as readonly string[]).includes(p.aba ?? '') ? (p.aba as Aba) : 'itens'
  const editar = pode(u.perfil, 'cadastros:editar')
  const [itens, fabricantes, fornecedores, destinos, colaboradores, posicoes] = await Promise.all([
    listarItensDoCadastro(),
    listarFabricantes(),
    listarFornecedores(),
    listarDestinos(),
    listarColaboradores(),
    listarPosicoes(),
  ])
  const contagem: Record<Aba, number> = {
    itens: itens.length,
    fabricantes: fabricantes.length,
    fornecedores: fornecedores.length,
    destinos: destinos.length,
    colaboradores: colaboradores.length,
    posicoes: posicoes.length,
  }
  const editando = editar ? p.editar : undefined
  const linkEditar = (id: string) => `/cadastros?aba=${aba}&editar=${id}#formulario`
  const acoes = (entidade: string, id: string, ativo: boolean) =>
    editar && (
      <span className="flex items-center justify-end gap-1">
        <Link
          href={linkEditar(id)}
          className="inline-flex h-8 items-center rounded-lg px-3 text-[13px] font-medium text-ink-2 no-underline hover:bg-surface-2"
        >
          Editar
        </Link>
        <BotaoSituacao entidade={entidade} id={id} ativo={ativo} />
      </span>
    )
  const situacao = (ativo: boolean, femea = false) =>
    ativo ? (
      <Selo tom="ok">{femea ? 'Ativa' : 'Ativo'}</Selo>
    ) : (
      <Selo>{femea ? 'Inativa' : 'Inativo'}</Selo>
    )

  let tabela: ReactNode
  let formulario: ReactNode = null
  let tituloForm = INFO[aba].novo

  if (aba === 'itens') {
    // o formulário do item é grande: fica na própria tela, aqui só o atalho
    formulario = (
      <div className="flex flex-col gap-3">
        <p className="text-[13px] text-ink-2">
          O cadastro abre com o próximo código da sequência já preenchido, e o fabricante e o
          fornecedor podem ser cadastrados ali mesmo.
        </p>
        <LinkBotao href="/itens/novo" icone={Plus}>
          Cadastrar item
        </LinkBotao>
        {pode(u.perfil, 'importacao:executar') && (
          <LinkBotao href="/admin/importacao" variante="secundario" icone={FileUp}>
            Importar planilha
          </LinkBotao>
        )}
      </div>
    )
    tabela = (
      <Tabela rotulo="Itens" larguraMinima={620}>
        <thead>
          <tr>
            <th>Código</th>
            <th>Pastilha</th>
            <th>Posição</th>
            <th>Situação</th>
            {editar && <th className="text-right">Ações</th>}
          </tr>
        </thead>
        <tbody>
          {itens.map((i) => (
            <tr key={i.id} className={i.ativo ? '' : 'opacity-60'}>
              <td>
                <Link href={`/itens/${i.id}`} className="no-underline">
                  <ChipCodigo forte>{i.codigo}</ChipCodigo>
                </Link>
              </td>
              <td>
                <span className="block font-medium">{nomeDaPastilha(i)}</span>
                <span className="text-[13px] text-ink-3">
                  {i.fabricante.nome} · {i._count.fornecedores}{' '}
                  {i._count.fornecedores === 1 ? 'fornecedor' : 'fornecedores'}
                </span>
              </td>
              <td>
                <ChipPosicao>{i.posicao?.codigo}</ChipPosicao>
              </td>
              <td>{i.ativo ? <BadgeStatus status={i.status} /> : <Selo>Inativo</Selo>}</td>
              {editar && (
                <td>
                  <span className="flex items-center justify-end gap-1">
                    <Link
                      href={`/itens/${i.id}/editar`}
                      className="inline-flex h-8 items-center rounded-lg px-3 text-[13px] font-medium text-ink-2 no-underline hover:bg-surface-2"
                    >
                      Editar
                    </Link>
                  </span>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </Tabela>
    )
  } else if (aba === 'fabricantes') {
    const alvo = fabricantes.find((f) => f.id === editando)
    if (alvo) tituloForm = 'Editar fabricante'
    formulario = <FormFabricante key={alvo?.id ?? 'novo'} id={alvo?.id} nome={alvo?.nome} />
    tabela = (
      <Tabela rotulo="Fabricantes" larguraMinima={520}>
        <thead>
          <tr>
            <th>Nome</th>
            <th className="text-right">Itens</th>
            <th>Situação</th>
            {editar && <th className="text-right">Ações</th>}
          </tr>
        </thead>
        <tbody>
          {fabricantes.map((f) => (
            <tr key={f.id} className={f.ativo ? '' : 'opacity-60'}>
              <td className="font-medium">{f.nome}</td>
              <td className="text-right">{f._count.itens}</td>
              <td>{situacao(f.ativo)}</td>
              {editar && <td>{acoes('fabricante', f.id, f.ativo)}</td>}
            </tr>
          ))}
        </tbody>
      </Tabela>
    )
  } else if (aba === 'fornecedores') {
    const alvo = fornecedores.find((f) => f.id === editando)
    if (alvo) tituloForm = 'Editar fornecedor'
    formulario = (
      <FormFornecedor
        key={alvo?.id ?? 'novo'}
        id={alvo?.id}
        valores={alvo ? { ...alvo, cnpj: formatarCnpj(alvo.cnpj) } : undefined}
      />
    )
    tabela = (
      <Tabela rotulo="Fornecedores" larguraMinima={720}>
        <thead>
          <tr>
            <th>Razão social</th>
            <th>CNPJ</th>
            <th>Contato</th>
            <th className="text-right">Itens</th>
            <th>Situação</th>
            {editar && <th className="text-right">Ações</th>}
          </tr>
        </thead>
        <tbody>
          {fornecedores.map((f) => (
            <tr key={f.id} className={f.ativo ? '' : 'opacity-60'}>
              <td>
                <span className="block font-medium">{f.razaoSocial}</span>
                {f.nomeFantasia && <span className="text-[13px] text-ink-3">{f.nomeFantasia}</span>}
              </td>
              <td className="font-mono text-xs whitespace-nowrap">{formatarCnpj(f.cnpj)}</td>
              <td className="text-ink-2">
                {[f.contato, f.telefone].filter(Boolean).join(' · ') || '—'}
              </td>
              <td className="text-right">{f._count.itens}</td>
              <td>{situacao(f.ativo)}</td>
              {editar && <td>{acoes('fornecedor', f.id, f.ativo)}</td>}
            </tr>
          ))}
        </tbody>
      </Tabela>
    )
  } else if (aba === 'destinos') {
    const alvo = destinos.find((d) => d.id === editando)
    if (alvo) tituloForm = 'Editar destino'
    formulario = <FormDestino key={alvo?.id ?? 'novo'} id={alvo?.id} valores={alvo} />
    tabela = (
      <Tabela rotulo="Destinos" larguraMinima={600}>
        <thead>
          <tr>
            <th>Código</th>
            <th>Nome</th>
            <th>Tipo</th>
            <th>Situação</th>
            {editar && <th className="text-right">Ações</th>}
          </tr>
        </thead>
        <tbody>
          {destinos.map((d) => (
            <tr key={d.id} className={d.ativo ? '' : 'opacity-60'}>
              <td className="font-mono text-xs">{d.codigo}</td>
              <td className="font-medium">{d.nome}</td>
              <td className="text-ink-2">{NOME_TIPO_DESTINO[d.tipo]}</td>
              <td>{situacao(d.ativo)}</td>
              {editar && <td>{acoes('destino', d.id, d.ativo)}</td>}
            </tr>
          ))}
        </tbody>
      </Tabela>
    )
  } else if (aba === 'colaboradores') {
    const alvo = colaboradores.find((c) => c.id === editando)
    if (alvo) tituloForm = 'Editar colaborador'
    formulario = <FormColaborador key={alvo?.id ?? 'novo'} id={alvo?.id} valores={alvo} />
    tabela = (
      <Tabela rotulo="Colaboradores" larguraMinima={600}>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Matrícula</th>
            <th>Setor</th>
            <th>Situação</th>
            {editar && <th className="text-right">Ações</th>}
          </tr>
        </thead>
        <tbody>
          {colaboradores.map((c) => (
            <tr key={c.id} className={c.ativo ? '' : 'opacity-60'}>
              <td className="font-medium">{c.nome}</td>
              <td className="font-mono text-xs">{c.matricula ?? '—'}</td>
              <td className="text-ink-2">{c.setor}</td>
              <td>{situacao(c.ativo)}</td>
              {editar && <td>{acoes('colaborador', c.id, c.ativo)}</td>}
            </tr>
          ))}
        </tbody>
      </Tabela>
    )
  } else {
    formulario = <FormPosicao />
    tabela = (
      <div className="flex flex-col gap-6">
        <MapaAlmoxarifado
          posicoes={posicoes.map((p) => ({
            codigo: p.codigo,
            armario: p.armario,
            gaveta: p.gaveta,
            compartimento: p.compartimento,
            ativo: p.ativo,
            item: p.item ? { id: p.item.id, codigo: p.item.codigo } : null,
          }))}
        />
        <Tabela rotulo="Posições" larguraMinima={620}>
          <thead>
            <tr>
              <th>Posição</th>
              <th>Item guardado</th>
              <th>Situação</th>
              <th className="text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {posicoes.map((p) => (
              <tr key={p.id} className={p.ativo ? '' : 'opacity-60'}>
                <td className="font-mono text-[13px] font-medium">
                  {p.codigo}
                  {p.item && p.etiquetaPendente && (
                    <span className="ml-2 font-sans">
                      <Selo tom="warn">Etiqueta não impressa</Selo>
                    </span>
                  )}
                </td>
                <td>
                  {p.item ? (
                    <Link href={`/itens/${p.item.id}`} className="text-ink no-underline">
                      <ChipCodigo>{p.item.codigo}</ChipCodigo>{' '}
                      <span className="text-ink-2">{p.item.descricao}</span>
                    </Link>
                  ) : (
                    <span className="text-ink-3">livre</span>
                  )}
                </td>
                <td>{situacao(p.ativo, true)}</td>
                <td>
                  <span className="flex items-center justify-end gap-1">
                    {p.item && pode(u.perfil, 'etiquetas:imprimir') && (
                      <LinkBotao
                        href={`/cadastros/posicoes/etiquetas?codigos=${p.codigo}`}
                        variante="fantasma"
                        pequeno
                        icone={QrCode}
                      >
                        Etiqueta
                      </LinkBotao>
                    )}
                    {editar && <BotaoSituacao entidade="posicao" id={p.id} ativo={p.ativo} />}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </Tabela>
      </div>
    )
  }

  const vazio = contagem[aba] === 0

  return (
    <Pagina titulo="Cadastros" descricao={INFO[aba].descricao}>
      <AbasDeCadastros
        ativa={aba}
        contagens={contagem}
        comEtiquetas={pode(u.perfil, 'etiquetas:imprimir')}
        etiquetasPendentes={posicoes.filter((x) => x.etiquetaPendente).length}
      />
      <div
        className={`grid items-start gap-6 ${editar ? 'min-[96rem]:grid-cols-[minmax(0,1fr)_340px]' : ''}`}
      >
        <div className="min-w-0">
          {vazio && aba !== 'posicoes' ? <Vazio>Nenhum cadastro ainda.</Vazio> : tabela}
        </div>
        {editar && (
          <aside
            id="formulario"
            className="scroll-mt-24 cartao p-6 min-[96rem]:sticky min-[96rem]:top-[88px]"
          >
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <h2 className="text-base font-semibold">{tituloForm}</h2>
              {editando && tituloForm.startsWith('Editar') && (
                <Link href={`/cadastros?aba=${aba}`} className="text-[13px]">
                  Cancelar
                </Link>
              )}
            </div>
            {formulario}
            <p className="mt-4 flex gap-2 text-xs text-ink-3">
              <Info aria-hidden className="mt-px size-3.5 shrink-0" />
              Cadastro que já aparece em alguma movimentação não é excluído, só inativado.
            </p>
          </aside>
        )}
      </div>
    </Pagina>
  )
}
