import React from 'react';
import { Flame, AlertTriangle, Target, ChevronDown } from 'lucide-react';
import type { Cabin, Die, CabinType, Enemy } from '../../types';
import { useConfigStore } from '../../store/useConfigStore';
import { getRoleLabel } from '../../data/enemies';

interface CabinSlotProps {
  cabin: Cabin;
  assignedDice: Die[];
  totalPoints: number;
  onDrop: (cabinType: CabinType, dieId: string) => void;
  onRemoveDie: (dieId: string) => void;
  onSetDieTarget?: (dieId: string, targetId: string | null) => void;
  enemies?: Enemy[];
  selectedTargetId?: string | null;
  disabled?: boolean;
}

const cabinColors: Record<CabinType, { bg: string; border: string; text: string; icon: string }> = {
  engine: { bg: 'bg-neon-purple/10', border: 'border-neon-purple', text: 'text-neon-purple', icon: '🚀' },
  shield: { bg: 'bg-neon-cyan/10', border: 'border-neon-cyan', text: 'text-neon-cyan', icon: '🛡️' },
  weapon: { bg: 'bg-neon-red/10', border: 'border-neon-red', text: 'text-neon-red', icon: '⚔️' },
  repair: { bg: 'bg-neon-green/10', border: 'border-neon-green', text: 'text-neon-green', icon: '🔧' },
  scanner: { bg: 'bg-neon-yellow/10', border: 'border-neon-yellow', text: 'text-neon-yellow', icon: '📡' },
};

export const CabinSlot: React.FC<CabinSlotProps> = ({
  cabin,
  assignedDice,
  totalPoints,
  onDrop,
  onRemoveDie,
  onSetDieTarget,
  enemies = [],
  selectedTargetId,
  disabled,
}) => {
  const colors = cabinColors[cabin.type];
  const { config } = useConfigStore();
  const isOverheated = totalPoints > config.overheatThreshold;
  const isDamaged = cabin.damaged;
  const isWeapon = cabin.type === 'weapon';
  const activeEnemies = enemies.filter(e => !e.isDestroyed);

  const [showTargetMenu, setShowTargetMenu] = React.useState<string | null>(null);

  const getTargetName = (targetId: string | null) => {
    if (!targetId) return '默认目标';
    const target = enemies.find(e => e.id === targetId);
    if (!target) return '默认目标';
    return `${target.name} (${getRoleLabel(target.role)})`;
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!disabled && !isDamaged) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled || isDamaged) return;
    
    const dieId = e.dataTransfer.getData('dieId');
    if (dieId) {
      onDrop(cabin.type, dieId);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`
        cabin-slot relative
        ${colors.bg}
        ${isDamaged ? 'cabin-slot.damaged' : assignedDice.length > 0 ? 'cabin-slot.active' : ''}
        ${isOverheated ? 'ring-2 ring-neon-red' : ''}
        ${disabled || isDamaged ? 'opacity-60 cursor-not-allowed' : 'hover:border-opacity-60 cursor-pointer'}
        transition-all duration-200
      `}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{colors.icon}</span>
          <div>
            <h4 className={`font-display font-bold ${colors.text}`}>
              {cabin.name}
              <span className="ml-2 text-xs text-gray-400">Lv.{cabin.level}</span>
            </h4>
            <p className="text-xs text-gray-500">{cabin.description}</p>
          </div>
        </div>
        
        {isDamaged && (
          <div className="flex items-center gap-1 text-neon-red">
            <AlertTriangle className="w-4 h-4 animate-pulse" />
            <span className="text-xs">损坏中 ({cabin.cooldown})</span>
          </div>
        )}
        
        {isOverheated && (
          <div className="flex items-center gap-1 text-neon-red animate-pulse">
            <Flame className="w-4 h-4" />
            <span className="text-xs">过热!</span>
          </div>
        )}
      </div>

      {assignedDice.length > 0 && (
        <div className="space-y-2 mb-2">
          <div className="flex flex-wrap gap-2">
            {assignedDice.map(die => (
              <div key={die.id} className="relative">
                <div
                  className={`
                    w-10 h-10 rounded-lg flex items-center justify-center
                    font-display font-bold text-lg
                    ${colors.bg} border ${colors.border}
                    hover:scale-110 cursor-pointer transition-transform
                    ${isWeapon && die.targetId ? 'ring-2 ring-neon-yellow' : ''}
                  `}
                  onClick={() => !disabled && onRemoveDie(die.id)}
                >
                  {die.value}
                </div>
                {isWeapon && onSetDieTarget && activeEnemies.length > 1 && (
                  <button
                    className={`
                      absolute -top-1 -right-1 w-5 h-5 rounded-full
                      flex items-center justify-center
                      bg-neon-yellow text-space-900 text-xs
                      hover:scale-110 transition-transform
                    `}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (disabled) return;
                      setShowTargetMenu(showTargetMenu === die.id ? null : die.id);
                    }}
                    title="选择目标"
                  >
                    <Target className="w-3 h-3" />
                  </button>
                )}
                {showTargetMenu === die.id && (
                  <div className="absolute top-12 left-0 z-50 bg-space-800 border border-space-600 rounded-lg shadow-xl min-w-[150px]">
                    <div
                      className={`px-3 py-2 text-sm cursor-pointer hover:bg-space-700 ${!die.targetId ? 'text-neon-yellow' : 'text-gray-300'}`}
                      onClick={() => {
                        onSetDieTarget(die.id, null);
                        setShowTargetMenu(null);
                      }}
                    >
                      默认目标
                    </div>
                    {activeEnemies.map(enemy => (
                      <div
                        key={enemy.id}
                        className={`px-3 py-2 text-sm cursor-pointer hover:bg-space-700 flex items-center gap-2 ${die.targetId === enemy.id ? 'text-neon-yellow' : 'text-gray-300'}`}
                        onClick={() => {
                          onSetDieTarget(die.id, enemy.id);
                          setShowTargetMenu(null);
                        }}
                      >
                        <span>{enemy.sprite}</span>
                        <span className="truncate">{enemy.name}</span>
                        <span className="text-xs text-gray-500">({getRoleLabel(enemy.role)})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          {isWeapon && assignedDice.some(d => d.targetId) && (
            <div className="text-xs text-gray-400 space-y-1">
              {Array.from(new Set(assignedDice.filter(d => d.targetId).map(d => d.targetId))).map(targetId => {
                const targetDice = assignedDice.filter(d => d.targetId === targetId);
                const targetPoints = targetDice.reduce((sum, d) => sum + d.value, 0);
                return (
                  <div key={targetId} className="flex items-center justify-between">
                    <span>🎯 {getTargetName(targetId)}:</span>
                    <span className="text-neon-yellow font-bold">{targetPoints} 点</span>
                  </div>
                );
              })}
              {assignedDice.filter(d => !d.targetId).length > 0 && (
                <div className="flex items-center justify-between">
                  <span>🎯 {getTargetName(selectedTargetId || null)} (默认):</span>
                  <span className="text-neon-yellow font-bold">
                    {assignedDice.filter(d => !d.targetId).reduce((sum, d) => sum + d.value, 0)} 点
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {totalPoints > 0 && (
        <div className={`text-right font-display font-bold ${isOverheated ? 'text-neon-red' : colors.text}`}>
          总点数: {totalPoints}
          {isOverheated && (
            <span className="text-xs ml-2 text-neon-red">
              (超过阈值 {config.overheatThreshold})
            </span>
          )}
        </div>
      )}

      {isWeapon && activeEnemies.length > 1 && !disabled && (
        <div className="mt-2 pt-2 border-t border-space-600">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Target className="w-3 h-3" />
              当前目标:
            </span>
            <span className="text-neon-yellow font-bold truncate ml-2">
              {getTargetName(selectedTargetId || null)}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            点击骰子上的 🎯 按钮为单个骰子指定目标
          </p>
        </div>
      )}

      {isDamaged && (
        <div className="absolute inset-0 bg-neon-red/10 rounded-lg pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-neon-red/20 to-transparent animate-scan-line" />
        </div>
      )}
    </div>
  );
};
