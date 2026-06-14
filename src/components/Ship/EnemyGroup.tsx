import React from 'react';
import { Heart, Shield, Target } from 'lucide-react';
import type { Enemy } from '../../types';
import { getRoleLabel, getRoleColor } from '../../data/enemies';
import { getIntentColor } from '../../utils/battle';

interface EnemyGroupProps {
  enemies: Enemy[];
  selectedTargetId: string | null;
  onSelectTarget: (enemyId: string) => void;
  disabled?: boolean;
}

const intentIcons: Record<string, string> = {
  attack: '⚔️',
  defend: '🛡️',
  charge: '⚡',
  special: '💥',
  repair: '🔧',
};

export const EnemyGroup: React.FC<EnemyGroupProps> = ({ 
  enemies, 
  selectedTargetId, 
  onSelectTarget,
  disabled = false
}) => {
  const activeEnemies = enemies.filter(e => !e.isDestroyed);
  const destroyedEnemies = enemies.filter(e => e.isDestroyed);

  const getHpColor = (hp: number, maxHp: number) => {
    const percent = (hp / maxHp) * 100;
    if (percent > 60) return 'bg-neon-green';
    if (percent > 30) return 'bg-neon-yellow';
    return 'bg-neon-red';
  };

  const getRoleBgColor = (role: Enemy['role']) => {
    const colors: Record<Enemy['role'], string> = {
      mothership: 'from-red-900/30',
      escort: 'from-orange-900/30',
      jammer: 'from-purple-900/30',
      supply: 'from-green-900/30',
    };
    return colors[role];
  };

  return (
    <div className="space-y-3">
      {activeEnemies.map((enemy) => {
        const isSelected = selectedTargetId === enemy.id;
        const roleColor = getRoleColor(enemy.role);
        const hpPercent = (enemy.hp / enemy.maxHp) * 100;
        const shieldPercent = (enemy.shield / enemy.maxShield) * 100;
        const intentColor = getIntentColor(enemy.intent);

        return (
          <div
            key={enemy.id}
            onClick={() => !disabled && onSelectTarget(enemy.id)}
            className={`
              relative glass-panel p-4 rounded-xl cursor-pointer transition-all duration-200
              bg-gradient-to-br ${getRoleBgColor(enemy.role)} to-space-800/80
              ${isSelected 
                ? 'ring-2 ring-neon-yellow shadow-lg shadow-neon-yellow/20 scale-[1.02]' 
                : 'hover:ring-1 hover:ring-neon-yellow/50 hover:scale-[1.01'}
              ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
            `}
          >
            {isSelected && (
              <div className="absolute -top-2 -right-2 bg-neon-yellow text-space-900 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
              <Target className="w-3 h-3" />
              目标
            </div>
            )}

            <div className="flex items-start gap-3">
              <div className="text-4xl flex-shrink-0">{enemy.sprite}</div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-display font-bold text-white truncate">
                    {enemy.name}
                  </h4>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${roleColor} bg-space-700/50`}>
                    {getRoleLabel(enemy.role)}
                  </span>
                </div>

                <div className="space-y-2">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="flex items-center gap-1 text-xs text-neon-red">
                        <Heart className="w-3 h-3" />
                        HP
                      </span>
                      <span className="text-xs font-display">
                        {enemy.hp} / {enemy.maxHp}
                      </span>
                    </div>
                    <div className="h-2 bg-space-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getHpColor(enemy.hp, enemy.maxHp)} transition-all duration-300`}
                        style={{ width: `${hpPercent}%` }}
                      />
                    </div>
                  </div>

                  {enemy.maxShield > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="flex items-center gap-1 text-xs text-neon-cyan">
                          <Shield className="w-3 h-3" />
                          护盾
                        </span>
                        <span className="text-xs font-display">
                          {enemy.shield} / {enemy.maxShield}
                        </span>
                      </div>
                      <div className="h-2 bg-space-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-neon-cyan transition-all duration-300"
                          style={{ width: `${shieldPercent}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-space-600">
                  <div className="flex items-center gap-2">
                    <div className={`text-xl ${enemy.intent.type === 'charge' ? 'animate-pulse' : ''}`}>
                      {intentIcons[enemy.intent.type] || '❓'}
                    </div>
                    <div className="flex-1">
                      <div className={`text-sm font-display font-bold ${intentColor}`}>
                        {enemy.intent.description}
                      </div>
                      {enemy.intent.value > 0 && (
                        <div className="text-xs text-gray-400">
                          数值: <span className={intentColor}>{enemy.intent.value}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {enemy.abilities.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {enemy.abilities.map(ability => (
                      <div
                        key={ability.id}
                        className={`
                          px-2 py-0.5 rounded text-xs
                          ${ability.currentCooldown > 0 
                            ? 'bg-space-700 text-gray-500' 
                            : 'bg-neon-purple/20 text-neon-purple border border-neon-purple/30'}
                        `}
                        title={ability.description}
                      >
                        {ability.name}
                        {ability.currentCooldown > 0 && ` (${ability.currentCooldown})`}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {enemy.role === 'jammer' && enemy.energyCostIncrease && (
              <div className="absolute top-2 right-2 bg-neon-purple/80 text-white px-2 py-0.5 rounded text-xs font-bold">
                ⚡ +{enemy.energyCostIncrease} 能耗
              </div>
            )}

            {enemy.role === 'supply' && enemy.healAmount && (
              <div className="absolute top-2 right-2 bg-neon-green/80 text-space-900 px-2 py-0.5 rounded text-xs font-bold">
                🔧 +{enemy.healAmount} 治疗
              </div>
            )}
          </div>
        );
      })}

      {destroyedEnemies.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-space-600">
          <div className="text-xs text-gray-500 text-center">已摧毁</div>
          {destroyedEnemies.map((enemy) => (
            <div
              key={enemy.id}
              className="glass-panel p-3 rounded-lg opacity-40"
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl grayscale">{enemy.sprite}</span>
                <span className="text-gray-500 line-through">{enemy.name}</span>
                <span className="text-xs text-gray-600">({getRoleLabel(enemy.role)})</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
