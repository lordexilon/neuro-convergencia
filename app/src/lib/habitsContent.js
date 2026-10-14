// Limpieza de citas académicas tipo [cite: 12] y formateo limpio
export function cleanCitations(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/\[cite:\s*\d+(?:\s*,\s*\d+)*\]/gi, '')
    .replace(/\s+([,.:;?!])/g, '$1')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export const HABIT_MODULES = [
  {
    id: 1,
    slug: 'como-funcionan-los-habitos',
    title: '¿Cómo Funcionan Los Hábitos?',
    subtitle: 'El ciclo neurológico y la regla de las 3 R',
    coverImage: '/habitos/mod1_cover.jpg',
    unlockedAt: 'initial', // Desbloqueado desde el inicio o hito inicial
    sections: [
      {
        id: 'mod1-theory-1',
        type: 'theory',
        title: 'Las 3 R del Cambio de Hábitos',
        image: '/habitos/mod1_3r.jpg',
        content: `Hay un patrón de 3 pasos que sigue cada hábito en nuestro cerebro:

**1. Recordatorio (Gatillo)**: La señal o disparador que inicia el comportamiento.
**2. Rutina (Acción)**: La acción física o mental que realizas.
**3. Recompensa (Beneficio)**: El beneficio o desahogo que obtiene tu cerebro, fijando el hábito para la próxima vez.`
      },
      {
        id: 'mod1-theory-2',
        type: 'theory',
        title: 'Ejemplo en la Vida Real',
        image: '/habitos/mod1_ejemplo.jpg',
        content: `Paso uno: Tu teléfono vibra (recordatorio).
Paso dos: Lo tomas y miras la pantalla (rutina).
Paso tres: Calmas la curiosidad de quién te escribe (recompensa).

Si la recompensa es efectiva, se forma un ciclo que le dice a tu mente: *"La próxima vez que ocurra este recordatorio, haz lo mismo"* sin gastar energía de decisión.`
      },
      {
        id: 'mod1-action-1',
        type: 'action',
        actionType: 'build_habit',
        title: 'Paso Práctico: Diseña tu Hábito de 3 R',
        description: 'Ancla tu nuevo hábito a un recordatorio que ya ocurra todos los días sin falta.',
        suggestedTriggers: [
          'Al poner los pies en el suelo al despertar',
          'Al terminar de cepillarme los dientes',
          'Al sentarme en el escritorio de trabajo',
          'Al apagar la luz para dormir',
          'Al hacer la primera pausa consciente del día'
        ],
        suggestedRewards: [
          'Sonreír y decirme: "Buen trabajo, un paso a la vez"',
          'Respirar hondo y saborear la calma',
          'Sentir la satisfacción de cumplir mi palabra',
          'Un estiramiento suave y gratificante'
        ]
      },
      {
        id: 'mod1-theory-3',
        type: 'theory',
        title: 'Paso 2: Hazlo Espectacularmente Simple',
        image: '/habitos/mod1_simple.jpg',
        content: `El error más común es querer cambiar toda tu vida en un día. Haz tu nueva rutina tan simple que sea imposible decir que no.

El cambio duradero es producto de hábitos cotidianos microscópicos. Lo importante al inicio no es la intensidad, sino convertirte en el tipo de persona que nunca falla a su cita con su nuevo hábito.`
      }
    ]
  },
  {
    id: 2,
    slug: 'sistemas-vs-metas',
    title: 'Sistemas vs. Metas',
    subtitle: 'El progreso continuo sin abrumarse',
    coverImage: '/habitos/mod2_cover.jpg',
    unlockedAt: '3_days',
    sections: [
      {
        id: 'mod2-theory-1',
        type: 'theory',
        title: 'El Problema con las Fechas Límite',
        image: '/habitos/mod2_cover.jpg',
        content: `Fijar metas sin diseñar el sistema diario genera ansiedad y frustración. Si te enfocas solo en la meta lejana ("escribir un libro" o "perder 10 kg"), te sientes insatisfecho hasta que lo logras.

En cambio, si te enamoras del sistema ("escribir 15 minutos cada mañana"), tienes éxito y satisfacción todos los días.`
      },
      {
        id: 'mod2-theory-2',
        type: 'theory',
        title: 'Los Hábitos Clave (Keystone Habits)',
        image: '/habitos/mod2_cover.jpg',
        content: `Los hábitos clave son pequeñas victorias que desencadenan un efecto dominó en tu vida. Al instaurar un solo hábito clave (como tender la cama, hacer 15 minutos de caminata o una pausa reflexiva al mediodía), tu mente asume una identidad de orden que transforma el resto de tus decisiones de forma natural.`
      },
      {
        id: 'mod2-action-1',
        type: 'action',
        actionType: 'mark_keystone',
        title: 'Paso Práctico: Identifica tu Hábito Clave',
        description: '¿Cuál es la acción que, cuando la realizas, hace que todo tu día fluya con mayor claridad y energía?',
        suggestedKeystones: [
          'Pausa de 3 minutos de respiración consciente matutina',
          'Caminar 20 minutos al aire libre',
          'Dejar la cocina y el escritorio ordenados antes de dormir',
          'Registrar mi calibración de energía en la bitácora'
        ]
      }
    ]
  },
  {
    id: 3,
    slug: 'erradicacion-y-reemplazo',
    title: 'Erradicación y Reemplazo',
    subtitle: 'Sustituye lo destructivo sin dejar vacíos',
    coverImage: '/habitos/mod3_cover.jpg',
    unlockedAt: '5_days',
    sections: [
      {
        id: 'mod3-theory-1',
        type: 'theory',
        title: 'El Estrés y el Aburrimiento',
        image: '/habitos/mod3_cover.jpg',
        content: `Tus hábitos no deseados están ahí por una razón: casi siempre son respuestas automáticas para amortiguar el estrés o llenar el aburrimiento. Como brindan un alivio biológico o emocional momentáneo, la simple fuerza de voluntad de "dejar de hacerlo" rara vez funciona a largo plazo.`
      },
      {
        id: 'mod3-theory-2',
        type: 'theory',
        title: 'No lo elimines: Reemplázalo',
        image: '/habitos/mod3_cover.jpg',
        content: `No puedes erradicar un hábito dejando un vacío en tu cerebro. Debes conservar el mismo recordatorio y la misma recompensa (alivio de tensión), pero sustituir la rutina por una respuesta centrada.

Por ejemplo: ante la señal de estrés, en lugar de mirar redes de forma compulsiva, tomas un vaso de agua fresca y haces 3 respiraciones profundas.`
      },
      {
        id: 'mod3-action-1',
        type: 'action',
        actionType: 'substitute_habit',
        title: 'Paso Práctico: Define tu Rutina Sustituta',
        description: 'Identifica la rutina automática que deseas transformar y define qué acción constructiva tomarás en su lugar.',
        suggestedSubstitutes: [
          { old: 'Scrollear redes por aburrimiento', replacement: 'Leer 2 páginas del libro o hacer 5 respiraciones' },
          { old: 'Comer azúcar por ansiedad', replacement: 'Beber un vaso de agua con limón o té de hierbas' },
          { old: 'Reaccionar con irritación ante una crítica', replacement: 'Pausa de 5 segundos y responder desde el Observador Lúcido' }
        ]
      }
    ]
  },
  {
    id: 4,
    slug: 'ecosistema-vida-sana',
    title: 'El Ecosistema de Vida Sana',
    subtitle: 'Diseña tu entorno y hábitos en familia',
    coverImage: '/habitos/mod4_cover.jpg',
    unlockedAt: '10_days',
    sections: [
      {
        id: 'mod4-theory-1',
        type: 'theory',
        title: 'La Base Biológica de la Voluntad',
        image: '/habitos/mod4_cover.jpg',
        content: `La claridad mental depende de tus ritmos biológicos. Dormir entre 7 y 9 horas, hidratarte de forma constante y mover tu cuerpo a diario son los cimientos que nutren tu batería energética (Gevurá y balance). Sin energía vital, cualquier intención de autorregulación se vuelve una batalla cuesta arriba.`
      },
      {
        id: 'mod4-theory-2',
        type: 'theory',
        title: 'El Entorno y Hábitos Compartidos',
        image: '/habitos/mod4_cover.jpg',
        content: `Las personas con mayor autodisciplina no sufren tentando a su fuerza de voluntad: diseñan su espacio físico y sus relaciones para que el buen hábito sea obvio y el hábito nocivo sea invisible. Hacer pausas compartidas y momentos sin pantallas en familia multiplica la coherencia colectiva.`
      },
      {
        id: 'mod4-action-1',
        type: 'action',
        actionType: 'ecosystem_check',
        title: 'Paso Práctico: Auditoría de tu Espacio',
        description: 'Elige un ajuste simple en tu entorno para proteger tu energía hoy.'
      }
    ]
  }
];
