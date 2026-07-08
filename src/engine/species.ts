import type { Biome, Species, SpeciesPixels } from './types'

// Vite 支持直接 import JSON
import aquafin from '../data/pixels/aquafin_drake_05_pixels.json'
import budtail from '../data/pixels/budtail_bunny_06_pixels.json'
import mushroom from '../data/pixels/mushroom_sprite_02_pixels.json'
import plumefox from '../data/pixels/plume_fox_monster_01_pixels.json'
import seadrake from '../data/pixels/sea_drake_04_pixels.json'
import winged from '../data/pixels/winged_drake_03_pixels.json'

interface Meta { id: string; name: string; biome: Biome; data: unknown }

const METAS: Meta[] = [
  { id: 'mushroom_sprite_02', name: '伞菇兽',   biome: 'forest',  data: mushroom },
  { id: 'budtail_bunny_06',   name: '苞尾兔甲兽', biome: 'forest',  data: budtail },
  { id: 'winged_drake_03',    name: '小翼龙兽',   biome: 'volcano', data: winged },
  { id: 'plume_fox_monster_01', name: '羽尾狐兽', biome: 'volcano', data: plumefox },
  { id: 'aquafin_drake_05',   name: '冠鳍海龙',   biome: 'beach',   data: aquafin },
  { id: 'sea_drake_04',       name: '海鳍龙兽',   biome: 'beach',   data: seadrake },
]

export const SPECIES: Species[] = METAS.map((m) => ({
  id: m.id,
  name: m.name,
  biome: m.biome,
  pixels: m.data as SpeciesPixels,
}))

export const SPECIES_BY_ID: Record<string, Species> = {}
for (const s of SPECIES) SPECIES_BY_ID[s.id] = s

export const SPECIES_BY_BIOME: Record<Biome, Species[]> = {
  forest: SPECIES.filter((s) => s.biome === 'forest'),
  volcano: SPECIES.filter((s) => s.biome === 'volcano'),
  beach: SPECIES.filter((s) => s.biome === 'beach'),
}

export const BIOME_INFO: Record<Biome, { name: string; art: string; theme: string; blurb: string }> = {
  forest:  { name: '幽菇密林', art: '/assets/locations/forest.png',  theme: 'var(--forest)',  blurb: '菌伞如盖、丁达尔光倾泻的古老森林。' },
  volcano: { name: '熔火裂谷', art: '/assets/locations/volcano.png', theme: 'var(--volcano)', blurb: '岩浆奔流、晶簇灼灼的炽热峡谷。' },
  beach:   { name: '珊瑚湾', art: '/assets/locations/beach.png',   theme: 'var(--beach)',   blurb: '碧波温柔、贝珠遍地的秘境海湾。' },
}
