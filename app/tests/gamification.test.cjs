const {test} = require('node:test');
const assert = require('node:assert/strict');
const {calculateMilestones, WEEKLY_CHALLENGE} = require('../src/lib/gamification.cjs');

test('calcula hitos vacíos correctamente con 0 registros', () => {
  const milestones = calculateMilestones([]);
  assert.equal(milestones.length, 5);
  assert.ok(milestones.every(m => !m.unlocked));
  assert.equal(milestones[0].current, 0);
  assert.equal(milestones[0].percent, 0);
});

test('desbloquea Primera Pausa con 1 registro y calcula progreso proporcional', () => {
  const mockEntries = [
    {id: '1', battery: 60, reactivity: 'mente', bias: 'realidad', calib2: 'Hecho comprobable', learning: 'Aprendizaje real'}
  ];
  const milestones = calculateMilestones(mockEntries);
  const primera = milestones.find(m => m.id === 'primera_pausa');
  const tiferet = milestones.find(m => m.id === 'claridad_tiferet');
  const integracion = milestones.find(m => m.id === 'integracion_crecimiento');

  assert.equal(primera.unlocked, true);
  assert.equal(primera.current, 1);
  assert.equal(tiferet.unlocked, false);
  assert.equal(tiferet.current, 1); // 1 de 3
  assert.equal(integracion.unlocked, true);
});

test('desbloquea Claridad Tiféret y Guardián de Energía al alcanzar metas reales', () => {
  const mockEntries = [
    {battery: 50, calib2: 'H1', reactivity: 'observador'},
    {battery: 60, calib2: 'H2', reactivity: 'emocion'},
    {battery: 70, calib2: 'H3', reactivity: 'mente'},
    {battery: 40, calib2: 'H4', reactivity: 'impulso'},
    {battery: 80, calib2: 'H5', reactivity: 'observador'}
  ];
  const milestones = calculateMilestones(mockEntries);
  const tiferet = milestones.find(m => m.id === 'claridad_tiferet');
  const guardian = milestones.find(m => m.id === 'guardian_bateria');
  const observador = milestones.find(m => m.id === 'observador_lucido');

  assert.equal(tiferet.unlocked, true);
  assert.equal(guardian.unlocked, true);
  assert.equal(observador.unlocked, true);
});
