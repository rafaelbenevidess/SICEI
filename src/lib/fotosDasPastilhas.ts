import type { FotoDaPastilha } from '@/domain/pastilha'
import manifesto from './fotos-pastilhas.json'

/**
 * Fotos recortadas das pastilhas que existem em public/pastilhas. O arquivo JSON é gerado
 * por `npm run pastilhas` (scripts/recortar-pastilhas.mjs): não edite à mão.
 */
export const FOTOS_DAS_PASTILHAS: Record<string, FotoDaPastilha> = manifesto
