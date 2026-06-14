import type { Enemy, EnemyIntent, EnemyRole } from '../types';

interface EnemyTemplate {
  id: string;
  name: string;
  type: string;
  role: EnemyRole;
  priority: number;
  hp: number;
  shield: number;
  attack: number;
  defense: number;
  evasion: number;
  description: string;
  sprite: string;
  energyCostIncrease?: number;
  healAmount?: number;
  abilities: Array<{
    id: string;
    name: string;
    description: string;
    cooldown: number;
    damage?: number;
    effect?: string;
  }>;
  intentWeights: Record<string, number>;
}

export const enemyTemplates: EnemyTemplate[] = [
  {
    id: 'scout_drone',
    name: '侦察无人机',
    type: 'drone',
    role: 'escort',
    priority: 3,
    hp: 30,
    shield: 10,
    attack: 8,
    defense: 0,
    evasion: 0.2,
    description: '轻型侦察单位，速度快但装甲薄弱',
    sprite: '🛸',
    abilities: [],
    intentWeights: {
      attack: 0.7,
      defend: 0.2,
      charge: 0.1,
    },
  },
  {
    id: 'fighter',
    name: '星际战斗机',
    type: 'fighter',
    role: 'escort',
    priority: 3,
    hp: 50,
    shield: 20,
    attack: 12,
    defense: 0.1,
    evasion: 0.15,
    description: '标准战斗单位，攻防平衡',
    sprite: '🚀',
    abilities: [
      {
        id: 'missile_volley',
        name: '导弹齐射',
        description: '发射多枚导弹造成高额伤害',
        cooldown: 3,
        damage: 20,
      },
    ],
    intentWeights: {
      attack: 0.5,
      defend: 0.2,
      charge: 0.15,
      special: 0.15,
    },
  },
  {
    id: 'escort_drone',
    name: '护卫机',
    type: 'escort',
    role: 'escort',
    priority: 2,
    hp: 45,
    shield: 25,
    attack: 10,
    defense: 0.15,
    evasion: 0.1,
    description: '为主舰提供火力支援的护卫单位',
    sprite: '🛩️',
    abilities: [
      {
        id: 'intercept',
        name: '拦截射击',
        description: '快速射击造成伤害',
        cooldown: 2,
        damage: 15,
      },
    ],
    intentWeights: {
      attack: 0.6,
      defend: 0.25,
      charge: 0.1,
      special: 0.05,
    },
  },
  {
    id: 'jammer_drone',
    name: '干扰无人机',
    type: 'jammer',
    role: 'jammer',
    priority: 1,
    hp: 35,
    shield: 15,
    attack: 5,
    defense: 0.05,
    evasion: 0.25,
    description: '释放电子干扰，提高敌方能量消耗',
    sprite: '📡',
    energyCostIncrease: 2,
    abilities: [
      {
        id: 'emp_burst',
        name: 'EMP脉冲',
        description: '释放电磁脉冲干扰敌方系统',
        cooldown: 3,
        effect: 'increase_energy_cost',
      },
    ],
    intentWeights: {
      attack: 0.3,
      defend: 0.3,
      special: 0.4,
    },
  },
  {
    id: 'supply_ship',
    name: '补给艇',
    type: 'supply',
    role: 'supply',
    priority: 4,
    hp: 60,
    shield: 30,
    attack: 3,
    defense: 0.2,
    evasion: 0.05,
    description: '为友军提供维修和补给',
    sprite: '🚢',
    healAmount: 15,
    abilities: [
      {
        id: 'repair_drone',
        name: '维修无人机',
        description: '释放无人机修复友军',
        cooldown: 2,
        effect: 'heal_allies',
      },
    ],
    intentWeights: {
      attack: 0.1,
      defend: 0.3,
      repair: 0.5,
      special: 0.1,
    },
  },
  {
    id: 'cruiser',
    name: '重型巡洋舰',
    type: 'cruiser',
    role: 'mothership',
    priority: 5,
    hp: 100,
    shield: 50,
    attack: 18,
    defense: 0.2,
    evasion: 0.05,
    description: '装甲厚重的主力战舰，火力强大',
    sprite: '🛳️',
    abilities: [
      {
        id: 'main_cannon',
        name: '主炮轰击',
        description: '主炮充能后发射，造成毁灭性伤害',
        cooldown: 4,
        damage: 35,
      },
      {
        id: 'shield_recharge',
        name: '护盾充能',
        description: '紧急充能恢复护盾',
        cooldown: 3,
        effect: 'heal_shield',
      },
    ],
    intentWeights: {
      attack: 0.4,
      defend: 0.3,
      charge: 0.15,
      special: 0.1,
      repair: 0.05,
    },
  },
  {
    id: 'pirate_raider',
    name: '海盗突袭者',
    type: 'raider',
    role: 'mothership',
    priority: 5,
    hp: 40,
    shield: 15,
    attack: 15,
    defense: 0.05,
    evasion: 0.25,
    description: '神出鬼没的海盗船，擅长暴击',
    sprite: '🏴‍☠️',
    abilities: [
      {
        id: 'plunder',
        name: '掠夺攻击',
        description: '偷袭造成暴击伤害',
        cooldown: 2,
        damage: 25,
        effect: 'crit_guaranteed',
      },
    ],
    intentWeights: {
      attack: 0.6,
      charge: 0.25,
      special: 0.15,
    },
  },
  {
    id: 'alien_mothership',
    name: '异形母舰',
    type: 'boss',
    role: 'mothership',
    priority: 5,
    hp: 200,
    shield: 100,
    attack: 25,
    defense: 0.3,
    evasion: 0.1,
    description: '来自深空的神秘战舰，拥有未知的科技',
    sprite: '👾',
    abilities: [
      {
        id: 'plasma_burst',
        name: '等离子爆发',
        description: '释放等离子能量波，伤害并削弱目标',
        cooldown: 3,
        damage: 30,
        effect: 'reduce_evasion',
      },
      {
        id: 'hull_regeneration',
        name: '船体再生',
        description: '纳米机器人修复船体损伤',
        cooldown: 4,
        effect: 'heal_hp',
      },
      {
        id: 'graviton_pulse',
        name: '引力脉冲',
        description: '扰乱敌方系统，损坏随机舱室',
        cooldown: 5,
        effect: 'damage_cabin',
      },
    ],
    intentWeights: {
      attack: 0.35,
      defend: 0.2,
      charge: 0.15,
      special: 0.2,
      repair: 0.1,
    },
  },
];

export function createEnemy(templateId: string): Enemy {
  const template = enemyTemplates.find(t => t.id === templateId) || enemyTemplates[0];
  
  const enemy: Enemy = {
    id: `${template.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: template.name,
    type: template.type,
    role: template.role,
    priority: template.priority,
    isDestroyed: false,
    hp: template.hp,
    maxHp: template.hp,
    shield: template.shield,
    maxShield: template.shield,
    attack: template.attack,
    defense: template.defense,
    evasion: template.evasion,
    description: template.description,
    sprite: template.sprite,
    energyCostIncrease: template.energyCostIncrease,
    healAmount: template.healAmount,
    intent: {
      type: 'attack',
      value: template.attack,
      description: '准备攻击',
      icon: '⚔️',
    },
    abilities: template.abilities.map(a => ({
      ...a,
      currentCooldown: 0,
    })),
  };
  
  return generateEnemyIntent(enemy, template.intentWeights);
}

export function generateEnemyIntent(
  enemy: Enemy,
  weights?: Record<string, number>
): Enemy {
  if (enemy.isDestroyed) {
    return {
      ...enemy,
      intent: {
        type: 'defend',
        value: 0,
        description: '已被摧毁',
        icon: '💀',
      },
    };
  }

  const defaultWeights: Record<string, number> = {
    attack: 0.5,
    defend: 0.25,
    charge: 0.15,
    special: 0.1,
  };
  
  const useWeights = weights || defaultWeights;
  const totalWeight = Object.values(useWeights).reduce((sum, w) => sum + w, 0);
  
  let random = Math.random() * totalWeight;
  let selectedType = 'attack';
  
  for (const [type, weight] of Object.entries(useWeights)) {
    random -= weight;
    if (random <= 0) {
      selectedType = type;
      break;
    }
  }
  
  let availableSpecial = enemy.abilities.filter(a => a.currentCooldown === 0);
  if (selectedType === 'special' && availableSpecial.length === 0) {
    selectedType = 'attack';
  }
  
  const hpPercent = enemy.hp / enemy.maxHp;
  if (hpPercent < 0.3 && Math.random() < 0.3) {
    selectedType = 'defend';
  }
  
  let forcedSpecial: typeof availableSpecial[0] | undefined;
  
  if (enemy.shield < enemy.maxShield * 0.2 && Math.random() < 0.2) {
    const repairAbility = enemy.abilities.find(a => a.effect === 'heal_shield' && a.currentCooldown === 0);
    if (repairAbility) {
      selectedType = 'special';
      forcedSpecial = repairAbility;
    }
  }
  
  if (hpPercent < 0.25 && !forcedSpecial && Math.random() < 0.25) {
    const healAbility = enemy.abilities.find(a => a.effect === 'heal_hp' && a.currentCooldown === 0);
    if (healAbility) {
      selectedType = 'special';
      forcedSpecial = healAbility;
    }
  }
  
  availableSpecial = enemy.abilities.filter(a => a.currentCooldown === 0);
  if (selectedType === 'special' && availableSpecial.length === 0) {
    selectedType = 'attack';
    forcedSpecial = undefined;
  }
  
  let intent: EnemyIntent;
  
  switch (selectedType) {
    case 'attack':
      intent = {
        type: 'attack',
        value: Math.floor(enemy.attack * (0.8 + Math.random() * 0.4)),
        description: '准备攻击',
        icon: '⚔️',
      };
      break;
    case 'defend':
      intent = {
        type: 'defend',
        value: Math.floor(enemy.attack * 0.5),
        description: '进入防御姿态',
        icon: '🛡️',
      };
      break;
    case 'charge':
      intent = {
        type: 'charge',
        value: Math.floor(enemy.attack * 1.5),
        description: '蓄力中...',
        icon: '⚡',
      };
      break;
    case 'special':
      const special = forcedSpecial || availableSpecial[Math.floor(Math.random() * availableSpecial.length)];
      intent = {
        type: 'special',
        value: special.damage || 0,
        description: `准备释放 ${special.name}`,
        icon: '💥',
      };
      break;
    case 'repair':
      intent = {
        type: 'repair',
        value: enemy.healAmount || Math.floor(enemy.maxHp * 0.1),
        description: enemy.role === 'supply' ? '进行补给维修' : '进行维修',
        icon: '🔧',
      };
      break;
    default:
      intent = {
        type: 'attack',
        value: enemy.attack,
        description: '准备攻击',
        icon: '⚔️',
      };
  }
  
  return {
    ...enemy,
    intent,
  };
}

interface EnemyGroupConfig {
  mothershipId: string;
  escorts: string[];
  jammers: string[];
  supplies: string[];
}

const enemyGroupPresets: Record<number, EnemyGroupConfig[]> = {
  1: [
    { mothershipId: 'scout_drone', escorts: [], jammers: [], supplies: [] },
    { mothershipId: 'fighter', escorts: [], jammers: [], supplies: [] },
  ],
  2: [
    { mothershipId: 'fighter', escorts: ['escort_drone'], jammers: [], supplies: [] },
    { mothershipId: 'pirate_raider', escorts: ['scout_drone'], jammers: [], supplies: [] },
  ],
  3: [
    { mothershipId: 'cruiser', escorts: ['escort_drone'], jammers: ['jammer_drone'], supplies: [] },
    { mothershipId: 'pirate_raider', escorts: ['escort_drone', 'scout_drone'], jammers: [], supplies: [] },
  ],
  4: [
    { mothershipId: 'cruiser', escorts: ['escort_drone', 'fighter'], jammers: ['jammer_drone'], supplies: ['supply_ship'] },
    { mothershipId: 'alien_mothership', escorts: ['escort_drone'], jammers: ['jammer_drone'], supplies: [] },
  ],
  5: [
    { mothershipId: 'alien_mothership', escorts: ['escort_drone', 'fighter'], jammers: ['jammer_drone', 'jammer_drone'], supplies: ['supply_ship'] },
    { mothershipId: 'cruiser', escorts: ['fighter', 'fighter'], jammers: ['jammer_drone'], supplies: ['supply_ship', 'supply_ship'] },
  ],
};

export function createEnemyGroup(difficulty: number = 1): Enemy[] {
  const presets = enemyGroupPresets[Math.min(5, Math.max(1, difficulty))] || enemyGroupPresets[1];
  const preset = presets[Math.floor(Math.random() * presets.length)];
  
  const enemies: Enemy[] = [];
  const difficultyMultiplier = 1 + (difficulty - 1) * 0.15;
  
  const mothership = createEnemy(preset.mothershipId);
  mothership.hp = Math.floor(mothership.hp * difficultyMultiplier);
  mothership.maxHp = mothership.hp;
  mothership.shield = Math.floor(mothership.shield * difficultyMultiplier);
  mothership.maxShield = mothership.shield;
  mothership.attack = Math.floor(mothership.attack * difficultyMultiplier);
  enemies.push(mothership);
  
  for (const escortId of preset.escorts) {
    const escort = createEnemy(escortId);
    escort.hp = Math.floor(escort.hp * difficultyMultiplier);
    escort.maxHp = escort.hp;
    escort.shield = Math.floor(escort.shield * difficultyMultiplier);
    escort.maxShield = escort.shield;
    escort.attack = Math.floor(escort.attack * difficultyMultiplier);
    escort.targetId = mothership.id;
    enemies.push(escort);
  }
  
  for (const jammerId of preset.jammers) {
    const jammer = createEnemy(jammerId);
    jammer.hp = Math.floor(jammer.hp * difficultyMultiplier);
    jammer.maxHp = jammer.hp;
    jammer.shield = Math.floor(jammer.shield * difficultyMultiplier);
    jammer.maxShield = jammer.shield;
    enemies.push(jammer);
  }
  
  for (const supplyId of preset.supplies) {
    const supply = createEnemy(supplyId);
    supply.hp = Math.floor(supply.hp * difficultyMultiplier);
    supply.maxHp = supply.hp;
    supply.shield = Math.floor(supply.shield * difficultyMultiplier);
    supply.maxShield = supply.shield;
    supply.targetId = mothership.id;
    enemies.push(supply);
  }
  
  enemies.sort((a, b) => a.priority - b.priority);
  
  return enemies;
}

export function getRandomEnemyGroup(difficulty: number = 1): Enemy[] {
  return createEnemyGroup(difficulty);
}

export function getRoleLabel(role: EnemyRole): string {
  const labels: Record<EnemyRole, string> = {
    mothership: '主舰',
    escort: '护卫机',
    jammer: '干扰无人机',
    supply: '补给艇',
  };
  return labels[role];
}

export function getRoleColor(role: EnemyRole): string {
  const colors: Record<EnemyRole, string> = {
    mothership: 'text-neon-red',
    escort: 'text-neon-orange',
    jammer: 'text-neon-purple',
    supply: 'text-neon-green',
  };
  return colors[role];
}
