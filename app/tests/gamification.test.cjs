const {test} = require('node:test');
const assert = require('node:assert/strict');
const {calculateMilestones, evaluateBookUnlocks, WEEKLY_CHALLENGE} = require('../src/lib/gamification.cjs');

test('calcula hitos con arrays vacíos', () => {
  const milestones = calculateMilestones([], [], []);
  assert.equal(milestones.length, 10);
  assert.ok(milestones.every(m => !m.unlocked));
});

test('desbloquea hitos de hábitos correctamente', () => {
  const mockHabits = [
    { id: 'h1', title: 'Agua matutina', reminder: 'Despertar', routine: '1 vaso de agua', is_keystone: true }
  ];
  const mockPractices = [
    { habit_id: 'h1', practiced_at: '2026-10-10' },
    { habit_id: 'h1', practiced_at: '2026-10-11' },
    { habit_id: 'h1', practiced_at: '2026-10-12' }
  ];

  const milestones = calculateMilestones([], mockHabits, mockPractices);
  const arquitecto = milestones.find(m => m.id === 'arquitecto_3r');
  const keystone = milestones.find(m => m.id === 'habito_clave_dominio');
  const ritmo = milestones.find(m => m.id === 'ritmo_constante_3dias');

  assert.equal(arquitecto.unlocked, true);
  assert.equal(keystone.unlocked, true);
  assert.equal(ritmo.unlocked, true);
  assert.equal(ritmo.current, 3);
});

test('evalúa desbloqueo de capítulos progresivos del libro', () => {
  const mockEntries = [
    { id: 'e1', context: 'Detonante', calib2: 'Hecho real', battery: 60 }
  ];
  const mockHabits = [
    { id: 'h1', title: 'Hábito 1', reminder: 'R', routine: 'R', reward: 'R', is_keystone: true }
  ];
  const mockPractices = [
    { habit_id: 'h1', practiced_at: '2026-10-01' },
    { habit_id: 'h1', practiced_at: '2026-10-02' },
    { habit_id: 'h1', practiced_at: '2026-10-03' },
    { habit_id: 'h1', practiced_at: '2026-10-04' },
    { habit_id: 'h1', practiced_at: '2026-10-05' }
  ];

  const chapters = evaluateBookUnlocks(mockEntries, mockHabits, mockPractices);
  assert.equal(chapters.length, 9);

  const c0 = chapters.find(c => c.chapterId === 'c0');
  const c1 = chapters.find(c => c.chapterId === 'c1');
  const c2 = chapters.find(c => c.chapterId === 'c2');
  const c3 = chapters.find(c => c.chapterId === 'c3');
  const c4 = chapters.find(c => c.chapterId === 'c4');
  const c8 = chapters.find(c => c.chapterId === 'c8');

  assert.equal(c0.unlocked, true, 'C0 siempre desbloqueado');
  assert.equal(c1.unlocked, true, 'C1 desbloqueado con primera pausa');
  assert.equal(c2.unlocked, true, 'C2 desbloqueado con 1 hábito creado');
  assert.equal(c3.unlocked, true, 'C3 desbloqueado con 3 días');
  assert.equal(c4.unlocked, true, 'C4 desbloqueado con keystone + 5 días');
  assert.equal(c8.unlocked, false, 'C8 bloqueado hasta valoración');
});
