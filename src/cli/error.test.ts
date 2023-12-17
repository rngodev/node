import { arrayToJsonPath, jsonPathToArray } from './error'

test('arrayToJsonPath handles only object fields', () => {
  expect(arrayToJsonPath(['a', 'b'])).toBe('a.b')
})

test('arrayToJsonPath handles object fields and array indexes', () => {
  expect(arrayToJsonPath(['a', '0', 'b', '1'])).toBe('a[0].b[1]')
})

test('jsonPathToArray handles only object fields', () => {
  expect(jsonPathToArray('a.b')).toEqual(['a', 'b'])
})

test('jsonPathToArray handles object fields and array indexes', () => {
  expect(jsonPathToArray('a[0].b[1]')).toEqual(['a', '0', 'b', '1'])
})
