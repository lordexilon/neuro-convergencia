'use strict';

const MILESTONE_DEFINITIONS = [
  {
    id: 'primera_pausa',
    name: 'Primera Pausa Consciente',
    icon: '🌱',
    description: 'Completar tu primer registro en la bitácora personal.',
    evaluate: (entries) => ({
      current: Math.min(entries.length, 1),
      target: 1,
      unlocked: entries.length >= 1
    })
  },
  {
    id: 'claridad_tiferet',
    name: 'Claridad Tiféret (Hechos)',
    icon: '⚖️',
    description: 'Completar 3 reflexiones contrastando hechos objetivos comprobables.',
    evaluate: (entries) => {
      const count = entries.filter(e => typeof e.calib2 === 'string' && e.calib2.trim().length > 0).length;
      return {
        current: Math.min(count, 3),
        target: 3,
        unlocked: count >= 3
      };
    }
  },
  {
    id: 'guardian_bateria',
    name: 'Guardián de la Energía',
    icon: '🔋',
    description: 'Calibrar y registrar tu nivel de batería energética en 5 momentos diferentes.',
    evaluate: (entries) => {
      const count = entries.filter(e => typeof e.battery === 'number').length;
      return {
        current: Math.min(count, 5),
        target: 5,
        unlocked: count >= 5
      };
    }
  },
  {
    id: 'observador_lucido',
    name: 'Observador Lúcido',
    icon: '👁️',
    description: 'Elegir el estado de Observador Consciente en tu respuesta ante un detonante.',
    evaluate: (entries) => {
      const count = entries.filter(e => e.reactivity === 'observador').length;
      return {
        current: Math.min(count, 1),
        target: 1,
        unlocked: count >= 1
      };
    }
  },
  {
    id: 'integracion_crecimiento',
    name: 'Integración & Crecimiento',
    icon: '✨',
    description: 'Escribir una lección aprendida en el campo de Integración y Crecimiento.',
    evaluate: (entries) => {
      const count = entries.filter(e => typeof e.learning === 'string' && e.learning.trim().length > 0).length;
      return {
        current: Math.min(count, 1),
        target: 1,
        unlocked: count >= 1
      };
    }
  }
];

function calculateMilestones(entries = []) {
  const safeEntries = Array.isArray(entries) ? entries : [];
  return MILESTONE_DEFINITIONS.map(def => {
    const evalResult = def.evaluate(safeEntries);
    const percent = Math.round((evalResult.current / evalResult.target) * 100);
    return {
      id: def.id,
      name: def.name,
      icon: def.icon,
      description: def.description,
      current: evalResult.current,
      target: evalResult.target,
      unlocked: evalResult.unlocked,
      percent
    };
  });
}

const WEEKLY_CHALLENGE = {
  title: 'Reto Semanal de Consciencia',
  prompt: 'Aplica el Protocolo de 3 Pasos: haz una pausa de 5 segundos y anota 1 hecho objetivo comprobable antes de responder.',
  target: 1
};

module.exports = {
  calculateMilestones,
  WEEKLY_CHALLENGE
};
