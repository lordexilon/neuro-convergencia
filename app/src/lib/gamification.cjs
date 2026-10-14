'use strict';

/**
 * Hitos de consciencia y hábitos (Evaluados en base a hechos reales)
 */
const MILESTONE_DEFINITIONS = [
  // Hitos de Bitácora y Consciencia
  {
    id: 'primera_pausa',
    name: 'Primera Pausa Consciente',
    icon: '🌱',
    category: 'bitacora',
    description: 'Completar tu primer registro en la bitácora personal.',
    evaluate: ({ entries }) => ({
      current: Math.min(entries.length, 1),
      target: 1,
      unlocked: entries.length >= 1
    })
  },
  {
    id: 'claridad_tiferet',
    name: 'Claridad Tiféret (Hechos)',
    icon: '⚖️',
    category: 'bitacora',
    description: 'Completar 3 reflexiones contrastando hechos objetivos comprobables.',
    evaluate: ({ entries }) => {
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
    category: 'bitacora',
    description: 'Calibrar y registrar tu nivel de batería energética en 5 momentos diferentes.',
    evaluate: ({ entries }) => {
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
    category: 'bitacora',
    description: 'Elegir el estado de Observador Consciente en tu respuesta ante un detonante.',
    evaluate: ({ entries }) => {
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
    category: 'bitacora',
    description: 'Escribir una lección aprendida en el campo de Integración y Crecimiento.',
    evaluate: ({ entries }) => {
      const count = entries.filter(e => typeof e.learning === 'string' && e.learning.trim().length > 0).length;
      return {
        current: Math.min(count, 1),
        target: 1,
        unlocked: count >= 1
      };
    }
  },

  // Nuevos Hitos de Hábitos (N25)
  {
    id: 'arquitecto_3r',
    name: 'Arquitecto de Hábitos 3R',
    icon: '📐',
    category: 'habitos',
    description: 'Definir tu primer hábito con Recordatorio, Rutina y Recompensa.',
    evaluate: ({ habits }) => ({
      current: Math.min(habits.length, 1),
      target: 1,
      unlocked: habits.length >= 1
    })
  },
  {
    id: 'habito_clave_dominio',
    name: 'Piedra Angular (Keystone)',
    icon: '⭐',
    category: 'habitos',
    description: 'Identificar y activar al menos un Hábito Clave en tu sistema.',
    evaluate: ({ habits }) => {
      const keystones = habits.filter(h => h.is_keystone);
      return {
        current: Math.min(keystones.length, 1),
        target: 1,
        unlocked: keystones.length >= 1
      };
    }
  },
  {
    id: 'ritmo_constante_3dias',
    name: 'Ritmo en Movimiento',
    icon: '🌊',
    category: 'habitos',
    description: 'Acumular 3 días distintos con al menos una práctica de hábito registrada.',
    evaluate: ({ uniquePracticeDays }) => ({
      current: Math.min(uniquePracticeDays, 3),
      target: 3,
      unlocked: uniquePracticeDays >= 3
    })
  },
  {
    id: 'inercia_5dias',
    name: 'Inercia Positiva (5 Días)',
    icon: '🔥',
    category: 'habitos',
    description: 'Acumular 5 días con prácticas conscientes sin importar pausas.',
    evaluate: ({ uniquePracticeDays }) => ({
      current: Math.min(uniquePracticeDays, 5),
      target: 5,
      unlocked: uniquePracticeDays >= 5
    })
  },
  {
    id: 'arraigo_10dias',
    name: 'Arraigo del Sistema (10 Días)',
    icon: '🌳',
    category: 'habitos',
    description: 'Alcanzar 10 días de consolidación de tus micro-sistemas.',
    evaluate: ({ uniquePracticeDays }) => ({
      current: Math.min(uniquePracticeDays, 10),
      target: 10,
      unlocked: uniquePracticeDays >= 10
    })
  }
];

/**
 * Definición de los Capítulos del Libro y sus Criterios de Desbloqueo (N23/N25)
 */
const BOOK_CHAPTERS = [
  {
    chapterId: 'c0',
    number: 0,
    title: 'Introducción',
    pages: '4–8',
    coverImage: '/libro/cap0_introduccion.jpg',
    description: 'Por qué los hábitos moldean tu destino y cómo evitar la trampa de los 60 días.',
    evaluateUnlock: () => ({ unlocked: true, reason: 'Desbloqueado al registrarte en la plataforma.' })
  },
  {
    chapterId: 'c1',
    number: 1,
    title: '¿Cómo Funcionan Los Hábitos?',
    pages: '9–18',
    coverImage: '/libro/cap1_como_funcionan.jpg',
    description: 'Las 3 R del cambio neurológico: Recordatorio, Rutina y Recompensa.',
    evaluateUnlock: ({ milestones }) => {
      const m = milestones.find(item => item.id === 'primera_pausa');
      const unlocked = !!m?.unlocked;
      return {
        unlocked,
        reason: unlocked ? 'Completaste tu primera pausa en la bitácora.' : 'Completa tu primer registro en la bitácora.'
      };
    }
  },
  {
    chapterId: 'c2',
    number: 2,
    title: 'La Mejor Manera De Comenzar Su Nuevo Hábito',
    pages: '19–22',
    coverImage: '/libro/cap2_comenzar.jpg',
    description: 'Diseño intencional: anclar el hábito y hacerlo espectacularmente simple.',
    evaluateUnlock: ({ habits }) => {
      const unlocked = habits.length >= 1;
      return {
        unlocked,
        reason: unlocked ? 'Diseñaste tu primer hábito 3R.' : 'Define al menos 1 hábito con la regla de las 3 R.'
      };
    }
  },
  {
    chapterId: 'c3',
    number: 3,
    title: '¿Cómo Integrar Nuevos Hábitos A Su Vida?',
    pages: '23–28',
    coverImage: '/libro/cap3_integrar.jpg',
    description: 'Superar la inercia del día a día e incorporar rutinas sin fricción.',
    evaluateUnlock: ({ uniquePracticeDays }) => {
      const unlocked = uniquePracticeDays >= 3;
      return {
        unlocked,
        current: Math.min(uniquePracticeDays, 3),
        target: 3,
        reason: unlocked ? 'Alcanzaste 3 días de práctica activa.' : `${uniquePracticeDays} de 3 días de práctica acumulados.`
      };
    }
  },
  {
    chapterId: 'c4',
    number: 4,
    title: 'Cómo Hacer Grandes Cambios Sin Abrumarse',
    pages: '29–32',
    coverImage: '/libro/cap4_grandes_cambios.jpg',
    description: 'El poder de los hábitos clave (Keystone Habits) y la triple acción.',
    evaluateUnlock: ({ habits, uniquePracticeDays }) => {
      const hasKeystone = habits.some(h => h.is_keystone);
      const daysOk = uniquePracticeDays >= 5;
      const unlocked = hasKeystone && daysOk;
      return {
        unlocked,
        reason: unlocked
          ? 'Hábito clave activado y 5 días de práctica completados.'
          : 'Define un hábito clave y acumula 5 días de práctica.'
      };
    }
  },
  {
    chapterId: 'c5',
    number: 5,
    title: '¿Cómo Romper Un Mal Hábito Y Reemplazarlo Por Uno Bueno?',
    pages: '33–41',
    coverImage: '/libro/cap5_romper_mal_habito.jpg',
    description: 'Comprender el estrés y el aburrimiento; usar el poder del "PERO".',
    evaluateUnlock: ({ milestones }) => {
      const obs = milestones.find(m => m.id === 'observador_lucido');
      const unlocked = !!obs?.unlocked;
      return {
        unlocked,
        reason: unlocked
          ? 'Activaste el Observador Lúcido ante una reacción automática.'
          : 'Registra una respuesta desde el Observador Consciente en tu bitácora.'
      };
    }
  },
  {
    chapterId: 'c6',
    number: 6,
    title: 'Hábitos Sanos: Una Vida Sana',
    pages: '42–51',
    coverImage: '/libro/cap6_habitos_sanos.jpg',
    description: 'Los pilares biológicos: sueño reparador, nutrición consciente e hidratación.',
    evaluateUnlock: ({ milestones, uniquePracticeDays }) => {
      const batt = milestones.find(m => m.id === 'guardian_bateria');
      const unlocked = !!batt?.unlocked && uniquePracticeDays >= 10;
      return {
        unlocked,
        reason: unlocked
          ? 'Guardián de la Energía alcanzado y 10 días de práctica completados.'
          : 'Alcanza el hito Guardián de la Energía y 10 días de práctica.'
      };
    }
  },
  {
    chapterId: 'c7',
    number: 7,
    title: 'Hábitos Saludables En Familia',
    pages: '52–62',
    coverImage: '/libro/cap6_habitos_sanos.jpg', // Fallback estético generado
    description: 'Construir un ecosistema armónico en el hogar y sin pantallas en la mesa.',
    evaluateUnlock: ({ uniquePracticeDays, entries }) => {
      const hasRelational = entries.some(e =>
        Array.isArray(e.tags) && (e.tags.includes('empatia') || e.tags.includes('limites') || e.tags.includes('aislamiento'))
      );
      const unlocked = uniquePracticeDays >= 14 && hasRelational;
      return {
        unlocked,
        reason: unlocked
          ? '14 días de práctica y una reflexión relacional registradas.'
          : 'Acumula 14 días de práctica y al menos una reflexión sobre empatía o límites.'
      };
    }
  },
  {
    chapterId: 'c8',
    number: 8,
    title: 'Palabras Finales & Graduación',
    pages: '63–66',
    coverImage: '/libro/cap4_grandes_cambios.jpg', // Fallback estético sereno
    description: 'La consolidación definitiva y el puente hacia tu transformación continua.',
    evaluateUnlock: ({ uniquePracticeDays, surveyCompleted }) => {
      const daysOk = uniquePracticeDays >= 15;
      const unlocked = daysOk && !!surveyCompleted;
      return {
        unlocked,
        reason: unlocked
          ? '¡Graduación completada! Acceso a libro íntegro con marca de agua y membresía fundadora.'
          : 'Acumula 15 días de práctica y completa la valoración final de 21 días.'
      };
    }
  }
];

/**
 * Calcula hitos globales considerando bitácora y hábitos
 */
function calculateMilestones(entries = [], habits = [], practices = []) {
  const safeEntries = Array.isArray(entries) ? entries : [];
  const safeHabits = Array.isArray(habits) ? habits : [];
  const safePractices = Array.isArray(practices) ? practices : [];

  const uniqueDays = new Set(safePractices.map(p => p.practiced_at)).size;

  const context = {
    entries: safeEntries,
    habits: safeHabits,
    practices: safePractices,
    uniquePracticeDays: uniqueDays
  };

  return MILESTONE_DEFINITIONS.map(def => {
    const evalResult = def.evaluate(context);
    const target = evalResult.target || 1;
    const current = evalResult.current || 0;
    const percent = Math.round((current / target) * 100);
    return {
      id: def.id,
      name: def.name,
      icon: def.icon,
      category: def.category,
      description: def.description,
      current,
      target,
      unlocked: evalResult.unlocked,
      percent
    };
  });
}

/**
 * Evalúa el estado de desbloqueo de cada capítulo del libro
 */
function evaluateBookUnlocks(entries = [], habits = [], practices = [], surveyCompleted = false) {
  const milestones = calculateMilestones(entries, habits, practices);
  const uniqueDays = new Set((practices || []).map(p => p.practiced_at)).size;

  const context = {
    entries: entries || [],
    habits: habits || [],
    practices: practices || [],
    uniquePracticeDays: uniqueDays,
    milestones,
    surveyCompleted
  };

  return BOOK_CHAPTERS.map(ch => {
    const status = ch.evaluateUnlock(context);
    return {
      ...ch,
      unlocked: status.unlocked,
      unlockReason: status.reason,
      current: status.current,
      target: status.target
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
  evaluateBookUnlocks,
  BOOK_CHAPTERS,
  WEEKLY_CHALLENGE
};
