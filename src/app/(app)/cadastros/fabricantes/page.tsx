import { redirect } from 'next/navigation'

/** A página de cadastros agora tem abas: este endereço antigo leva à aba certa. */
export default function Redirecionar() {
  redirect('/cadastros?aba=fabricantes')
}
