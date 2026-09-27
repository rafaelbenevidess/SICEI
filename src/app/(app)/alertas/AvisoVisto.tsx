'use client'

import { useEffect } from 'react'
import { acaoAvisoDeAlertasVisto } from '@/app/acoes/autenticacao'

/** Chegar à tela de alertas, por qualquer caminho, desliga o pop-up do login (RF-13). */
export function AvisoVisto() {
  useEffect(() => {
    void acaoAvisoDeAlertasVisto()
  }, [])
  return null
}
