const {test} = require('node:test');
const assert = require('node:assert/strict');
const {inlineParts} = require('../src/lib/inline-format.cjs');
test('formats the supported emphasis subset without leaving visible delimiters', () => {
  assert.deepEqual(inlineParts('Un **hecho** y una *pausa*.'), [
    {kind: 'text', text: 'Un '}, {kind: 'strong', text: 'hecho'},
    {kind: 'text', text: ' y una '}, {kind: 'em', text: 'pausa'}, {kind: 'text', text: '.'}
  ]);
});
test('HTML, links and unmatched emphasis stay text rather than becoming executable markup', () => {
  const input = '<img src=x onerror=alert(1)> [abrir](javascript:alert(1)) *sin cierre';
  assert.deepEqual(inlineParts(input), [{kind: 'text', text: input}]);
  assert.deepEqual(inlineParts('**<script>bad()</script>**'), [{kind: 'strong', text: '<script>bad()</script>'}]);
});
