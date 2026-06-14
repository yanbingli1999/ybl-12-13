import { create } from 'zustand';
import type { 
  BattleState, BattleRecord, BattleLogEntry, 
  Enemy, ReplayData, ReplayAction
} from '../types';
import { getRandomEnemyGroup, generateEnemyIntent } from '../data/enemies';
import { useShipStore } from './useShipStore';
import { useDiceStore } from './useDiceStore';
import { useConfigStore } from './useConfigStore';
import { 
  executePlayerActions, 
  executeEnemyIntent, 
  checkBattleEnd,
  calculateReward,
  getDefaultTarget,
} from '../utils/battle';
import { addBattleRecord, loadBattleHistory, updateStats } from '../utils/storage';
import { unassignAllDice } from '../utils/dice';

interface GameState {
  battleState: BattleState | null;
  battleHistory: BattleRecord[];
  currentDifficulty: number;
  replayData: ReplayData | null;
  replayIndex: number;
  isReplaying: boolean;
  replaySpeed: number;
  
  startBattle: () => void;
  confirmTurn: () => void;
  fleeBattle: () => void;
  endBattle: (result: 'victory' | 'defeat' | 'fled') => void;
  addLog: (log: BattleLogEntry) => void;
  loadHistory: () => void;
  startReplay: (recordId: string) => void;
  nextReplayStep: () => void;
  prevReplayStep: () => void;
  stopReplay: () => void;
  setReplaySpeed: (speed: number) => void;
  setDifficulty: (difficulty: number) => void;
  resetBattle: () => void;
  setSelectedTarget: (targetId: string | null) => void;
  setDieTarget: (dieId: string, targetId: string | null) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  battleState: null,
  battleHistory: [],
  currentDifficulty: 1,
  replayData: null,
  replayIndex: -1,
  isReplaying: false,
  replaySpeed: 1,
  
  startBattle: () => {
    const { currentDifficulty } = get();
    const shipStore = useShipStore.getState();
    const config = useConfigStore.getState().config;
    
    shipStore.applyUpgradeEffects();
    const player = { ...shipStore.ship };
    player.hp = player.maxHp;
    player.shield = player.maxShield;
    player.energy = player.maxEnergy;
    player.cabins = player.cabins.map(c => ({ ...c, damaged: false, cooldown: 0 }));
    
    const enemies = getRandomEnemyGroup(currentDifficulty);
    const selectedTargetId = getDefaultTarget(enemies);
    
    const enemyNames = enemies.map(e => e.name).join('、');
    
    const battleState: BattleState = {
      id: `battle_${Date.now()}`,
      turn: 1,
      phase: 'player',
      player,
      enemies,
      selectedTargetId,
      logs: [{
        id: `log_${Date.now()}_start`,
        turn: 1,
        type: 'system',
        source: 'system',
        message: `战斗开始！遭遇 ${enemyNames}！`,
        timestamp: Date.now(),
      }],
      result: 'ongoing',
      startTime: Date.now(),
      rewardPoints: 0,
    };
    
    const replayData: ReplayData = {
      initialState: JSON.parse(JSON.stringify(battleState)),
      actions: [],
    };
    
    set({ 
      battleState, 
      replayData,
      replayIndex: -1,
      isReplaying: false,
    });
    
    useDiceStore.getState().resetDice();
  },
  
  setSelectedTarget: (targetId: string | null) => {
    const { battleState } = get();
    if (!battleState) return;
    
    set({
      battleState: {
        ...battleState,
        selectedTargetId: targetId,
      },
    });
  },
  
  setDieTarget: (dieId: string, targetId: string | null) => {
    const diceStore = useDiceStore.getState();
    const die = diceStore.dice.find(d => d.id === dieId);
    if (!die || die.assignedTo !== 'weapon') return;
    
    diceStore.setDice(
      diceStore.dice.map(d => 
        d.id === dieId ? { ...d, targetId } : d
      )
    );
  },
  
  confirmTurn: () => {
    const { battleState, replayData } = get();
    if (!battleState || battleState.phase !== 'player') return;
    
    const diceStore = useDiceStore.getState();
    const config = useConfigStore.getState().config;
    const shipStore = useShipStore.getState();
    
    const { dice } = diceStore;
    
    const originalDefenses: Record<string, number> = {};
    battleState.enemies.forEach(e => {
      originalDefenses[e.id] = e.defense;
    });
    
    let preparedEnemies = battleState.enemies.map(enemy => {
      if (!enemy.isDestroyed && enemy.intent.type === 'defend') {
        return { ...enemy, defense: enemy.defense + 0.2 };
      }
      return { ...enemy };
    });
    
    const playerResult = executePlayerActions(
      dice,
      battleState.player,
      preparedEnemies,
      battleState.selectedTargetId,
      config
    );
    
    let newState: BattleState = {
      ...battleState,
      player: playerResult.newPlayer,
      enemies: playerResult.newEnemies,
      logs: [...battleState.logs, ...playerResult.logs.map(l => ({ ...l, turn: battleState.turn }))],
    };
    
    const result = checkBattleEnd(newState.player, newState.enemies);
    if (result !== 'ongoing') {
      get().endBattle(result);
      return;
    }
    
    newState.phase = 'enemy';
    
    let currentPlayer = { ...newState.player };
    let currentEnemies = [...newState.enemies];
    let allEnemyLogs: BattleLogEntry[] = [];
    let totalDamageTaken = 0;
    
    for (let i = 0; i < currentEnemies.length; i++) {
      const enemy = currentEnemies[i];
      if (enemy.isDestroyed) continue;
      
      if (enemy.intent.type === 'special') {
        const abilityName = enemy.intent.description.replace('准备释放 ', '');
        const ability = enemy.abilities.find(a => a.name === abilityName && a.currentCooldown === 0);
        if (ability) {
          currentEnemies[i] = {
            ...currentEnemies[i],
            abilities: currentEnemies[i].abilities.map(a => 
              a.id === ability.id ? { ...a, currentCooldown: a.cooldown } : a
            ),
          };
        }
      }
      
      const enemyResult = executeEnemyIntent(
        currentEnemies[i],
        currentPlayer,
        currentEnemies,
        config
      );
      
      currentPlayer = {
        ...currentPlayer,
        hp: enemyResult.newPlayerHp,
        shield: enemyResult.newPlayerShield,
      };
      
      currentEnemies = enemyResult.newEnemies;
      
      if (enemyResult.effect === 'reduce_evasion') {
        currentPlayer = {
          ...currentPlayer,
          evasion: Math.max(0, currentPlayer.evasion - 0.1),
        };
      }
      
      if (enemyResult.effect === 'damage_cabin') {
        const undamagedCabins = currentPlayer.cabins.filter(c => !c.damaged);
        if (undamagedCabins.length > 0) {
          const randomCabin = undamagedCabins[Math.floor(Math.random() * undamagedCabins.length)];
          currentPlayer = {
            ...currentPlayer,
            cabins: currentPlayer.cabins.map(c => 
              c.id === randomCabin.id 
                ? { ...c, damaged: true, cooldown: config.repairCooldown }
                : c
            ),
          };
          enemyResult.logs.push({
            id: `log_${Date.now()}_cabin_${i}`,
            turn: battleState.turn,
            type: 'effect',
            source: 'enemy',
            message: `${randomCabin.name} 被损坏！`,
            timestamp: Date.now(),
          });
        }
      }
      
      if (enemyResult.effect === 'heal_hp') {
        const healAmount = Math.floor(enemy.maxHp * 0.15);
        const enemyIndex = currentEnemies.findIndex(e => e.id === enemy.id);
        if (enemyIndex >= 0) {
          currentEnemies[enemyIndex] = {
            ...currentEnemies[enemyIndex],
            hp: Math.min(currentEnemies[enemyIndex].maxHp, currentEnemies[enemyIndex].hp + healAmount),
          };
        }
        enemyResult.logs.push({
          id: `log_${Date.now()}_heal_${i}`,
          turn: battleState.turn,
          type: 'heal',
          source: 'enemy',
          message: `${enemy.name} 恢复 ${healAmount} HP`,
          value: healAmount,
          timestamp: Date.now(),
        });
      }
      
      if (enemyResult.effect === 'heal_shield') {
        const shieldAmount = Math.floor(enemy.maxShield * 0.3);
        const enemyIndex = currentEnemies.findIndex(e => e.id === enemy.id);
        if (enemyIndex >= 0) {
          currentEnemies[enemyIndex] = {
            ...currentEnemies[enemyIndex],
            shield: Math.min(currentEnemies[enemyIndex].maxShield, currentEnemies[enemyIndex].shield + shieldAmount),
          };
        }
        enemyResult.logs.push({
          id: `log_${Date.now()}_shield_${i}`,
          turn: battleState.turn,
          type: 'shield',
          source: 'enemy',
          message: `${enemy.name} 恢复 ${shieldAmount} 护盾`,
          value: shieldAmount,
          timestamp: Date.now(),
        });
      }
      
      totalDamageTaken += enemyResult.shieldResult.damage;
      allEnemyLogs = [...allEnemyLogs, ...enemyResult.logs.map(l => ({ ...l, turn: battleState.turn }))];
      
      const midBattleResult = checkBattleEnd(currentPlayer, currentEnemies);
      if (midBattleResult !== 'ongoing') {
        break;
      }
    }
    
    newState = {
      ...newState,
      player: currentPlayer,
      enemies: currentEnemies,
      logs: [...newState.logs, ...allEnemyLogs],
    };
    
    const finalResult = checkBattleEnd(newState.player, newState.enemies);
    if (finalResult !== 'ongoing') {
      get().endBattle(finalResult);
      return;
    }
    
    newState.enemies = newState.enemies.map(enemy => {
      if (battleState.enemies.find(e => e.id === enemy.id)?.intent.type === 'defend') {
        return { ...enemy, defense: originalDefenses[enemy.id] };
      }
      return enemy;
    });
    
    newState.enemies = newState.enemies.map(enemy => generateEnemyIntent(enemy));
    
    const playerEvasionReset = useShipStore.getState().ship.evasion;
    newState.player = {
      ...newState.player,
      evasion: playerEvasionReset,
    };
    
    const activeEnemies = newState.enemies.filter(e => !e.isDestroyed);
    if (newState.selectedTargetId && !activeEnemies.find(e => e.id === newState.selectedTargetId)) {
      newState.selectedTargetId = getDefaultTarget(newState.enemies);
    }
    
    newState.turn += 1;
    newState.phase = 'player';
    
    newState.player = {
      ...newState.player,
      energy: Math.min(newState.player.maxEnergy, newState.player.energy + Math.floor(newState.player.maxEnergy * 0.5)),
    };
    
    const replayAction: ReplayAction = {
      turn: battleState.turn,
      phase: 'player',
      action: 'turn',
      payload: { 
        dice: JSON.parse(JSON.stringify(dice)),
        selectedTargetId: newState.selectedTargetId,
      },
      resultingState: JSON.parse(JSON.stringify(newState)),
    };
    
    const newReplayData = replayData ? {
      ...replayData,
      actions: [...replayData.actions, replayAction],
    } : null;
    
    set({ 
      battleState: newState,
      replayData: newReplayData,
    });
    
    const newStats = {
      ...shipStore.stats,
      totalTurns: shipStore.stats.totalTurns + 1,
      totalDamageDealt: shipStore.stats.totalDamageDealt + playerResult.totalDamageDealt,
      totalDamageTaken: shipStore.stats.totalDamageTaken + totalDamageTaken,
    };
    updateStats(newStats);
    shipStore.stats = newStats;
    
    diceStore.setDice(unassignAllDice(dice));
  },
  
  fleeBattle: () => {
    get().endBattle('fled');
  },
  
  endBattle: (result) => {
    const { battleState, replayData } = get();
    if (!battleState) return;
    
    const shipStore = useShipStore.getState();
    
    const activeEnemyCount = battleState.enemies.filter(e => !e.isDestroyed).length;
    const reward = result === 'victory' 
      ? calculateReward(result, battleState.turn, get().currentDifficulty, battleState.enemies.length)
      : 0;
    
    const newState: BattleState = {
      ...battleState,
      result,
      phase: 'ended',
      endTime: Date.now(),
      rewardPoints: reward,
    };
    
    const newRecord: BattleRecord = {
      id: battleState.id,
      startTime: battleState.startTime,
      endTime: Date.now(),
      result,
      turns: battleState.turn,
      enemyTypes: battleState.enemies.map(e => e.type),
      enemyNames: battleState.enemies.map(e => e.name),
      playerHpRemaining: battleState.player.hp,
      enemiesHpRemaining: battleState.enemies.map(e => e.hp),
      replayData: replayData || { initialState: newState, actions: [] },
      rewardEarned: reward,
    };
    
    addBattleRecord(newRecord);
    
    if (reward > 0) {
      shipStore.addRewardPoints(reward);
    }
    
    const newStats = { ...shipStore.stats };
    newStats.totalBattles += 1;
    
    if (result === 'victory') {
      newStats.victories += 1;
      newStats.currentStreak += 1;
      newStats.longestStreak = Math.max(newStats.longestStreak, newStats.currentStreak);
    } else {
      newStats.defeats += 1;
      newStats.currentStreak = 0;
    }
    
    updateStats(newStats);
    shipStore.stats = newStats;
    
    set({ 
      battleState: newState,
      battleHistory: [newRecord, ...get().battleHistory],
    });
  },
  
  addLog: (log) => {
    const { battleState } = get();
    if (!battleState) return;
    
    set({
      battleState: {
        ...battleState,
        logs: [...battleState.logs, log],
      },
    });
  },
  
  loadHistory: () => {
    const history = loadBattleHistory();
    set({ battleHistory: history });
  },
  
  startReplay: (recordId) => {
    const { battleHistory } = get();
    const record = battleHistory.find(r => r.id === recordId);
    if (!record) return;
    
    set({
      replayData: record.replayData,
      replayIndex: -1,
      isReplaying: true,
      battleState: JSON.parse(JSON.stringify(record.replayData.initialState)),
    });
  },
  
  nextReplayStep: () => {
    const { replayData, replayIndex } = get();
    if (!replayData || replayIndex >= replayData.actions.length - 1) return;
    
    const nextIndex = replayIndex + 1;
    const action = replayData.actions[nextIndex];
    
    set({
      replayIndex: nextIndex,
      battleState: JSON.parse(JSON.stringify(action.resultingState)),
    });
  },
  
  prevReplayStep: () => {
    const { replayData, replayIndex } = get();
    if (!replayData || replayIndex <= 0) {
      if (replayIndex === 0) {
        set({
          replayIndex: -1,
          battleState: JSON.parse(JSON.stringify(replayData.initialState)),
        });
      }
      return;
    }
    
    const prevIndex = replayIndex - 1;
    const action = replayData.actions[prevIndex];
    
    set({
      replayIndex: prevIndex,
      battleState: JSON.parse(JSON.stringify(action.resultingState)),
    });
  },
  
  stopReplay: () => {
    set({
      replayData: null,
      replayIndex: -1,
      isReplaying: false,
      battleState: null,
    });
  },
  
  setReplaySpeed: (speed) => {
    set({ replaySpeed: speed });
  },
  
  setDifficulty: (difficulty) => {
    set({ currentDifficulty: difficulty });
  },
  
  resetBattle: () => {
    set({
      battleState: null,
      replayData: null,
      replayIndex: -1,
      isReplaying: false,
    });
    useDiceStore.getState().resetDice();
  },
}));
